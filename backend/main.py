from vectorstore import load_to_vectorStore, semantic_search, get_full_resume
from clerk_backend_api.security.types import AuthenticateRequestOptions
from langchain_google_genai import ChatGoogleGenerativeAI
from fastapi import FastAPI, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from extract_text import extract_text
from clerk_backend_api import Clerk
from fastapi import HTTPException
from dotenv import load_dotenv
from pydantic import BaseModel
import json
import uuid
import os
load_dotenv()


app = FastAPI()
origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(os.getenv("SUPABASE_URL"),os.getenv("SUPABASE_KEY"))
sdk = Clerk(bearer_auth=os.getenv('CLERK_SECRET_KEY'))
model = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite")
AUTHORIZED_PARTIES = ["http://localhost:3000"]

MAX_SIZE = 10 * 1024 * 1024

class SearchRequest(BaseModel):
    query: str
    user_id: str


def get_clerk_id(request: Request):
    request_state = sdk.authenticate_request(request,AuthenticateRequestOptions(authorized_parties=AUTHORIZED_PARTIES))

    if not request_state.is_signed_in:
        raise HTTPException(status_code=401,detail="Unauthorized")

    return request_state.payload["sub"]

def get_user_id(clerk_id: str):
    db_user = supabase.table("users").select("id").eq("clerk_id", clerk_id).single().execute()
    
    if not db_user.data:
        raise HTTPException(status_code=404, detail=f"User not found for clerk_id: {clerk_id}")
    
    return db_user.data["id"]

def get_active_resume(user_id: str):

    resume = supabase.table("resumes").select("*").eq("user_id", user_id).eq("is_active", True).single().execute()

    if not resume.data:
        raise HTTPException(status_code=404,detail="No active resume found")

    return resume.data

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/check-user")
async def check_user(request: Request):

    clerk_id = get_clerk_id(request)

    user = sdk.users.get(user_id=clerk_id)

    supabase.table("users").upsert({
        "clerk_id": user.id,
        "email": user.email_addresses[0].email_address,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "image_url": user.image_url
    }).execute()

    return {"userId": get_user_id(user.id)}

@app.post("/upload-resume")
async def upload_resume(request: Request,file: UploadFile = File(...)):

    clerk_id = get_clerk_id(request)
    user_id = get_user_id(clerk_id)

    if file.content_type != "application/pdf":
        raise HTTPException(400, "PDF only")

    content = await file.read()

    if len(content) > MAX_SIZE:
        raise HTTPException(400, "File too large")

    resume_id = None

    try:

        supabase.table("resumes").update({"is_active": False}).eq("user_id",user_id).execute()

        path = f"{user_id}/{uuid.uuid4()}.pdf"

        supabase.storage.from_("resumes").upload(path,content,{"upsert": "true"})

        # resume = supabase.table("resumes").insert({"user_id": user_id,"storage_path": path,"processing_status": "processing","is_active": True}).execute()
        try:
            resume = supabase.table("resumes").insert({
                "user_id": user_id,
                "storage_path": path,
                "processing_status": "processing",
                "is_active": True
            }).execute()
            print("resume inserted:", resume)
        except Exception as e:
            print("INSERT ERROR:", repr(e))
            raise
        print("updated on supabase")
        resume_id = resume.data[0]["id"]

        docs = extract_text(content,path,user_id,resume_id)
        load_to_vectorStore(docs,user_id)
        print("loaded to vector store")
        supabase.table("resumes").update({"processing_status": "completed"}).eq("id",resume_id).execute()
        print("uploaded to supabase again")

        return {"success": True,"resume_id": resume_id}

    except Exception as e:

        if resume_id:
            supabase.table("resumes").update({"processing_status": "failed"}).eq("id",resume_id).execute()

        raise HTTPException(status_code=500,detail=f"Failed to process resume: {e}")


@app.post("/resume-context")
async def resume_context(request: Request,data: SearchRequest):

    api_key = request.headers.get("X-API-Key")

    if api_key != os.getenv("VAPI_TOOL_SECRET"):
        raise HTTPException(status_code=401,detail="Unauthorized")

    docs = semantic_search(data.query,data.user_id)

    context = "\n".join(
        doc.page_content
        for doc in docs
    )

    return {"context": context}




@app.post("/analysis")
async def analyze_resume(request: Request):

    clerk_id = get_clerk_id(request)
    user_id = get_user_id(clerk_id)

    resume = get_active_resume(user_id)
    resume_id = resume["id"]

    docs = get_full_resume(user_id)

    if not docs:
        raise HTTPException(status_code=404,detail="No resume content found")

    context = "\n".join(
        doc.page_content
        for doc in docs
    )

    prompt = f"""You are an ATS Resume Analyzer.

        Analyze the following resume.

        Return ONLY valid JSON.

        {{
            "ats_score": 0,
            "strengths": [
                "point 1",
                "point 2",
                "point 3"
            ],
            "weaknesses": [
                "point 1",
                "point 2",
                "point 3"
            ],
            "suggestions": [
                "point 1",
                "point 2",
                "point 3"
            ]
        }}

        Resume:

        {context}"""

    try:
        response = model.invoke(prompt)

        response_text = str(response.content).strip()

        if response_text.startswith("```json"):
            response_text = response_text.replace("```json","",1)

        if response_text.endswith("```"):
            response_text = response_text[:-3]

        response_text = response_text.strip()

        result = json.loads(response_text)

        supabase.table("resume_analyses").upsert({
            "resume_id": resume_id,
            "ats_score": result["ats_score"],
            "strengths": json.dumps(result["strengths"]),
            "weaknesses": json.dumps(result["weaknesses"]),
            "suggestions": json.dumps(result["suggestions"])
        }, on_conflict="resume_id").execute()

        return result

    except json.JSONDecodeError:
        raise HTTPException(status_code=500,detail=f"Gemini returned invalid JSON: {response_text}")

    except Exception as e:
        raise HTTPException(status_code=500,detail=f"Resume analysis failed: {str(e)}")
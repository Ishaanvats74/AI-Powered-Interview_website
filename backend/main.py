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
from typing import List
import json
import uuid
import os

load_dotenv()

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
    "https://ai-powered-interview-website-theta.vercel.app",
    "https://ai-powered-interview-website-h50lycr4s-ishaanvats74s-projects.vercel.app",
    "https://ai-powered-interview-website-git-main-ishaanvats74s-projects.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
sdk = Clerk(bearer_auth=os.getenv('CLERK_SECRET_KEY'))
model = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite")
AUTHORIZED_PARTIES = ["http://localhost:3000","https://ai-powered-interview-website-theta.vercel.app","https://ai-powered-interview-website-git-main-ishaanvats74s-projects.vercel.app","https://ai-powered-interview-website-h50lycr4s-ishaanvats74s-projects.vercel.app"]
MAX_SIZE = 10 * 1024 * 1024


# ─── Models ──────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    user_id: str


class Message(BaseModel):
    role: str
    text: str


class SaveInterviewRequest(BaseModel):
    messages: List[Message]
    interview_type: str
    difficulty: str
    duration_seconds: int


# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_clerk_id(request: Request) -> str:
    request_state = sdk.authenticate_request(
        request, AuthenticateRequestOptions(authorized_parties=AUTHORIZED_PARTIES)
    )
    if not request_state.is_signed_in:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return request_state.payload["sub"]


def get_user_id(clerk_id: str) -> str:
    try:
        db_user = (
            supabase.table("users")
            .select("id")
            .eq("clerk_id", clerk_id)
            .single()
            .execute()
        )
        if not db_user.data:
            raise HTTPException(status_code=404, detail=f"User not found for clerk_id: {clerk_id}")
        return db_user.data["id"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user: {str(e)}")


def get_active_resume(user_id: str) -> dict:
    try:
        resume = (
            supabase.table("resumes")
            .select("*")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .single()
            .execute()
        )
        if not resume.data:
            raise HTTPException(
                status_code=404,
                detail="No active resume found. Please upload a resume first."
            )
        return resume.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active resume: {str(e)}")


def parse_gemini_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/check-user")
async def check_user(request: Request):
    clerk_id = get_clerk_id(request)
    user = sdk.users.get(user_id=clerk_id)

    supabase.table("users").upsert({"clerk_id": user.id,"email": user.email_addresses[0].email_address,"first_name": user.first_name,"last_name": user.last_name,"image_url": user.image_url,},on_conflict="clerk_id",).execute()

    return {"userId": get_user_id(user.id)}


@app.post("/upload-resume")
async def upload_resume(request: Request, file: UploadFile = File(...)):
    clerk_id = get_clerk_id(request)
    user_id = get_user_id(clerk_id)

    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files are allowed.")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(400, "File too large. Max size is 10 MB.")

    resume_id = None

    try:
        existing_resume = supabase.table("resumes").select("id").eq("user_id", user_id).maybe_single().execute()

        if existing_resume and existing_resume.data:
            old_resume_id = existing_resume.data["id"]
            supabase.table("resume_analyses").delete().eq("resume_id", old_resume_id).execute()
            print(f"Deleted old analysis for resume: {old_resume_id}")

        path = f"{user_id}/{uuid.uuid4()}.pdf"
        supabase.storage.from_("resumes").upload(path, content, {"upsert": "true"})
        print(f"Uploaded to storage: {path}")

        resume = supabase.table("resumes").upsert({"user_id": user_id,"storage_path": path,"processing_status": "processing","is_active": True,},on_conflict="user_id",).execute()

        resume_id = resume.data[0]["id"]
        print(f"Resume upserted: {resume_id}")

        docs = extract_text(content, path, user_id, resume_id)
        load_to_vectorStore(docs, user_id)
        print(f"Loaded {len(docs)} docs to vector store")

        supabase.table("resumes").update({"processing_status": "completed"}).eq("id", resume_id).execute()
        print(f"Resume marked as completed: {resume_id}")

        return {"success": True, "resume_id": resume_id}

    except HTTPException:
        raise

    except Exception as e:
        print(f"Upload error: {repr(e)}")
        if resume_id:
            supabase.table("resumes").update({"processing_status": "failed"}).eq("id", resume_id).execute()
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")


@app.post("/resume-context")
async def resume_context(request: Request,data: SearchRequest):
    api_key = request.headers.get("X-API-Key")

    if api_key != os.getenv("VAPI_TOOL_SECRET"):
        raise HTTPException(status_code=401,detail="Unauthorized")

    docs = semantic_search(data.query,data.user_id)

    if not docs:
        return {
            "query": data.query,
            "chunks_found": 0,
            "context": "No resume information found."
        }

    context = "\n\n".join(
        doc.page_content
        for doc in docs
    )

    return {
        "query": data.query,
        "chunks_found": len(docs),
        "context": context
    }


@app.post("/analysis")
async def analyze_resume(request: Request):
    clerk_id = get_clerk_id(request)
    user_id = get_user_id(clerk_id)

    resume = get_active_resume(user_id)
    resume_id = resume["id"]

    existing = supabase.table("resume_analyses").select("*").eq("resume_id", resume_id).maybe_single().execute()

    if existing and existing.data:
        print(f"Returning cached analysis for resume: {resume_id}")
        data = existing.data
        return {
            "ats_score": data["ats_score"],
            "strengths": json.loads(data["strengths"]) if isinstance(data["strengths"], str) else data["strengths"],
            "weaknesses": json.loads(data["weaknesses"]) if isinstance(data["weaknesses"], str) else data["weaknesses"],
            "suggestions": json.loads(data["suggestions"]) if isinstance(data["suggestions"], str) else data["suggestions"],
        }

    docs = get_full_resume(user_id)
    if not docs:
        raise HTTPException(status_code=404, detail="No resume content found. Please upload your resume again.")

    context = "\n".join(doc.page_content for doc in docs)

    prompt = f"""You are an ATS Resume Analyzer.

        Analyze the following resume and return ONLY valid JSON with no markdown, no explanation, no extra text.

        {{
            "ats_score": <integer 0-100>,
            "strengths": ["point 1", "point 2", "point 3"],
            "weaknesses": ["point 1", "point 2", "point 3"],
            "suggestions": ["point 1", "point 2", "point 3"]
        }}

        Resume:

        {context}"""

    try:
        response = model.invoke(prompt)
        result = parse_gemini_json(str(response.content))

        for key in ["ats_score", "strengths", "weaknesses", "suggestions"]:
            if key not in result:
                raise ValueError(f"Missing key in Gemini response: {key}")

        supabase.table("resume_analyses").upsert({
                "resume_id": resume_id,
                "ats_score": result["ats_score"],
                "strengths": json.dumps(result["strengths"]),
                "weaknesses": json.dumps(result["weaknesses"]),
                "suggestions": json.dumps(result["suggestions"]),
            },on_conflict="resume_id",).execute()

        print(f"Analysis saved for resume: {resume_id}")
        return result

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Gemini returned invalid JSON. Please try again.")
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"Analysis error: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {str(e)}")


@app.post("/save-interview")
async def save_interview(request: Request, data: SaveInterviewRequest):
    clerk_id = get_clerk_id(request)
    user_id = get_user_id(clerk_id)

    if not data.messages:
        raise HTTPException(status_code=400,detail="No messages to save.")

    try:
        interview = supabase.table("interviews").insert({"user_id": user_id,"duration_seconds": data.duration_seconds,"interview_type": data.interview_type,"difficulty": data.difficulty,"status": "processing",}).execute()

        interview_id = interview.data[0]["id"]

        messages_to_insert = [
            {
                "interview_id": interview_id,
                "role": msg.role,
                "content": msg.text,
                "timestamp_seconds": index,
            }
            for index, msg in enumerate(data.messages)
        ]

        supabase.table("interview_messages").insert(messages_to_insert).execute()

        conversation_text = "\n".join(
            f"{msg.role.upper()}: {msg.text}"
            for msg in data.messages
        )

        prompt = f"""
            You are an expert interview coach evaluating a mock interview.

            Analyze the following interview conversation and return ONLY valid JSON.

            {{
                "score": <integer 0-100>,
                "technical_score": <integer 0-100>,
                "communication_score": <integer 0-100>,
                "confidence_score": <integer 0-100>,
                "problem_solving_score": <integer 0-100>,
                "feedback": "<2-3 sentence overall feedback>",
                "strengths": ["point 1", "point 2", "point 3"],
                "weaknesses": ["point 1", "point 2", "point 3"],
                "recommendations": ["point 1", "point 2", "point 3"]
            }}

            Interview Type: {data.interview_type}
            Difficulty: {data.difficulty}
            Duration: {data.duration_seconds} seconds

            Conversation:
            {conversation_text}
            """
        
        response = model.invoke(prompt)

        result = parse_gemini_json(str(response.content))

        for key in [
            "score",
            "technical_score",
            "communication_score",
            "confidence_score",
            "problem_solving_score",
            "feedback",
            "strengths",
            "weaknesses",
            "recommendations",
        ]:
            if key not in result:
                raise ValueError(f"Missing key in Gemini response: {key}")

        supabase.table("interviews").update({"score": result["score"],"feedback": result["feedback"],"strengths": json.dumps(result["strengths"]),"weaknesses": json.dumps(result["weaknesses"]),"recommendations": json.dumps(result["recommendations"]),"status": "completed","technical_score": result["technical_score"],"communication_score": result["communication_score"],"confidence_score": result["confidence_score"],"problem_solving_score": result["problem_solving_score"],}).eq("id",interview_id).execute()

        return {
            "success": True,
            "interview_id": interview_id,
            "score": result["score"],
            "feedback": result["feedback"],
            "strengths": result["strengths"],
            "weaknesses": result["weaknesses"],
            "recommendations": result["recommendations"],
        }

    except Exception as e:
        print(f"Save interview error: {repr(e)}")

        try:
            supabase.table("interviews").update({"status": "evaluation_failed"}).eq("id",interview_id).execute()
        except:
            pass

        raise HTTPException(status_code=500,detail=f"Failed to save interview: {str(e)}")




@app.get("/interview-result/{interview_id}")
async def get_interview_result(interview_id: str, request: Request):
    clerk_id = get_clerk_id(request)
    user_id = get_user_id(clerk_id)

    try:
        interview = supabase.table("interviews").select("*").eq("id", interview_id).eq("user_id", user_id).single().execute()

        if not interview.data:
            raise HTTPException(status_code=404, detail="Interview not found.")

        data = interview.data

        return {
            "score": data["score"],
            "feedback": data["feedback"],
            "strengths": json.loads(data["strengths"]) if isinstance(data["strengths"], str) else data["strengths"],
            "weaknesses": json.loads(data["weaknesses"]) if isinstance(data["weaknesses"], str) else data["weaknesses"],
            "recommendations": json.loads(data["recommendations"]) if isinstance(data["recommendations"], str) else data["recommendations"],
            "difficulty": data.get("difficulty", "medium"),
            "duration_seconds": data["duration_seconds"],
            "interview_type": data["interview_type"],
            "technical_score": data.get("technical_score", 0),
            "communication_score": data.get("communication_score", 0),
            "confidence_score": data.get("confidence_score", 0),
            "problem_solving_score": data.get("problem_solving_score", 0),
            }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get interview result error: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get interview result: {str(e)}")


@app.get("/dashboard")
async def get_dashboard(request: Request):
    clerk_id = get_clerk_id(request)
    user_id = get_user_id(clerk_id)

    try:
        interviews_res = supabase.table("interviews").select("*").eq("user_id", user_id).eq("status", "completed").order("created_at", desc=True).execute()

        interviews = interviews_res.data or []

        total_interviews = len(interviews)
        scores = [i["score"] for i in interviews if i.get("score") is not None]
        average_score = round(sum(scores) / len(scores)) if scores else 0
        best_score = max(scores) if scores else 0
        total_practice_seconds = sum(i.get("duration_seconds", 0) for i in interviews)
        total_practice_minutes = round(total_practice_seconds / 60)

        ats_score = 0
        active_resume = supabase.table("resumes").select("id").eq("user_id", user_id).eq("is_active", True).maybe_single().execute()

        if active_resume and active_resume.data:
            analysis = supabase.table("resume_analyses").select("ats_score").eq("resume_id", active_resume.data["id"]).maybe_single().execute()
            if analysis and analysis.data:
                ats_score = analysis.data["ats_score"]

        formatted_interviews = [
            {
                "id": i["id"],
                "score": i["score"],
                "difficulty": i.get("difficulty", "medium"),
                "interview_type": i["interview_type"],
                "duration_seconds": i["duration_seconds"],
                "created_at": i["created_at"],
            }
            for i in interviews
        ]
        latest_interview = interviews[0] if interviews else {}


        return {
            "totalInterviews": total_interviews,
            "averageScore": average_score,
            "bestScore": best_score,
            "totalPracticeMinutes": total_practice_minutes,
            "atsScore": ats_score,
            "interviews": formatted_interviews,
            "technicalScore": latest_interview.get("technical_score", 0),
            "communicationScore": latest_interview.get("communication_score", 0),
            "confidenceScore": latest_interview.get("confidence_score", 0),
            "problemSolvingScore": latest_interview.get("problem_solving_score", 0),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Dashboard error: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load dashboard: {str(e)}")


@app.get("/interview-messages/{interview_id}")
async def get_interview_messages(interview_id: str, request: Request):
    clerk_id = get_clerk_id(request)
    user_id = get_user_id(clerk_id)

    try:
        interview = supabase.table("interviews").select("id").eq("id", interview_id).eq("user_id", user_id).single().execute()

        if not interview.data:
            raise HTTPException(status_code=404, detail="Interview not found.")

        messages = supabase.table("interview_messages").select("*").eq("interview_id", interview_id).order("timestamp_seconds", desc=False).execute()

        return {"messages": messages.data or []}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get messages error: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {str(e)}")
    

@app.get("/health")
async def health():
    return {"status": "ok"}
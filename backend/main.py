from fastapi import FastAPI,File, UploadFile,Form
from fastapi.middleware.cors import CORSMiddleware
import supabase 
from supabase import create_client, Client
from dotenv import load_dotenv
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
supabase: Client = create_client(os.environ.get("SUPABASE_URL"),os.environ.get("SUPABASE_KEY"))

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/UploadResume")
async def UploadResume(file:UploadFile = File(...),userId: str = Form(...),):
    content = await file.read()
    response = supabase.storage.from_('resumes').upload(f'{userId}/{file.filename}', file=content)
    return "resumeuploaded";
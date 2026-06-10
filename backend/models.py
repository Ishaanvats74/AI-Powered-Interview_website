from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
load_dotenv()
import os
embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-2",google_api_key=os.getenv("GOOGLE_API_KEY"))

def Embeddings(text):
    return embeddings.embed_query(text)




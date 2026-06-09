from qdrant_client.models import Distance, VectorParams
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from langchain_google_genai import GoogleGenerativeAIEmbeddings


embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-2")

client = QdrantClient(":memory:")

vector_size = len(embeddings.embed_query("sample text"))

if not client.collection_exists("resume-Collection"):
    client.create_collection(
        collection_name="resume-Collection",
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
    )
vector_store = QdrantVectorStore(
    client=client,
    collection_name="resume-Collection",
    embedding=embeddings,
)
from qdrant_client.models import Distance, VectorParams
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client.models import Filter, FieldCondition, MatchValue
from models import embeddings 
import os
from dotenv import load_dotenv
load_dotenv()


text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000,chunk_overlap=150, add_start_index=True)

client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))
COLLECTION_NAME = "resume-collection"
vector_size = len(embeddings.embed_query("sample text"))

if not client.collection_exists(COLLECTION_NAME):
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
    )
vector_store = QdrantVectorStore(
    client=client,
    collection_name=COLLECTION_NAME,
    embedding=embeddings,
)



def load_to_vectorStore(docs:str,userId:str):
    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="metadata.user_id",
                    match=MatchValue(value=userId)
                )
            ]
        )
    )
    all_splits = text_splitter.split_documents(docs)

    ids = vector_store.add_documents(documents=all_splits)
    return "loaded to vectore"

def semantic_search(query: str, userId: str):
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": 5,
            "filter": Filter(
                must=[
                    FieldCondition(
                        key="metadata.user_id",
                        match=MatchValue(value=userId)
                    )
                ]
            )
        }
    )

    return retriever.invoke(query)
from qdrant_client.models import Distance, VectorParams
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client.models import Filter, FieldCondition, MatchValue
from models import embeddings 
import os
from dotenv import load_dotenv
from langchain_core.documents import Document
load_dotenv()


text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000,chunk_overlap=150, add_start_index=True)
client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))
vector_size = len(embeddings.embed_query("sample text"))
COLLECTION_NAME = "resume-collection"


if not client.collection_exists(COLLECTION_NAME):
    client.create_collection(collection_name=COLLECTION_NAME,vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE))

vector_store = QdrantVectorStore(client=client,collection_name=COLLECTION_NAME,embedding=embeddings,)


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
    vector_store.add_documents(documents=all_splits)
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



def get_full_resume(user_id: str):

    results = client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=Filter(
            must=[
                FieldCondition(
                    key="metadata.user_id",
                    match=MatchValue(value=user_id)
                )
            ]
        ),
        limit=1000,
        with_payload=True
    )

    points = results[0]
    print(points[0].payload)

    docs = []

    for point in points:
        docs.append(
            Document(
                page_content=point.payload["page_content"],
                metadata=point.payload["metadata"]
            )
        )

    return docs
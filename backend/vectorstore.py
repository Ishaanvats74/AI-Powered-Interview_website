from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client.models import Filter, FieldCondition, MatchValue
from qdrant_client.models import Distance, VectorParams, PayloadSchemaType
from langchain_qdrant import QdrantVectorStore
from langchain_core.documents import Document
from qdrant_client import QdrantClient
from dotenv import load_dotenv
from models import embeddings
import os

load_dotenv()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=150,
    add_start_index=True
)

client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))

vector_size = len(embeddings.embed_query("sample text"))

COLLECTION_NAME = "resume-collection"

if not client.collection_exists(COLLECTION_NAME):
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
    )

client.create_payload_index(
    collection_name=COLLECTION_NAME,
    field_name="metadata.user_id",
    field_schema=PayloadSchemaType.KEYWORD
)

vector_store = QdrantVectorStore(
    client=client,
    collection_name=COLLECTION_NAME,
    embedding=embeddings,
)


def load_to_vectorStore(docs: list[Document], userId: str):

    try:
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
        print(f"Deleted old vectors for user: {userId}")
    except Exception as e:
        print(f"Delete warning (safe to ignore if first upload): {e}")

    all_splits = text_splitter.split_documents(docs)

    for doc in all_splits:
        doc.metadata["user_id"] = userId

    print(f"Uploading {len(all_splits)} chunks for user: {userId}")

    vector_store.add_documents(documents=all_splits)

    print(f"Successfully loaded {len(all_splits)} chunks to vector store")


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

    results = retriever.invoke(query)

    print(f"Semantic search for '{query}' returned {len(results)} results")

    return results


def get_full_resume(user_id: str):

    try:
        points, _ = client.scroll(
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
    except Exception as e:
        print(f"Error fetching resume from vector store: {e}")
        return []

    if not points:
        print(f"No resume found in vector store for user: {user_id}")
        return []

    print(f"Found {len(points)} chunks for user: {user_id}")

    docs = []

    for point in points:
        payload = point.payload or {}
        docs.append(
            Document(
                page_content=payload.get("page_content", ""),
                metadata=payload.get("metadata", {})
            )
        )

    return docs
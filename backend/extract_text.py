from langchain_core.documents import Document
from pypdf import PdfReader
from io import BytesIO

def extract_text(file:bytes,file_path:str,user_id:str,resume_id:str):
    pdf_stream = BytesIO(file)
    reader = PdfReader(pdf_stream)

    docs = []

    for i, page in enumerate(reader.pages):
        text = page.extract_text()

        if not text:
            continue

        docs.append(
            Document(
                page_content=text,
                metadata={
                    "user_id": user_id,
                    "source": file_path,
                    "page": i + 1,
                    "resume_id": resume_id
                }
            )
        )

    return docs


    




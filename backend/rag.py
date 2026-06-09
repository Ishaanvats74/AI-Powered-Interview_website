from langchain_ollama import OllamaEmbeddings , ChatOllama
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter


text_splitter = RecursiveCharacterTextSplitter(chunk_size=500,
    chunk_overlap=100)

llm = ChatOllama(model="qwen3.5:9b",temperature=0)
embeddingss = OllamaEmbeddings(model="qwen3-embedding:4b")

pdf = "/home/ishaan-vats/Desktop/AI-Powered-Interview_website/IshaanVatsResume.pdf"
reader = PdfReader(pdf)
number_of_pages = len(reader.pages)
page = reader.pages[0]
text = page.extract_text()
print(text)

prompt = f"""
Return ONLY JSON.

Do not think.
Do not explain.
Do not reason.
Do not use markdown.

Resume:

{text}
"""

result = llm.invoke(prompt)
print(result.content)


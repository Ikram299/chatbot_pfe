from fastapi import APIRouter, UploadFile, File, Form
from app.database.supabase import supabase
from openai import OpenAI
import fitz
import os

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_embedding(text):
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=text
    )
    return response.data[0].embedding

def split_chunks(text, chunk_size=500):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i+chunk_size])
        chunks.append(chunk)
    return chunks

@router.post("/upload-pdf")
async def upload_pdf(user_id: int = Form(...), file: UploadFile = File(...)):

    pdf_bytes = await file.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    text = ""
    for page in doc:
        text += page.get_text()

    # Nettoyer le texte
    text = text.replace("\x00", "")
    text = text.encode("utf-8", errors="ignore").decode("utf-8")
    text = "".join(c for c in text if c.isprintable() or c in "\n\t ")

    # Sauvegarder le document
    result = supabase.table("documents").insert({
        "user_id": user_id,
        "file_name": file.filename,
        "text": text
    }).execute()

    document_id = result.data[0]["id"]

    # Découper en chunks et générer embeddings
    chunks = split_chunks(text)
    for chunk in chunks:
        if len(chunk.strip()) < 50:
            continue
        embedding = get_embedding(chunk)
        supabase.table("chunks").insert({
            "document_id": document_id,
            "user_id": user_id,
            "content": chunk,
            "embedding": embedding
        }).execute()

    return {
        "message": f"PDF uploadé avec succès — {len(chunks)} chunks créés",
        "document_id": document_id,
        "file_name": file.filename
    }
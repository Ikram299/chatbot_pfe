from fastapi import APIRouter, UploadFile, File, Form
from app.database.supabase import supabase
from app.agents.comprehension import get_embedding
import fitz
import os

router = APIRouter()

def split_chunks(text, chunk_size=500, overlap=50):
    """Chunking avec overlap pour ne pas perdre d'information"""
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i+chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks

@router.post("/upload-pdf")
async def upload_pdf(user_id: int = Form(...), file: UploadFile = File(...)):

    # Lire le PDF
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

    # Chunking avec overlap + embeddings
    chunks = split_chunks(text, chunk_size=500, overlap=50)
    chunks_created = 0

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
        chunks_created += 1

    return {
        "message": f"PDF uploadé — {chunks_created} chunks créés avec overlap",
        "document_id": document_id,
        "file_name": file.filename
    }
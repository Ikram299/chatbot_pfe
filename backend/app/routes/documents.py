from fastapi import APIRouter, UploadFile, File, Form
from app.database.supabase import supabase
import fitz

router = APIRouter()

@router.post("/upload-pdf")
async def upload_pdf(user_id: int = Form(...), file: UploadFile = File(...)):
    
    pdf_bytes = await file.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    text = ""
    for page in doc:
        text += page.get_text()

    text = text.replace("\x00", "")
    text = text.encode("utf-8", errors="ignore").decode("utf-8")
    text = "".join(c for c in text if c.isprintable() or c in "\n\t ")

    result = supabase.table("documents").insert({
        "user_id": user_id,
        "file_name": file.filename,
        "text": text
    }).execute()

    document_id = result.data[0]["id"]

    return {
        "message": "PDF uploadé avec succès",
        "document_id": document_id,
        "file_name": file.filename
    }
from fastapi import APIRouter, UploadFile, File, Form
import fitz  # PyMuPDF
from app.models.document import Document
from app.database.db import SessionLocal

router = APIRouter()

@router.post("/upload-pdf")
async def upload_pdf(user_id: int = Form(...), file: UploadFile = File(...)):
    db = SessionLocal()

    # 1. lire le fichier PDF
    pdf_bytes = await file.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    text = ""
    for page in doc:
        text += page.get_text()

    # 2. sauvegarder en DB
    document = Document(
        user_id=user_id,
        file_name=file.filename,
        text=text
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "message": "PDF uploadé avec succès",
        "document_id": document.id,
        "text_preview": text[:300]
    }
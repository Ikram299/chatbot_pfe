from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.chat import router as chat_router
from app.routes.documents import router as document_router


app = FastAPI(
    title="EduAI Assistant",
    description="Assistant académique intelligent basé sur multi-agents et RAG",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTES
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(chat_router, prefix="/chat", tags=["Chatbot"])
app.include_router(document_router, prefix="/documents", tags=["Documents"])


@app.get("/")
def root():
    return {"message": "EduAI Assistant API is running 🚀"}
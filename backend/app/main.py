from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, chat

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

# AUTH ROUTES
app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

# CHAT ROUTES (IMPORTANT FIX)
app.include_router(
    chat.router,
    prefix="",
    tags=["Chatbot"]
)

# TEST API
@app.get("/")
def root():
    return {
        "message": "EduAI Assistant API is running 🚀"
    }
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, chat  # 👈 AJOUT CHAT

app = FastAPI()

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

# 👇 REGISTER + LOGIN ROUTES
app.include_router(auth.router)
app.include_router(chat.router)  # 👈 IMPORTANT
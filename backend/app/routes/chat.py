from fastapi import APIRouter

router = APIRouter()

@router.post("/chat")
def chat_endpoint(data: dict):
    user_message = data.get("message")

    return {
        "response": f"🤖 Bot a reçu: {user_message}"
    }
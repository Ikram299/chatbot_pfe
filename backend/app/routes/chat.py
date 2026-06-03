from fastapi import APIRouter
from openai import OpenAI
import os

router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@router.post("/")
def chat(data: dict):
    user_message = data.get("message")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Tu es un assistant académique qui explique les cours simplement."},
            {"role": "user", "content": user_message}
        ]
    )

    return {
        "response": response.choices[0].message.content
    }
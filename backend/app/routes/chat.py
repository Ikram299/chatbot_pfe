from fastapi import APIRouter
from openai import OpenAI
import os
from app.database.supabase import supabase

router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ================= CHAT =================
@router.post("/")
def chat(data: dict):

    user_message = data.get("message")
    user_id = data.get("user_id")
    conversation_id = data.get("conversation_id")

    if not user_id:
        return {"error": "user_id missing"}

    user_id = int(user_id)

    # CREATE CONVERSATION
    if conversation_id is None:
        conv = supabase.table("conversations").insert({
            "user_id": user_id,
            "title": user_message[:30] if user_message else "Nouvelle conversation"
        }).execute()

        conversation_id = conv.data[0]["id"]
    else:
        conversation_id = int(conversation_id)

    # SAVE USER MESSAGE
    supabase.table("messages").insert({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "role": "user",
        "content": user_message
    }).execute()

    # OPENAI
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Assistant académique simple."},
            {"role": "user", "content": user_message}
        ]
    )

    bot_response = response.choices[0].message.content

    # SAVE BOT MESSAGE
    supabase.table("messages").insert({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": bot_response
    }).execute()

    return {
        "response": bot_response,
        "conversation_id": conversation_id
    }


# ================= CONVERSATIONS =================
@router.get("/conversations/{user_id}")
def get_conversations(user_id: int):

    response = supabase.table("conversations") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("id", desc=True) \
        .execute()

    return response.data or []


# ================= MESSAGES =================
@router.get("/messages/{conversation_id}")
def get_messages(conversation_id: int):

    response = supabase.table("messages") \
        .select("*") \
        .eq("conversation_id", conversation_id) \
        .order("created_at") \
        .execute()

    return response.data or []
from fastapi import APIRouter
from app.database.supabase import supabase
from app.agents.conversation import run_conversation_agent
from app.agents.summary import run_summary_agent
from app.agents.quiz import run_quiz_agent

router = APIRouter()

# ========= AGENT CONVERSATIONNEL =========
@router.post("/")
async def chat(data: dict):
    user_message = data.get("message")
    user_id = data.get("user_id")
    conversation_id = data.get("conversation_id")
    document_id = data.get("document_id")

    if not user_id:
        return {"error": "user_id missing"}

    return run_conversation_agent(
        user_message=user_message,
        user_id=int(user_id),
        conversation_id=conversation_id,
        document_id=document_id
    )

# ========= CONVERSATIONS =========
@router.get("/conversations/{user_id}")
def get_conversations(user_id: int):
    response = supabase.table("conversations")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("id", desc=True)\
        .execute()
    return response.data or []

# ========= MESSAGES =========
@router.get("/messages/{conversation_id}")
def get_messages(conversation_id: int):
    response = supabase.table("messages")\
        .select("*")\
        .eq("conversation_id", conversation_id)\
        .order("created_at")\
        .execute()
    return response.data or []

# ========= AGENT RÉSUMÉ =========
@router.post("/summary")
async def summary(data: dict):
    user_id = data.get("user_id")
    document_id = data.get("document_id")

    if not user_id:
        return {"error": "user_id missing"}

    return run_summary_agent(
        user_id=user_id,
        document_id=document_id
    )

# ========= AGENT QUIZ =========
@router.post("/quiz")
async def quiz(data: dict):
    user_id = data.get("user_id")
    quiz_type = data.get("type", "qcm")
    level = data.get("level", "moyen")
    document_id = data.get("document_id")

    if not user_id:
        return {"error": "user_id missing"}

    return run_quiz_agent(
        user_id=user_id,
        quiz_type=quiz_type,
        level=level,
        document_id=document_id
    )

# ========= SUPPRIMER CONVERSATION =========
@router.delete("/conversations/{conv_id}")
def delete_conversation(conv_id: int):
    supabase.table("messages").delete().eq("conversation_id", conv_id).execute()
    supabase.table("conversations").delete().eq("id", conv_id).execute()
    return {"message": "Conversation supprimée"}

# ========= RENOMMER CONVERSATION =========
@router.patch("/conversations/{conv_id}")
def rename_conversation(conv_id: int, data: dict):
    supabase.table("conversations")\
        .update({"title": data.get("title")})\
        .eq("id", conv_id)\
        .execute()
    return {"message": "Conversation renommée"}
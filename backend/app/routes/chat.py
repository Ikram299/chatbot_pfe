from fastapi import APIRouter
from openai import OpenAI
import os
import json
from app.database.supabase import supabase

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@router.post("/")
async def chat(data: dict):
    user_message = data.get("message")
    user_id = data.get("user_id")
    conversation_id = data.get("conversation_id")
    document_id = data.get("document_id")

    if not user_id:
        return {"error": "user_id missing"}

    user_id = int(user_id)

    if conversation_id is None:
        conv = supabase.table("conversations").insert({
            "user_id": user_id,
            "title": user_message[:30] if user_message else "Nouvelle conversation",
            "document_id": document_id
        }).execute()
        conversation_id = conv.data[0]["id"]
    else:
        conversation_id = int(conversation_id)
        conv = supabase.table("conversations").select("document_id").eq("id", conversation_id).execute()
        if conv.data:
            document_id = conv.data[0].get("document_id")

    supabase.table("messages").insert({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "role": "user",
        "content": user_message
    }).execute()

    context = ""
    if document_id:
        docs = supabase.table("documents").select("text, file_name").eq("id", document_id).execute()
        for doc in docs.data:
            context += f"\nDocument: {doc.get('file_name','')}\n{doc.get('text','')[:3000]}\n"

    if not context:
        context = "Aucun document disponible."

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": f"Tu es un assistant académique. Réponds basé sur ce contenu:\n{context}"
            },
            {
                "role": "user",
                "content": user_message
            }
        ]
    )

    bot_response = response.choices[0].message.content

    supabase.table("messages").insert({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": bot_response
    }).execute()

    return {
        "response": bot_response,
        "conversation_id": conversation_id,
        "document_id": document_id
    }

@router.get("/conversations/{user_id}")
def get_conversations(user_id: int):
    response = supabase.table("conversations").select("*").eq("user_id", user_id).order("id", desc=True).execute()
    return response.data or []

@router.get("/messages/{conversation_id}")
def get_messages(conversation_id: int):
    response = supabase.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at").execute()
    return response.data or []

@router.post("/summary")
async def summary(data: dict):
    user_id = data.get("user_id")
    document_id = data.get("document_id")

    if not user_id:
        return {"error": "user_id missing"}

    if not document_id:
        docs = supabase.table("documents").select("text, file_name").eq("user_id", user_id).order("id", desc=True).limit(1).execute()
    else:
        docs = supabase.table("documents").select("text, file_name").eq("id", document_id).execute()

    if not docs.data:
        return {"summary": "Aucun document trouvé. Veuillez d'abord uploader un PDF."}

    full_text = ""
    for doc in docs.data:
        full_text += f"\n{doc.get('text','')[:3000]}\n"

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Tu es un agent de résumé académique. Génère un résumé clair et structuré avec les points clés."
            },
            {
                "role": "user",
                "content": f"Résume ce cours de façon claire et structurée:\n{full_text}"
            }
        ]
    )

    return {"summary": response.choices[0].message.content}

@router.post("/quiz")
async def quiz(data: dict):
    user_id = data.get("user_id")
    quiz_type = data.get("type", "qcm")
    level = data.get("level", "moyen")
    document_id = data.get("document_id")

    if not user_id:
        return {"error": "user_id missing"}

    if not document_id:
        docs = supabase.table("documents").select("text, file_name").eq("user_id", user_id).order("id", desc=True).limit(1).execute()
    else:
        docs = supabase.table("documents").select("text, file_name").eq("id", document_id).execute()

    if not docs.data:
        return {"quiz": []}

    full_text = ""
    for doc in docs.data:
        full_text += f"\n{doc.get('text','')[:3000]}\n"

    if quiz_type == "vrai_faux":
        prompt = f"""Génère 5 questions Vrai/Faux de niveau {level} basées sur ce cours.
Réponds UNIQUEMENT en JSON valide, sans texte avant ou après:
[
  {{
    "question": "La question ici",
    "options": ["Vrai", "Faux"],
    "answer": "Vrai"
  }}
]
Cours: {full_text}"""
    else:
        prompt = f"""Génère 5 questions QCM de niveau {level} basées sur ce cours.
Réponds UNIQUEMENT en JSON valide, sans texte avant ou après:
[
  {{
    "question": "La question ici",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A"
  }}
]
Cours: {full_text}"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Tu es un agent de génération de quiz. Tu réponds UNIQUEMENT en JSON valide sans markdown."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    try:
        text = response.choices[0].message.content
        text = text.replace("```json", "").replace("```", "").strip()
        questions = json.loads(text)
        return {"quiz": questions}
    except:
        return {"quiz": []}
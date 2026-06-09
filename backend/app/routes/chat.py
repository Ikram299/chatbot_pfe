from fastapi import APIRouter
from openai import OpenAI
import os
import json
from app.database.supabase import supabase

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_embedding(text):
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=text
    )
    return response.data[0].embedding

def search_chunks(question, document_id, user_id):
    question_embedding = get_embedding(question)
    
    result = supabase.rpc("match_chunks", {
        "query_embedding": question_embedding,
        "document_id_filter": document_id,
        "match_count": 3
    }).execute()
    
    if result.data:
        return "\n\n".join([r["content"] for r in result.data])
    
    # Fallback si pas de chunks
    docs = supabase.table("documents").select("text").eq("id", document_id).execute()
    if docs.data:
        return docs.data[0]["text"][:3000]
    return ""

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

    # RAG — chercher les chunks pertinents
    context = ""
    if document_id:
        context = search_chunks(user_message, document_id, user_id)

    if not context:
        context = "Aucun document disponible."

    # Agent Validation — vérifier le contexte
    if len(context) < 10:
        bot_response = "Je n'ai pas trouvé d'information pertinente dans le document."
    else:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": f"Tu es un assistant académique. Réponds UNIQUEMENT basé sur ce contenu:\n{context}"
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

    if document_id:
        chunks = supabase.table("chunks").select("content").eq("document_id", document_id).limit(10).execute()
    else:
        docs = supabase.table("documents").select("id").eq("user_id", user_id).order("id", desc=True).limit(1).execute()
        if not docs.data:
            return {"summary": "Aucun document trouvé."}
        document_id = docs.data[0]["id"]
        chunks = supabase.table("chunks").select("content").eq("document_id", document_id).limit(10).execute()

    if not chunks.data:
        return {"summary": "Aucun contenu trouvé."}

    full_text = "\n\n".join([c["content"] for c in chunks.data])

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Tu es un agent de résumé académique. Génère un résumé clair et structuré."
            },
            {
                "role": "user",
                "content": f"Résume ce cours:\n{full_text}"
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

    if document_id:
        chunks = supabase.table("chunks").select("content").eq("document_id", document_id).limit(10).execute()
    else:
        docs = supabase.table("documents").select("id").eq("user_id", user_id).order("id", desc=True).limit(1).execute()
        if not docs.data:
            return {"quiz": []}
        document_id = docs.data[0]["id"]
        chunks = supabase.table("chunks").select("content").eq("document_id", document_id).limit(10).execute()

    if not chunks.data:
        return {"quiz": []}

    full_text = "\n\n".join([c["content"] for c in chunks.data])

    if quiz_type == "vrai_faux":
        prompt = f"""Génère 5 questions Vrai/Faux de niveau {level}.
Réponds UNIQUEMENT en JSON valide:
[
  {{
    "question": "La question ici",
    "options": ["Vrai", "Faux"],
    "answer": "Vrai"
  }}
]
Cours: {full_text}"""
    else:
        prompt = f"""Génère 5 questions QCM de niveau {level}.
Réponds UNIQUEMENT en JSON valide:
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
                "content": "Tu es un agent de génération de quiz. Réponds UNIQUEMENT en JSON valide."
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
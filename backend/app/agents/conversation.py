from openai import OpenAI
from app.database.supabase import supabase
from app.agents.comprehension import advanced_rag_search
from app.agents.validation import validate_response
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_conversation_history(conversation_id, limit=3):
    """Récupère les derniers messages de la conversation"""
    if not conversation_id:
        return []
    
    result = supabase.table("messages")\
        .select("role, content")\
        .eq("conversation_id", conversation_id)\
        .order("created_at", desc=True)\
        .limit(limit * 2)\
        .execute()
    
    if not result.data:
        return []
    
    messages = result.data[::-1]
    return [
        {
            "role": "assistant" if m["role"] == "assistant" else "user",
            "content": m["content"]
        }
        for m in messages
    ]

def run_conversation_agent(user_message, user_id, conversation_id, document_id):
    """Agent Conversationnel avec RAG avancé + historique"""

    # Créer ou récupérer conversation
    if conversation_id is None:
        conv = supabase.table("conversations").insert({
            "user_id": user_id,
            "title": user_message[:40].strip() + ("..." if len(user_message) > 40 else ""),
            "document_id": document_id
        }).execute()
        conversation_id = conv.data[0]["id"]
    else:
        conversation_id = int(conversation_id)
        conv = supabase.table("conversations").select("document_id").eq("id", conversation_id).execute()
        if conv.data:
            document_id = conv.data[0].get("document_id")

    # Sauvegarder message utilisateur
    supabase.table("messages").insert({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "role": "user",
        "content": user_message
    }).execute()

    # RAG avancé
    context = ""
    if document_id:
        context = advanced_rag_search(user_message, document_id)

    if not context:
        context = "Aucun document disponible."

    # Historique conversation
    history = get_conversation_history(conversation_id)

    # Construction messages GPT
    messages = [
        {
            "role": "system",
            "content": f"""Tu es un assistant académique intelligent.
Réponds UNIQUEMENT basé sur ce contenu du cours :

{context}

Si la réponse n'est pas dans le document, dis-le clairement."""
        }
    ]

    # Ajouter historique
    messages.extend(history)

    # Ajouter question actuelle
    messages.append({
        "role": "user",
        "content": user_message
    })

    # GPT génère la réponse
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )

    bot_response = response.choices[0].message.content

    # Validation
    bot_response = validate_response(bot_response, context)

    # Sauvegarder réponse
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
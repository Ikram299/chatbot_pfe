from openai import OpenAI
from app.database.supabase import supabase
import os
import json

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def run_quiz_agent(user_id, quiz_type="qcm", level="moyen", document_id=None):
    """Agent Quiz — génère des questions interactives"""

    # Récupérer les chunks
    if document_id:
        chunks = supabase.table("chunks")\
            .select("content")\
            .eq("document_id", document_id)\
            .limit(15)\
            .execute()
    else:
        docs = supabase.table("documents")\
            .select("id")\
            .eq("user_id", user_id)\
            .order("id", desc=True)\
            .limit(1)\
            .execute()
        if not docs.data:
            return {"quiz": []}
        document_id = docs.data[0]["id"]
        chunks = supabase.table("chunks")\
            .select("content")\
            .eq("document_id", document_id)\
            .limit(15)\
            .execute()

    if not chunks.data:
        return {"quiz": []}

    full_text = "\n\n".join([c["content"] for c in chunks.data])

    if quiz_type == "vrai_faux":
        prompt = f"""Génère 5 questions Vrai/Faux de niveau {level} basées sur ce cours.
Les questions doivent être précises et couvrir les concepts importants.
Réponds UNIQUEMENT en JSON valide sans markdown:
[
  {{
    "question": "La question ici",
    "options": ["Vrai", "Faux"],
    "answer": "Vrai",
    "explanation": "Explication courte de la réponse"
  }}
]
Cours: {full_text}"""
    else:
        prompt = f"""Génère 5 questions QCM de niveau {level} basées sur ce cours.
Les questions doivent être précises et couvrir les concepts importants.
Réponds UNIQUEMENT en JSON valide sans markdown:
[
  {{
    "question": "La question ici",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "Explication courte de la réponse"
  }}
]
Cours: {full_text}"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Tu es un agent de génération de quiz académique expert. Réponds UNIQUEMENT en JSON valide."
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
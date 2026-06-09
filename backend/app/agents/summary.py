from openai import OpenAI
from app.database.supabase import supabase
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def run_summary_agent(user_id, document_id=None):
    """Agent Résumé — génère un résumé structuré du cours"""

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
            return {"summary": "Aucun document trouvé. Veuillez d'abord uploader un PDF."}
        document_id = docs.data[0]["id"]
        chunks = supabase.table("chunks")\
            .select("content")\
            .eq("document_id", document_id)\
            .limit(15)\
            .execute()

    if not chunks.data:
        return {"summary": "Aucun contenu trouvé dans le document."}

    full_text = "\n\n".join([c["content"] for c in chunks.data])

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": """Tu es un agent de résumé académique expert.
Génère un résumé clair, structuré et complet avec :
- Un titre principal
- Des sections avec titres
- Des points clés pour chaque section
- Une conclusion

Utilise un langage clair et accessible pour les étudiants."""
            },
            {
                "role": "user",
                "content": f"Résume ce cours de façon structurée:\n\n{full_text}"
            }
        ]
    )

    return {"summary": response.choices[0].message.content}
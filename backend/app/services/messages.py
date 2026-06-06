from app.database.supabase import supabase
from datetime import datetime

def save_message(user_id: str, role: str, content: str):
    data = {
        "user_id": user_id,
        "role": role,
        "content": content,
        "created_at": datetime.utcnow().isoformat()
    }

    response = supabase.table("messages").insert(data).execute()
    return response
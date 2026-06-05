from app.database.db import engine

try:
    conn = engine.connect()
    print("✅ Supabase PostgreSQL connecté avec succès !")
    conn.close()
except Exception as e:
    print("❌ Erreur de connexion :", e)
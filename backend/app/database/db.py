from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 🔹 URL de connexion PostgreSQL
DATABASE_URL = "postgresql://postgres:ikram123@localhost:5432/chatbot_pfe"

# 🔹 Création du moteur de connexion
engine = create_engine(DATABASE_URL)

# 🔹 Session (pour interagir avec la DB)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 🔹 Base pour les modèles
Base = declarative_base()
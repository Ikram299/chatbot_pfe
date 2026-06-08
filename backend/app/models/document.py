from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime

from app.database.db import Base
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    file_name = Column(String)
    text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
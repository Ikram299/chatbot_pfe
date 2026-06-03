from sqlalchemy import Column, Integer, String, Boolean, DateTime, text
from app.database.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)

    email = Column(String(255), unique=True, nullable=False)

    password_hash = Column(String, nullable=False)

    is_verified = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
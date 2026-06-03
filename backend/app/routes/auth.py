from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import SessionLocal
from app.models.user import User
from app.schemas.user import UserRegister
from app.services.auth_service import hash_password

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email déjà utilisé"
        )

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        is_verified=False
    )

    db.add(new_user)
    db.commit()

    return {
        "message": "Utilisateur créé avec succès"
    }
from app.schemas.user import UserLogin
from app.services.auth_service import (
    verify_password,
    create_access_token
)

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=400,
            detail="Utilisateur introuvable"
        )

    if not verify_password(
        user.password,
        db_user.password_hash
    ):
        raise HTTPException(
            status_code=400,
            detail="Mot de passe incorrect"
        )

    token = create_access_token(
        {"sub": db_user.email}
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }
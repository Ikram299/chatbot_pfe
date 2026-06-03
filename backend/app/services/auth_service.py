from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def hash_password(password: str):
    # 🔥 FIX bcrypt limit
    if len(password) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def verify_password(password, hashed):
    if len(password) > 72:
        password = password[:72]
    return pwd_context.verify(password, hashed)

from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = "secret123"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=1)):
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + expires_delta})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
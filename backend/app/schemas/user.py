from pydantic import BaseModel, EmailStr, StringConstraints
from typing import Annotated


PasswordStr = Annotated[str, StringConstraints(min_length=6, max_length=72)]


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: PasswordStr


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True
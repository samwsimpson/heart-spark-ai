from __future__ import annotations
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=80)

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)

class UserOut(UserBase):
    id: int
    is_verified: bool
    class Config:
        from_attributes = True  # SQLAlchemy -> Pydantic

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

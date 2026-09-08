from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

class PDFResponse(BaseModel):
    id: int
    filename: str
    upload_date: datetime
    summary: Optional[str] = None
    summary_status: str
    share_token: Optional[str] = None
    file_url: Optional[str] = None

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str
    author_name: Optional[str] = None  # required for anonymous/invited users


class CommentResponse(BaseModel):
    id: int
    author_name: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str


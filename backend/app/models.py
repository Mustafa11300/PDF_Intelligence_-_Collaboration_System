from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PDF(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id")
    filename: str
    storage_path: str
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    summary: Optional[str] = None
    summary_status: str = Field(default="pending")  # pending | done | failed
    share_token: Optional[str] = Field(default=None, unique=True, index=True)
    extracted_text: Optional[str] = None 


class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    pdf_id: int = Field(foreign_key="pdf.id")
    author_name: str
    author_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
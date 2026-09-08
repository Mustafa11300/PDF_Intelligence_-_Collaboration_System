from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import Optional

from app.database import get_session
from app.models import PDF, Comment, User
from app.schemas import CommentCreate, CommentResponse
from app.auth import get_current_user, oauth2_scheme
from jose import jwt, JWTError
import os

router = APIRouter(prefix="/pdfs", tags=["comments"])

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def try_get_current_user(session: Session, authorization: Optional[str]) -> Optional[User]:
    """Best-effort: decode token if present, return None instead of raising if absent/invalid."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return session.get(User, int(user_id))
    except JWTError:
        return None


def get_pdf_by_id_or_share_token(
    pdf_id: Optional[int],
    share_token: Optional[str],
    session: Session,
    current_user: Optional[User],
) -> PDF:
    if share_token:
        pdf = session.exec(select(PDF).where(PDF.share_token == share_token)).first()
        if not pdf:
            raise HTTPException(status_code=404, detail="Shared PDF not found")
        return pdf

    pdf = session.get(PDF, pdf_id)
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    if not current_user or pdf.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return pdf


@router.get("/{pdf_id}/comments", response_model=list[CommentResponse])
def list_comments_owned(
    pdf_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    pdf = session.get(PDF, pdf_id)
    if not pdf or pdf.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="PDF not found")
    comments = session.exec(
        select(Comment).where(Comment.pdf_id == pdf_id).order_by(Comment.created_at)
    ).all()
    return comments


@router.post("/{pdf_id}/comments", response_model=CommentResponse)
def add_comment_owned(
    pdf_id: int,
    data: CommentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    pdf = session.get(PDF, pdf_id)
    if not pdf or pdf.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="PDF not found")
    comment = Comment(
        pdf_id=pdf_id,
        author_name=current_user.name,
        author_user_id=current_user.id,
        content=data.content,
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment


@router.get("/shared/{share_token}/comments", response_model=list[CommentResponse])
def list_comments_shared(
    share_token: str,
    session: Session = Depends(get_session),
):
    pdf = session.exec(select(PDF).where(PDF.share_token == share_token)).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="Shared PDF not found")
    comments = session.exec(
        select(Comment).where(Comment.pdf_id == pdf.id).order_by(Comment.created_at)
    ).all()
    return comments


@router.post("/shared/{share_token}/comments", response_model=CommentResponse)
def add_comment_shared(
    share_token: str,
    data: CommentCreate,
    session: Session = Depends(get_session),
):
    pdf = session.exec(select(PDF).where(PDF.share_token == share_token)).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="Shared PDF not found")
    author_name = (data.author_name or "").strip() or "Anonymous"
    comment = Comment(
        pdf_id=pdf.id,
        author_name=author_name,
        content=data.content,
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment
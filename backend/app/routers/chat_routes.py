from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import PDF, User
from app.schemas import ChatRequest, ChatResponse
from app.auth import get_current_user
from app.ai import generate_chat_response

router = APIRouter(prefix="/pdfs", tags=["chat"])


@router.post("/{pdf_id}/chat", response_model=ChatResponse)
def chat_owned(
    pdf_id: int,
    data: ChatRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    pdf = session.get(PDF, pdf_id)
    if not pdf or pdf.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="PDF not found")
    if not pdf.extracted_text:
        raise HTTPException(status_code=400, detail="No extracted text available for this document")

    history = [{"role": h.role, "content": h.content} for h in data.history]
    reply = generate_chat_response(data.message, pdf.extracted_text, history)
    return ChatResponse(reply=reply)


@router.post("/shared/{share_token}/chat", response_model=ChatResponse)
def chat_shared(
    share_token: str,
    data: ChatRequest,
    session: Session = Depends(get_session),
):
    pdf = session.exec(select(PDF).where(PDF.share_token == share_token)).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="Shared PDF not found")
    if not pdf.extracted_text:
        raise HTTPException(status_code=400, detail="No extracted text available for this document")

    history = [{"role": h.role, "content": h.content} for h in data.history]
    reply = generate_chat_response(data.message, pdf.extracted_text, history)
    return ChatResponse(reply=reply)
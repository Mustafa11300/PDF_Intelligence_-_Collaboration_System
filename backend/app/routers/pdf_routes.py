import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select

from app.database import get_session
from app.models import User, PDF
from app.schemas import PDFResponse
from app.auth import get_current_user
from app.storage import upload_pdf_bytes
from typing import Optional
import uuid as uuid_lib
from app.storage import upload_pdf_bytes, extract_pdf_text, get_signed_url
from app.ai import generate_summary

router = APIRouter(prefix="/pdfs", tags=["pdfs"])


@router.post("/upload", response_model=PDFResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if file.content_type != "application/pdf" or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    unique_name = f"{current_user.id}/{uuid.uuid4()}_{file.filename}"

    try:
        upload_pdf_bytes(file_bytes, unique_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    pdf = PDF(
        owner_id=current_user.id,
        filename=file.filename,
        storage_path=unique_name,
        summary_status="pending",
    )
    session.add(pdf)
    session.commit()
    session.refresh(pdf)

    # Generate summary synchronously (simple + reliable for the assignment timeline)
    try:
        pdf_text = extract_pdf_text(file_bytes)
        if pdf_text.strip():
            summary = generate_summary(pdf_text)
            pdf.summary = summary
            pdf.summary_status = "done"
            pdf.extracted_text = pdf_text
        else:
            pdf.summary = "This PDF appears to contain no extractable text (it may be a scanned image)."
            pdf.summary_status = "done"
    except Exception as e:
        pdf.summary_status = "failed"
        pdf.summary = None
        print(f"Summary generation failed for PDF {pdf.id}: {e}")

    session.add(pdf)
    session.commit()
    session.refresh(pdf)

    return pdf

@router.get("", response_model=list[PDFResponse])
def list_pdfs(
    search: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(PDF).where(PDF.owner_id == current_user.id)
    if search:
        query = query.where(PDF.filename.ilike(f"%{search}%"))
    query = query.order_by(PDF.upload_date.desc())
    return session.exec(query).all()

@router.get("/{pdf_id}", response_model=PDFResponse)
def get_pdf(
    pdf_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    pdf = session.get(PDF, pdf_id)
    if not pdf or pdf.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="PDF not found")

    response = PDFResponse.model_validate(pdf)
    response.file_url = get_signed_url(pdf.storage_path)
    return response

@router.post("/{pdf_id}/share", response_model=PDFResponse)
def share_pdf(
    pdf_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    pdf = session.get(PDF, pdf_id)
    if not pdf or pdf.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="PDF not found")

    if not pdf.share_token:
        pdf.share_token = str(uuid_lib.uuid4())
        session.add(pdf)
        session.commit()
        session.refresh(pdf)

    return pdf

@router.get("/shared/{share_token}")
def get_shared_pdf(
    share_token: str,
    session: Session = Depends(get_session),
):
    pdf = session.exec(select(PDF).where(PDF.share_token == share_token)).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="Shared PDF not found")

    signed_url = get_signed_url(pdf.storage_path)

    return {
        "id": pdf.id,
        "filename": pdf.filename,
        "summary": pdf.summary,
        "summary_status": pdf.summary_status,
        "file_url": signed_url,
    }
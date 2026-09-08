import os
from supabase import create_client, Client
from dotenv import load_dotenv
import pdfplumber
import io

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

BUCKET_NAME = "pdfs"


def upload_pdf_bytes(file_bytes: bytes, storage_path: str) -> None:
    supabase.storage.from_(BUCKET_NAME).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": "application/pdf"},
    )


def get_signed_url(storage_path: str, expires_in: int = 3600) -> str:
    result = supabase.storage.from_(BUCKET_NAME).create_signed_url(
        storage_path, expires_in
    )
    return result["signedURL"] if "signedURL" in result else result.get("signed_url", "")


def download_pdf_bytes(storage_path: str) -> bytes:
    return supabase.storage.from_(BUCKET_NAME).download(storage_path)

def extract_pdf_text(file_bytes: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)
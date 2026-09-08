import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MODEL_NAME = "gemini-3.6-flash"


def generate_summary(pdf_text: str) -> str:
    prompt = f"""You are summarizing a document for a busy professional's dashboard.

Write a 3-5 sentence summary of the following document. Be concise, specific, and factual — mention concrete details (names, numbers, dates, key decisions) rather than vague generalities. Do not start with phrases like "This document is about" — get straight to the substance.

Document text:
\"\"\"
{pdf_text[:15000]}
\"\"\"

Summary:"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )
    return response.text.strip()

def chunk_text(text: str, chunk_size: int = 1500, overlap: int = 200) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def get_relevant_chunks(question: str, chunks: list[str], top_n: int = 5) -> list[str]:
    from rank_bm25 import BM25Okapi

    if len(chunks) <= top_n:
        return chunks

    tokenized_chunks = [c.lower().split() for c in chunks]
    bm25 = BM25Okapi(tokenized_chunks)
    scores = bm25.get_scores(question.lower().split())
    ranked_indices = sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)
    top_indices = sorted(ranked_indices[:top_n])  # keep original document order
    return [chunks[i] for i in top_indices]


def generate_chat_response(question: str, full_text: str, history: list[dict]) -> str:
    chunks = chunk_text(full_text)
    relevant_chunks = get_relevant_chunks(question, chunks)
    context = "\n\n---\n\n".join(relevant_chunks)

    history_text = ""
    for turn in history[-5:]:  # last 5 turns for context
        role = "User" if turn["role"] == "user" else "Assistant"
        history_text += f"{role}: {turn['content']}\n"

    prompt = f"""You are answering questions about a specific document. Only use the document context below to answer — if the answer isn't in the provided context, say so clearly rather than guessing or using outside knowledge.

Document context (relevant excerpts):
\"\"\"
{context}
\"\"\"

Recent conversation:
{history_text}

User's new question: {question}

Answer concisely and accurately, grounded only in the document context above:"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )
    return response.text.strip()
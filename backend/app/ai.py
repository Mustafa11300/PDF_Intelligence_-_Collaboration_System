import os
import time
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Tried in order — if the primary is overloaded, we fall back to the next one
MODEL_CHAIN = ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-1.5-flash"]


def _call_gemini_with_fallback(prompt: str, max_retries_per_model: int = 2) -> str | None:
    """Tries each model in MODEL_CHAIN in order, retrying transient errors within each
    model before moving to the next. Returns None only if every model in the chain fails."""
    for model_name in MODEL_CHAIN:
        for attempt in range(max_retries_per_model):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                return response.text.strip()
            except Exception as e:
                error_str = str(e)
                is_transient = "503" in error_str or "UNAVAILABLE" in error_str or "429" in error_str or "RESOURCE_EXHAUSTED" in error_str
                is_not_found = "404" in error_str or "NOT_FOUND" in error_str
                print(f"Gemini call failed on model={model_name} (attempt {attempt + 1}/{max_retries_per_model}): {error_str}")

                if is_not_found:
                    break  # this model doesn't exist/isn't available — skip straight to next model
                if is_transient and attempt < max_retries_per_model - 1:
                    wait_time = (2 ** attempt) * 2  # 2s, 4s
                    time.sleep(wait_time)
                    continue
                break  # exhausted retries for this model (or non-transient error) — try next model in chain

    return None  # every model in the chain failed


def generate_summary(pdf_text: str) -> str:
    prompt = f"""You are summarizing a document for a busy professional's dashboard.

Write a 3-5 sentence summary of the following document. Be concise, specific, and factual — mention concrete details (names, numbers, dates, key decisions) rather than vague generalities. Do not start with phrases like "This document is about" — get straight to the substance.

Document text:
\"\"\"
{pdf_text[:15000]}
\"\"\"

Summary:"""

    result = _call_gemini_with_fallback(prompt)
    if result:
        return result

    return "AI summary is temporarily unavailable due to high demand on the model provider. Please check back shortly, or open the document to read it directly."


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

    result = _call_gemini_with_fallback(prompt)
    if result:
        return result

    return "Sorry, the AI is temporarily unavailable due to high demand — please try asking again in a moment."
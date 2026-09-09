# PDF Intelligence & Collaboration System

A web application for uploading PDFs, generating AI summaries, chatting with documents via an LLM, and collaborating with others through sharing and comments.

**Live app:** https://pdf-intelligence-collaboration-syst-zeta.vercel.app
**Backend API:** https://pdf-intelligence-collaboration-system.onrender.com

> **Note on cold starts:** the backend is hosted on Render's free tier, which spins down after ~15 minutes of inactivity. The first request after idling can take 30–60 seconds to respond while the server wakes up. If the app seems unresponsive on first load, give it a moment and retry.

---

## Features

- Email/password signup and login with JWT auth and bcrypt-hashed passwords
- PDF upload with format validation, stored in Supabase Storage
- Dashboard with search-by-filename and AI-generated summary previews
- Shareable links — invited users can view, comment, and chat with a document without an account
- Threaded, live-updating comments (owner and invited users)
- AI-generated 3–5 sentence summary on every upload
- AI chat panel grounded in document content, with conversational memory
- Access control on every document, comment, and chat endpoint

---

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | FastAPI (Python) |
| Database | PostgreSQL via Supabase (accessed through the connection pooler) |
| File storage | Supabase Storage (private bucket, signed URLs) |
| ORM | SQLModel (SQLAlchemy) |
| Auth | JWT (python-jose) + bcrypt |
| PDF text extraction | pdfplumber |
| LLM | Google Gemini (`gemini-3.6-flash` via the `google-genai` SDK) |
| Chunk retrieval | `rank_bm25` (BM25 keyword ranking, no vector DB) |
| Frontend | Next.js (App Router) + TypeScript |
| Frontend hosting | Vercel |
| Backend hosting | Render |

---

## Project Structure

```
pdf-intelligence-system/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, router registration, CORS
│   │   ├── database.py           # SQLModel engine + session
│   │   ├── models.py             # User, PDF, Comment tables
│   │   ├── schemas.py            # Pydantic request/response models
│   │   ├── auth.py               # JWT + bcrypt helpers, current-user dependency
│   │   ├── storage.py            # Supabase Storage upload/signed URL, PDF text extraction
│   │   ├── ai.py                 # Gemini summary + chat generation, chunking, BM25 retrieval
│   │   └── routers/
│   │       ├── auth_routes.py
│   │       ├── pdf_routes.py
│   │       ├── comment_routes.py
│   │       └── chat_routes.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── login/page.tsx
    │   ├── signup/page.tsx
    │   ├── dashboard/page.tsx
    │   ├── pdf/[id]/page.tsx     # Owner's PDF viewer + chat + comments
    │   └── shared/[token]/page.tsx  # Public viewer for invited users
    ├── components/ui/
    ├── lib/api.ts                # All backend API calls
    └── .env.local (not committed)
```

---

## Running Locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # then fill in real values, see below
uvicorn app.main:app --reload
```
Runs on `http://127.0.0.1:8000`. Visit `/docs` for interactive API docs.

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000" > .env.local
npm run dev
```
Runs on `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string. Use Supabase's **connection pooler** URL (session or transaction mode), not the direct `db.<project>.supabase.co` host — the direct host is IPv6-only and fails to resolve on many networks. |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase **service role** key (needed to bypass storage RLS from the backend) |
| `GEMINI_API_KEY` | Google Gemini API key, from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `JWT_SECRET` | Random secret string for signing JWTs |
| `JWT_ALGORITHM` | `HS256` |

See `backend/.env.example` for the template.

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

---

## AI Implementation Notes

### Summary generation
On upload, the PDF's text is extracted with `pdfplumber` and the first ~15,000 characters are sent to Gemini with a prompt instructing it to produce a concise, factual 3–5 sentence summary (explicitly avoiding generic openers like "This document is about..."). Summary generation runs **synchronously** as part of the upload request — simpler to reason about and debug than a background job queue, at the cost of the upload response taking a few extra seconds. This was a deliberate scope trade-off given the assignment timeline.

### Chat with long-document handling
Rather than sending the entire PDF text on every chat message (which breaks on long documents and wastes tokens), each question triggers this flow:

1. The full extracted text (cached at upload time in the `extracted_text` column) is split into ~1,500-character chunks with 200-character overlap.
2. `rank_bm25` scores every chunk against the user's question using keyword relevance (BM25 algorithm).
3. The top 5 highest-scoring chunks are selected and re-ordered to match their original position in the document (to preserve narrative flow).
4. Those chunks, plus the last 5 turns of conversation history, are sent to Gemini with a prompt instructing it to answer only from the provided context and say so explicitly if the answer isn't present.

This avoids the complexity of a vector database or embeddings pipeline while still scaling to documents far longer than a single context window. Chat maintains conversational memory by sending recent turns with each request (the frontend keeps the full transcript client-side; only the last 5 turns are sent to the model).

### Model
`gemini-3.6-flash`, chosen for its speed and generous free tier, used for both summary and chat generation via the official `google-genai` SDK.

---

## Known Trade-offs & Scope Decisions

- **Comments update via 5-second polling**, not WebSockets. Given the timeline, polling was the pragmatic choice to get near-real-time collaboration working reliably; a production version would use WebSockets or Supabase Realtime.
- **PDF viewing uses a plain `<iframe>`** pointed at a Supabase signed URL rather than `react-pdf`/`pdf.js`. Browsers render PDFs natively in iframes, which avoided a non-trivial integration under time pressure.
- **Summary generation is synchronous**, not a background job — see above.
- **Anonymous/invited comments** require only a display name, not an account, per the assignment's requirement that invited users don't need authentication.

---

## Security

- Passwords are hashed with bcrypt before storage; plaintext passwords are never stored.
- JWTs are used for authenticated routes; access to PDFs, comments, and chat is checked against the requesting user's ownership on every request.
- Shared/invited routes are scoped strictly to the specific PDF matching the share token — no other data is exposed.
- API keys and secrets are loaded from environment variables and are not committed to the repository (`.env` is git-ignored; `.env.example` documents required keys with placeholder values).
- CORS is restricted to the deployed frontend origin and `localhost:3000` for local development.

---

## Deliverables

- **Deployed app:** https://pdf-intelligence-collaboration-syst-zeta.vercel.app
- **Backend API:** https://pdf-intelligence-collaboration-system.onrender.com
- **GitHub repository:** _(add your repo link here)_
- **Video walkthrough:** _(add your Loom link here)_
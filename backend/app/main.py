from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_db_and_tables
from app.routers import auth_routes
import app.models  # noqa: F401  (ensures models are registered before create_all)
from app.routers import auth_routes, pdf_routes, comment_routes, chat_routes


app = FastAPI(title="PDF Intelligence & Collaboration System")


app.include_router(auth_routes.router)
app.include_router(pdf_routes.router)
app.include_router(comment_routes.router)
app.include_router(chat_routes.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://pdf-intelligence-collaboration-syst-zeta.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth_routes.router)
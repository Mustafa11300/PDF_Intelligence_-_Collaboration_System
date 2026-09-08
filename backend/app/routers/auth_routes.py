from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import User
from app.schemas import SignupRequest, LoginRequest, TokenResponse, UserResponse
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserResponse)
def signup(
    data: SignupRequest,
    session: Session = Depends(get_session),
):
    existing = session.exec(
        select(User).where(User.email == data.email)
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    user = User(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    session: Session = Depends(get_session),
):
    user = session.exec(
        select(User).where(User.email == data.email)
    ).first()

    if not user or not verify_password(
        data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = create_access_token({"sub": str(user.id)})

    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user
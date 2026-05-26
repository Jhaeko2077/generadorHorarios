from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import (
    AdminCreateRequest,
    LoginRequest,
    TeacherRegisterRequest,
    Token,
    UserRead,
)
from app.services.auth_service import (
    authenticate,
    create_admin_account,
    create_teacher_account,
    token_for_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])
optional_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


@router.post("/register-teacher", response_model=UserRead)
def register_teacher(payload: TeacherRegisterRequest, db: Session = Depends(get_db)) -> User:
    return create_teacher_account(db, payload)


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    user = authenticate(db, payload.email, payload.password)
    return Token(access_token=token_for_user(user))


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/create-admin", response_model=UserRead)
def create_admin(
    payload: AdminCreateRequest,
    db: Session = Depends(get_db),
    token: str | None = Depends(optional_oauth2),
) -> User:
    current_user = None
    if token:
        try:
            user_id = decode_access_token(token).get("sub")
            current_user = db.get(User, user_id) if user_id else None
        except ValueError:
            current_user = None
    return create_admin_account(db, payload, current_user)

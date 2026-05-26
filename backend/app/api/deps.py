from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.teacher import TeacherProfile
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    user_id = payload.get("sub")
    user = db.get(User, user_id) if user_id else None
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin role required")
    return current_user


def require_teacher_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in {UserRole.teacher, UserRole.admin}:
        raise HTTPException(status_code=403, detail="Teacher or admin role required")
    return current_user


def current_teacher_profile(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> TeacherProfile:
    profile = db.scalar(select(TeacherProfile).where(TeacherProfile.user_id == current_user.id))
    if not profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    return profile

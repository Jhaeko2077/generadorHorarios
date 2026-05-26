from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.core.security import create_access_token, hash_password, verify_password
from app.models.teacher import TeacherProfile
from app.models.user import User
from app.schemas.common import AdminCreateRequest, TeacherRegisterRequest


def authenticate(db: Session, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.email == email.lower()))
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive account")
    return user


def token_for_user(user: User) -> str:
    return create_access_token(user.id, {"role": user.role.value, "email": user.email})


def create_teacher_account(db: Session, payload: TeacherRegisterRequest) -> User:
    if db.scalar(select(User.id).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        full_name=payload.full_name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=UserRole.teacher,
    )
    db.add(user)
    db.flush()
    profile = TeacherProfile(
        user_id=user.id,
        employment_type=payload.employment_type,
        academic_role=payload.academic_role,
        max_weekly_hours=payload.max_weekly_hours,
        max_daily_hours=payload.max_daily_hours,
        max_consecutive_blocks=payload.max_consecutive_blocks,
        preferred_shift=payload.preferred_shift,
        can_teach_theory=payload.can_teach_theory,
        can_teach_labs=payload.can_teach_labs,
        can_teach_workshops=payload.can_teach_workshops,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return user


def create_admin_account(db: Session, payload: AdminCreateRequest, requester: User | None = None) -> User:
    admin_exists = db.scalar(select(User.id).where(User.role == UserRole.admin))
    if admin_exists and (not requester or requester.role != UserRole.admin):
        raise HTTPException(status_code=403, detail="Admin creation is restricted")
    if db.scalar(select(User.id).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        full_name=payload.full_name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=UserRole.admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

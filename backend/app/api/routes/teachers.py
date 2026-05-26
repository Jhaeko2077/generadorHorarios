from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import (
    current_teacher_profile,
    get_current_user,
    require_admin,
    require_teacher_or_admin,
)
from app.core.enums import UserRole
from app.db.session import get_db
from app.models.teacher import TeacherAvailability, TeacherProfile
from app.models.user import User
from app.schemas.common import (
    AvailabilityCreate,
    AvailabilityRead,
    TeacherProfileRead,
    TeacherProfileUpdate,
)
from app.services.audit_service import write_audit

router = APIRouter(tags=["teachers"])


def _can_access_teacher(user: User, profile: TeacherProfile) -> bool:
    return user.role == UserRole.admin or profile.user_id == user.id


@router.get("/teachers", response_model=list[TeacherProfileRead])
def list_teachers(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.scalars(select(TeacherProfile).options(selectinload(TeacherProfile.user))).all()


@router.get("/teachers/{teacher_id}", response_model=TeacherProfileRead)
def get_teacher(
    teacher_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin),
):
    profile = db.get(TeacherProfile, teacher_id)
    if not profile:
        raise HTTPException(404, "Teacher not found")
    if not _can_access_teacher(current_user, profile):
        raise HTTPException(403, "Cannot access this teacher")
    return profile


@router.put("/teachers/{teacher_id}/profile", response_model=TeacherProfileRead)
def update_teacher_profile(
    teacher_id: str,
    payload: TeacherProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin),
):
    profile = db.get(TeacherProfile, teacher_id)
    if not profile:
        raise HTTPException(404, "Teacher not found")
    if not _can_access_teacher(current_user, profile):
        raise HTTPException(403, "Cannot update this teacher")
    before = {c.name: getattr(profile, c.name) for c in profile.__table__.columns}
    for key, value in payload.model_dump().items():
        setattr(profile, key, value)
    write_audit(
        db,
        user_id=current_user.id,
        action="update",
        entity_type="teacher_profile",
        entity_id=profile.id,
        before=before,
        after=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/teachers/{teacher_id}/availability", response_model=list[AvailabilityRead])
def list_availability(
    teacher_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin),
):
    profile = db.get(TeacherProfile, teacher_id)
    if not profile:
        raise HTTPException(404, "Teacher not found")
    if not _can_access_teacher(current_user, profile):
        raise HTTPException(403, "Cannot access this teacher")
    return db.scalars(select(TeacherAvailability).where(TeacherAvailability.teacher_id == teacher_id)).all()


@router.post("/teachers/{teacher_id}/availability", response_model=AvailabilityRead)
def create_availability(
    teacher_id: str,
    payload: AvailabilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin),
):
    profile = db.get(TeacherProfile, teacher_id)
    if not profile:
        raise HTTPException(404, "Teacher not found")
    if not _can_access_teacher(current_user, profile):
        raise HTTPException(403, "Cannot update this teacher")
    item = TeacherAvailability(teacher_id=teacher_id, **payload.model_dump())
    db.add(item)
    write_audit(
        db,
        user_id=current_user.id,
        action="create",
        entity_type="teacher_availability",
        entity_id=None,
        after=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/teachers/{teacher_id}/availability/{availability_id}", response_model=AvailabilityRead)
def update_availability(
    teacher_id: str,
    availability_id: str,
    payload: AvailabilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin),
):
    profile = db.get(TeacherProfile, teacher_id)
    item = db.get(TeacherAvailability, availability_id)
    if not profile or not item or item.teacher_id != teacher_id:
        raise HTTPException(404, "Availability block not found")
    if not _can_access_teacher(current_user, profile):
        raise HTTPException(403, "Cannot update this teacher")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    write_audit(
        db,
        user_id=current_user.id,
        action="update",
        entity_type="teacher_availability",
        entity_id=item.id,
        after=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/teachers/{teacher_id}/availability/{availability_id}")
def delete_availability(
    teacher_id: str,
    availability_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin),
):
    profile = db.get(TeacherProfile, teacher_id)
    item = db.get(TeacherAvailability, availability_id)
    if not profile or not item or item.teacher_id != teacher_id:
        raise HTTPException(404, "Availability block not found")
    if not _can_access_teacher(current_user, profile):
        raise HTTPException(403, "Cannot update this teacher")
    db.delete(item)
    write_audit(
        db,
        user_id=current_user.id,
        action="delete",
        entity_type="teacher_availability",
        entity_id=item.id,
    )
    db.commit()
    return {"ok": True}


@router.get("/me/teacher-profile", response_model=TeacherProfileRead)
def my_profile(profile: TeacherProfile = Depends(current_teacher_profile)):
    return profile


@router.put("/me/teacher-profile", response_model=TeacherProfileRead)
def update_my_profile(
    payload: TeacherProfileUpdate,
    profile: TeacherProfile = Depends(current_teacher_profile),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_teacher_profile(profile.id, payload, db, current_user)


@router.get("/me/availability", response_model=list[AvailabilityRead])
def my_availability(
    profile: TeacherProfile = Depends(current_teacher_profile), db: Session = Depends(get_db)
):
    return db.scalars(select(TeacherAvailability).where(TeacherAvailability.teacher_id == profile.id)).all()


@router.post("/me/availability", response_model=AvailabilityRead)
def create_my_availability(
    payload: AvailabilityCreate,
    profile: TeacherProfile = Depends(current_teacher_profile),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_availability(profile.id, payload, db, current_user)

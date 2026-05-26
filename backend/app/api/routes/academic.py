from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin, require_teacher_or_admin
from app.core.enums import DayOfWeek, RoomType, Shift
from app.db.session import get_db
from app.models.academic import (
    AcademicTerm,
    Course,
    CourseOffering,
    Cycle,
    Program,
    Section,
    TimeSlot,
)
from app.models.room import Room, RoomUnavailability
from app.models.schedule import ManualLock
from app.models.user import User
from app.schemas.common import (
    AcademicTermIn,
    CourseIn,
    CourseOfferingIn,
    CycleIn,
    ManualLockIn,
    ProgramIn,
    RoomIn,
    RoomUnavailabilityIn,
    SectionIn,
    TimeSlotIn,
)
from app.services.audit_service import write_audit

router = APIRouter(tags=["academic data"])


def _crud_list(db: Session, model: type, filters: list[Any] | None = None):
    stmt = select(model)
    for condition in filters or []:
        stmt = stmt.where(condition)
    return db.scalars(stmt).all()


def _create(db: Session, user: User, model: type, payload: Any):
    item = model(**payload.model_dump())
    db.add(item)
    db.flush()
    write_audit(
        db,
        user_id=user.id,
        action="create",
        entity_type=model.__tablename__,
        entity_id=item.id,
        after=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(item)
    return item


def _get_or_404(db: Session, model: type, item_id: str):
    item = db.get(model, item_id)
    if not item:
        raise HTTPException(404, f"{model.__name__} not found")
    return item


def _update(db: Session, user: User, model: type, item_id: str, payload: Any):
    item = _get_or_404(db, model, item_id)
    before = {c.name: getattr(item, c.name) for c in item.__table__.columns}
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    write_audit(
        db,
        user_id=user.id,
        action="update",
        entity_type=model.__tablename__,
        entity_id=item.id,
        before=before,
        after=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(item)
    return item


def _delete(db: Session, user: User, model: type, item_id: str):
    item = _get_or_404(db, model, item_id)
    db.delete(item)
    write_audit(db, user_id=user.id, action="delete", entity_type=model.__tablename__, entity_id=item_id)
    db.commit()
    return {"ok": True}


@router.get("/academic-terms")
def list_terms(db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _crud_list(db, AcademicTerm)


@router.post("/academic-terms")
def create_term(payload: AcademicTermIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _create(db, user, AcademicTerm, payload)


@router.get("/academic-terms/{item_id}")
def get_term(item_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _get_or_404(db, AcademicTerm, item_id)


@router.put("/academic-terms/{item_id}")
def update_term(item_id: str, payload: AcademicTermIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _update(db, user, AcademicTerm, item_id, payload)


@router.delete("/academic-terms/{item_id}")
def delete_term(item_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _delete(db, user, AcademicTerm, item_id)


@router.get("/programs")
def list_programs(db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _crud_list(db, Program)


@router.post("/programs")
def create_program(payload: ProgramIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _create(db, user, Program, payload)


@router.get("/programs/{item_id}")
def get_program(item_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _get_or_404(db, Program, item_id)


@router.put("/programs/{item_id}")
def update_program(item_id: str, payload: ProgramIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _update(db, user, Program, item_id, payload)


@router.delete("/programs/{item_id}")
def delete_program(item_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _delete(db, user, Program, item_id)


@router.get("/cycles")
def list_cycles(program_id: str | None = None, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _crud_list(db, Cycle, [Cycle.program_id == program_id] if program_id else None)


@router.post("/cycles")
def create_cycle(payload: CycleIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _create(db, user, Cycle, payload)


@router.get("/cycles/{item_id}")
def get_cycle(item_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _get_or_404(db, Cycle, item_id)


@router.put("/cycles/{item_id}")
def update_cycle(item_id: str, payload: CycleIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _update(db, user, Cycle, item_id, payload)


@router.delete("/cycles/{item_id}")
def delete_cycle(item_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _delete(db, user, Cycle, item_id)


@router.get("/sections")
def list_sections(
    academic_term_id: str | None = None,
    cycle_id: str | None = None,
    program_id: str | None = None,
    shift: Shift | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher_or_admin),
):
    filters: list[Any] = []
    if academic_term_id:
        filters.append(Section.academic_term_id == academic_term_id)
    if cycle_id:
        filters.append(Section.cycle_id == cycle_id)
    if shift:
        filters.append(Section.shift == shift)
    stmt = select(Section)
    if program_id:
        stmt = stmt.join(Cycle).where(Cycle.program_id == program_id)
    for condition in filters:
        stmt = stmt.where(condition)
    return db.scalars(stmt).all()


@router.post("/sections")
def create_section(payload: SectionIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _create(db, user, Section, payload)


@router.get("/sections/{item_id}")
def get_section(item_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _get_or_404(db, Section, item_id)


@router.put("/sections/{item_id}")
def update_section(item_id: str, payload: SectionIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _update(db, user, Section, item_id, payload)


@router.delete("/sections/{item_id}")
def delete_section(item_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _delete(db, user, Section, item_id)


@router.get("/courses")
def list_courses(
    cycle_id: str | None = None,
    requires_lab: bool | None = None,
    room_type_required: RoomType | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher_or_admin),
):
    filters: list[Any] = []
    if cycle_id:
        filters.append(Course.cycle_id == cycle_id)
    if requires_lab is not None:
        filters.append(Course.requires_lab == requires_lab)
    if room_type_required:
        filters.append(Course.room_type_required == room_type_required)
    return _crud_list(db, Course, filters)


@router.post("/courses")
def create_course(payload: CourseIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    if payload.sessions_per_week is None and payload.weekly_hours % payload.session_duration_blocks:
        raise HTTPException(422, "weekly_hours must be divisible by session_duration_blocks")
    return _create(db, user, Course, payload)


@router.get("/courses/{item_id}")
def get_course(item_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _get_or_404(db, Course, item_id)


@router.put("/courses/{item_id}")
def update_course(item_id: str, payload: CourseIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _update(db, user, Course, item_id, payload)


@router.delete("/courses/{item_id}")
def delete_course(item_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _delete(db, user, Course, item_id)


@router.get("/rooms")
def list_rooms(
    room_type: RoomType | None = None,
    min_capacity: int | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher_or_admin),
):
    filters: list[Any] = []
    if room_type:
        filters.append(Room.room_type == room_type)
    if min_capacity:
        filters.append(Room.capacity >= min_capacity)
    if is_active is not None:
        filters.append(Room.is_active == is_active)
    return _crud_list(db, Room, filters)


@router.post("/rooms")
def create_room(payload: RoomIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _create(db, user, Room, payload)


@router.get("/rooms/{item_id}")
def get_room(item_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _get_or_404(db, Room, item_id)


@router.put("/rooms/{item_id}")
def update_room(item_id: str, payload: RoomIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _update(db, user, Room, item_id, payload)


@router.delete("/rooms/{item_id}")
def delete_room(item_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _delete(db, user, Room, item_id)


@router.get("/rooms/{room_id}/unavailability")
def list_room_unavailability(room_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return db.scalars(select(RoomUnavailability).where(RoomUnavailability.room_id == room_id)).all()


@router.post("/rooms/{room_id}/unavailability")
def create_room_unavailability(
    room_id: str,
    payload: RoomUnavailabilityIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    _get_or_404(db, Room, room_id)
    item = RoomUnavailability(room_id=room_id, **payload.model_dump())
    db.add(item)
    db.flush()
    write_audit(db, user_id=user.id, action="create", entity_type="room_unavailability", entity_id=item.id, after=payload.model_dump(mode="json"))
    db.commit()
    db.refresh(item)
    return item


@router.put("/rooms/{room_id}/unavailability/{item_id}")
def update_room_unavailability(
    room_id: str,
    item_id: str,
    payload: RoomUnavailabilityIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    item = _get_or_404(db, RoomUnavailability, item_id)
    if item.room_id != room_id:
        raise HTTPException(404, "Room unavailability not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    write_audit(db, user_id=user.id, action="update", entity_type="room_unavailability", entity_id=item.id, after=payload.model_dump(mode="json"))
    db.commit()
    db.refresh(item)
    return item


@router.delete("/rooms/{room_id}/unavailability/{item_id}")
def delete_room_unavailability(room_id: str, item_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    item = _get_or_404(db, RoomUnavailability, item_id)
    if item.room_id != room_id:
        raise HTTPException(404, "Room unavailability not found")
    db.delete(item)
    write_audit(db, user_id=user.id, action="delete", entity_type="room_unavailability", entity_id=item.id)
    db.commit()
    return {"ok": True}


@router.get("/time-slots")
def list_time_slots(db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _crud_list(db, TimeSlot)


@router.post("/time-slots")
def create_time_slot(payload: TimeSlotIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _create(db, user, TimeSlot, payload)


@router.post("/time-slots/bulk-generate")
def bulk_generate_time_slots(db: Session = Depends(get_db), user: User = Depends(require_admin)):
    from datetime import time

    days = [
        DayOfWeek.monday,
        DayOfWeek.tuesday,
        DayOfWeek.wednesday,
        DayOfWeek.thursday,
        DayOfWeek.friday,
        DayOfWeek.saturday,
    ]
    blocks = [
        (1, time(7), time(8), Shift.morning),
        (2, time(8), time(9), Shift.morning),
        (3, time(9), time(10), Shift.morning),
        (4, time(10), time(11), Shift.morning),
        (5, time(11), time(12), Shift.morning),
        (6, time(13), time(14), Shift.afternoon),
        (7, time(14), time(15), Shift.afternoon),
        (8, time(15), time(16), Shift.afternoon),
        (9, time(16), time(17), Shift.afternoon),
        (10, time(18), time(19), Shift.evening),
        (11, time(19), time(20), Shift.evening),
        (12, time(20), time(21), Shift.evening),
        (13, time(21), time(22), Shift.evening),
    ]
    created = 0
    for day in days:
        for block_index, start, end, shift in blocks:
            exists = db.scalar(
                select(TimeSlot.id).where(TimeSlot.day_of_week == day, TimeSlot.block_index == block_index)
            )
            if not exists:
                db.add(TimeSlot(day_of_week=day, block_index=block_index, start_time=start, end_time=end, shift=shift))
                created += 1
    write_audit(db, user_id=user.id, action="bulk_generate", entity_type="time_slots", entity_id=None, after={"created": created})
    db.commit()
    return {"created": created}


@router.get("/time-slots/{item_id}")
def get_time_slot(item_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _get_or_404(db, TimeSlot, item_id)


@router.put("/time-slots/{item_id}")
def update_time_slot(item_id: str, payload: TimeSlotIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _update(db, user, TimeSlot, item_id, payload)


@router.delete("/time-slots/{item_id}")
def delete_time_slot(item_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _delete(db, user, TimeSlot, item_id)


@router.get("/course-offerings")
def list_offerings(
    academic_term_id: str | None = None,
    section_id: str | None = None,
    teacher_id: str | None = None,
    course_id: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher_or_admin),
):
    filters: list[Any] = []
    if academic_term_id:
        filters.append(CourseOffering.academic_term_id == academic_term_id)
    if section_id:
        filters.append(CourseOffering.section_id == section_id)
    if teacher_id:
        filters.append(CourseOffering.teacher_id == teacher_id)
    if course_id:
        filters.append(CourseOffering.course_id == course_id)
    return _crud_list(db, CourseOffering, filters)


@router.post("/course-offerings")
def create_offering(payload: CourseOfferingIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    if payload.weekly_hours % payload.session_duration_blocks:
        raise HTTPException(422, "weekly_hours must be divisible by session_duration_blocks")
    return _create(db, user, CourseOffering, payload)


@router.get("/course-offerings/{item_id}")
def get_offering(item_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _get_or_404(db, CourseOffering, item_id)


@router.put("/course-offerings/{item_id}")
def update_offering(item_id: str, payload: CourseOfferingIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _update(db, user, CourseOffering, item_id, payload)


@router.delete("/course-offerings/{item_id}")
def delete_offering(item_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _delete(db, user, CourseOffering, item_id)


@router.get("/manual-locks")
def list_manual_locks(academic_term_id: str | None = None, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    filters = [ManualLock.academic_term_id == academic_term_id] if academic_term_id else None
    return _crud_list(db, ManualLock, filters)


@router.post("/manual-locks")
def create_manual_lock(payload: ManualLockIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    item = ManualLock(**payload.model_dump(), created_by_user_id=user.id)
    db.add(item)
    db.flush()
    write_audit(db, user_id=user.id, action="create", entity_type="manual_locks", entity_id=item.id, after=payload.model_dump(mode="json"))
    db.commit()
    db.refresh(item)
    return item


@router.delete("/manual-locks/{item_id}")
def delete_manual_lock(item_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return _delete(db, user, ManualLock, item_id)

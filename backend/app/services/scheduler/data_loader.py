from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.academic import AcademicTerm, CourseOffering, Section, TimeSlot
from app.models.room import Room, RoomUnavailability
from app.models.schedule import ManualLock, ScheduleAssignment, ScheduleRun
from app.models.teacher import TeacherProfile
from app.services.scheduler.models import (
    AvailabilityBlockDTO,
    CourseOfferingDTO,
    ManualLockDTO,
    PreviousAssignmentDTO,
    RoomDTO,
    SchedulerInput,
    SectionDTO,
    TeacherDTO,
    TimeSlotDTO,
)


def load_scheduler_input(db: Session, academic_term_id: str, respect_manual_locks: bool = True) -> SchedulerInput:
    term = db.get(AcademicTerm, academic_term_id)
    slots = {
        item.id: TimeSlotDTO(
            id=item.id,
            day_of_week=item.day_of_week,
            block_index=item.block_index,
            start_time=item.start_time,
            end_time=item.end_time,
            shift=item.shift,
        )
        for item in db.scalars(select(TimeSlot).where(TimeSlot.is_active.is_(True))).all()
    }
    room_unavailable = _room_unavailable_slots(db, slots)
    rooms = {
        item.id: RoomDTO(
            id=item.id,
            code=item.code,
            room_type=item.room_type,
            capacity=item.capacity,
            unavailable_slot_ids=room_unavailable.get(item.id, set()),
        )
        for item in db.scalars(select(Room).where(Room.is_active.is_(True))).all()
    }
    teachers = {
        item.id: TeacherDTO(
            id=item.id,
            user_id=item.user_id,
            full_name=item.user.full_name,
            employment_type=item.employment_type,
            max_weekly_hours=item.max_weekly_hours,
            min_weekly_hours=item.min_weekly_hours,
            max_daily_hours=item.max_daily_hours,
            max_consecutive_blocks=item.max_consecutive_blocks,
            preferred_shift=item.preferred_shift,
            availability_blocks=[
                AvailabilityBlockDTO(a.day_of_week, a.start_time, a.end_time, a.availability_type)
                for a in item.availability
            ],
        )
        for item in db.scalars(
            select(TeacherProfile).options(
                selectinload(TeacherProfile.user), selectinload(TeacherProfile.availability)
            )
        ).all()
    }
    sections = {
        item.id: SectionDTO(
            id=item.id,
            name=item.name,
            student_count=item.student_count,
            shift=item.shift,
            cycle_id=item.cycle_id,
            cycle_number=item.cycle.number,
        )
        for item in db.scalars(
            select(Section).where(Section.academic_term_id == academic_term_id, Section.is_active.is_(True)).options(selectinload(Section.cycle))
        ).all()
    }
    offerings = [
        CourseOfferingDTO(
            id=item.id,
            course_id=item.course_id,
            course_name=item.course.name,
            section_id=item.section_id,
            section_name=item.section.name,
            teacher_id=item.teacher_id,
            weekly_hours=item.weekly_hours,
            session_duration_blocks=item.session_duration_blocks,
            sessions_per_week=item.sessions_per_week,
            requires_lab=item.requires_lab,
            room_type_required=item.room_type_required,
            priority=item.priority,
        )
        for item in db.scalars(
            select(CourseOffering)
            .where(CourseOffering.academic_term_id == academic_term_id, CourseOffering.is_active.is_(True))
            .options(selectinload(CourseOffering.course), selectinload(CourseOffering.section))
        ).all()
    ]
    locks = []
    if respect_manual_locks:
        locks = [
            ManualLockDTO(
                course_offering_id=item.course_offering_id,
                room_id=item.room_id,
                start_time_slot_id=item.start_time_slot_id,
                duration_blocks=item.duration_blocks,
            )
            for item in db.scalars(select(ManualLock).where(ManualLock.academic_term_id == academic_term_id)).all()
        ]
    previous = _load_previous_assignments(db, term.previous_term_id if term else None)
    return SchedulerInput(
        academic_term_id=academic_term_id,
        teachers=teachers,
        sections=sections,
        offerings=offerings,
        rooms=rooms,
        time_slots=slots,
        manual_locks=locks,
        previous_assignments=previous,
    )


def _room_unavailable_slots(db: Session, slots: dict[str, TimeSlotDTO]) -> dict[str, set[str]]:
    result: dict[str, set[str]] = {}
    for unavailable in db.scalars(select(RoomUnavailability)).all():
        blocked = result.setdefault(unavailable.room_id, set())
        for slot in slots.values():
            if (
                slot.day_of_week == unavailable.day_of_week
                and slot.start_time >= unavailable.start_time
                and slot.end_time <= unavailable.end_time
            ):
                blocked.add(slot.id)
    return result


def _load_previous_assignments(db: Session, previous_term_id: str | None) -> list[PreviousAssignmentDTO]:
    if not previous_term_id:
        return []
    previous_run = db.scalar(
        select(ScheduleRun)
        .where(ScheduleRun.academic_term_id == previous_term_id)
        .order_by(ScheduleRun.created_at.desc())
    )
    if not previous_run:
        return []
    return [
        PreviousAssignmentDTO(
            course_offering_id=a.course_offering_id,
            teacher_id=a.teacher_id,
            section_id=a.section_id,
            room_id=a.room_id,
            start_time_slot_id=a.start_time_slot_id,
            day_of_week=a.day_of_week,
            duration_blocks=a.duration_blocks,
        )
        for a in db.scalars(
            select(ScheduleAssignment).where(ScheduleAssignment.schedule_run_id == previous_run.id)
        ).all()
    ]

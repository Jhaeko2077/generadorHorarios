from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import AvailabilityType
from app.models.academic import CourseOffering
from app.models.schedule import ScheduleAssignment
from app.services.scheduler.data_loader import load_scheduler_input
from app.services.scheduler.domain import base_penalties, classify_teacher_availability
from app.services.scheduler.scorer import normalize_weights
from app.services.scheduler.utils import consecutive_coverage, room_compatible, shift_allows


def recommend_placements(
    db: Session,
    *,
    course_offering_id: str,
    academic_term_id: str,
    schedule_run_id: str | None,
    limit: int,
) -> list[dict]:
    offering_model = db.get(CourseOffering, course_offering_id)
    if not offering_model:
        return []
    data = load_scheduler_input(db, academic_term_id, respect_manual_locks=False)
    offering = next((item for item in data.offerings if item.id == course_offering_id), None)
    if not offering:
        return []
    teacher = data.teachers[offering.teacher_id]
    section = data.sections[offering.section_id]
    occupied = _occupied(db, schedule_run_id)
    weights = normalize_weights(None)
    items: list[dict] = []
    for slot in data.time_slots.values():
        covered = consecutive_coverage(slot, offering.session_duration_blocks, data.time_slots)
        if not covered or not shift_allows(section.shift, slot.shift):
            continue
        availability = classify_teacher_availability(teacher, covered)
        if availability == AvailabilityType.unavailable:
            continue
        covered_ids = {s.id for s in covered}
        for room in data.rooms.values():
            if not room_compatible(offering.room_type_required, offering.requires_lab, room.room_type):
                continue
            if room.capacity < section.student_count or covered_ids & room.unavailable_slot_ids:
                continue
            penalties = base_penalties(offering, teacher, room.room_type, slot, availability, weights)
            conflict_penalty = 0
            for slot_id in covered_ids:
                if (teacher.id, slot_id) in occupied["teacher"]:
                    conflict_penalty += 100
                if (section.id, slot_id) in occupied["section"]:
                    conflict_penalty += 100
                if (room.id, slot_id) in occupied["room"]:
                    conflict_penalty += 100
            if conflict_penalty:
                penalties["existing_schedule_conflict"] = conflict_penalty
            score = 100 - sum(penalties.values())
            reason = "Recommended because hard constraints are satisfied"
            if availability == AvailabilityType.preferred:
                reason += ", the teacher marked this period as preferred"
            reason += f", and room {room.code} fits the section capacity."
            items.append(
                {
                    "time_slot_id": slot.id,
                    "day_of_week": slot.day_of_week,
                    "start_time": slot.start_time,
                    "end_time": covered[-1].end_time,
                    "room_id": room.id,
                    "room_code": room.code,
                    "score": score,
                    "explanation": reason,
                    "penalties": penalties,
                }
            )
    items.sort(key=lambda item: item["score"], reverse=True)
    return items[:limit]


def _occupied(db: Session, schedule_run_id: str | None) -> dict[str, set[tuple[str, str]]]:
    result = {"teacher": set(), "section": set(), "room": set()}
    if not schedule_run_id:
        return result
    for assignment in db.scalars(
        select(ScheduleAssignment).where(ScheduleAssignment.schedule_run_id == schedule_run_id)
    ).all():
        for slot in assignment.slots:
            result["teacher"].add((assignment.teacher_id, slot.time_slot_id))
            result["section"].add((assignment.section_id, slot.time_slot_id))
            result["room"].add((assignment.room_id, slot.time_slot_id))
    return result

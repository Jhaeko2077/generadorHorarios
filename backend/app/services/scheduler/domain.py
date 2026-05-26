from __future__ import annotations

from collections import Counter

from app.core.enums import AvailabilityType, RoomType, Shift
from app.services.scheduler.models import (
    CourseOfferingDTO,
    Diagnostic,
    DomainResult,
    ManualLockDTO,
    PlacementDTO,
    SchedulerInput,
    SessionDTO,
    TeacherDTO,
    TimeSlotDTO,
)
from app.services.scheduler.utils import consecutive_coverage, room_compatible, shift_allows


def build_domain(data: SchedulerInput, weights: dict[str, int]) -> DomainResult:
    diagnostics: list[Diagnostic] = []
    diagnostics.extend(validate_obvious_issues(data))
    sessions = expand_sessions(data.offerings, diagnostics)
    placements: dict[str, list[PlacementDTO]] = {session.id: [] for session in sessions}
    for session in sessions:
        offering = session.offering
        teacher = data.teachers.get(offering.teacher_id)
        section = data.sections.get(offering.section_id)
        if not teacher or not section:
            continue
        for slot in data.time_slots.values():
            covered = consecutive_coverage(slot, offering.session_duration_blocks, data.time_slots)
            if not covered or not shift_allows(section.shift, slot.shift):
                continue
            availability = classify_teacher_availability(teacher, covered)
            if availability == AvailabilityType.unavailable:
                continue
            for room in data.rooms.values():
                if not room_compatible(offering.room_type_required, offering.requires_lab, room.room_type):
                    continue
                if room.capacity < section.student_count:
                    continue
                if any(covered_slot.id in room.unavailable_slot_ids for covered_slot in covered):
                    continue
                penalties = base_penalties(offering, teacher, room.room_type, slot, availability, weights)
                placements[session.id].append(
                    PlacementDTO(
                        session_id=session.id,
                        offering_id=offering.id,
                        teacher_id=offering.teacher_id,
                        section_id=offering.section_id,
                        start_slot_id=slot.id,
                        room_id=room.id,
                        day_of_week=slot.day_of_week,
                        start_time=slot.start_time,
                        end_time=covered[-1].end_time,
                        duration_blocks=offering.session_duration_blocks,
                        covered_slot_ids=[covered_slot.id for covered_slot in covered],
                        availability_type=availability,
                        base_penalties=penalties,
                    )
                )
        if not placements[session.id]:
            diagnostics.append(
                Diagnostic(
                    "no_feasible_slot_for_offering",
                    "hard",
                    f"No feasible placement exists for {offering.course_name} in {offering.section_name}.",
                    {"course_offering_id": offering.id},
                )
            )
    diagnostics.extend(validate_manual_locks(data, sessions, placements))
    return DomainResult(sessions=sessions, placements=placements, diagnostics=_dedupe(diagnostics))


def expand_sessions(offerings: list[CourseOfferingDTO], diagnostics: list[Diagnostic]) -> list[SessionDTO]:
    sessions: list[SessionDTO] = []
    for offering in offerings:
        if offering.weekly_hours <= 0 or offering.session_duration_blocks <= 0:
            diagnostics.append(Diagnostic("invalid_offering_hours", "hard", "Course offering has invalid weekly hours.", {"course_offering_id": offering.id}))
            continue
        if offering.weekly_hours % offering.session_duration_blocks:
            diagnostics.append(
                Diagnostic(
                    "invalid_session_split",
                    "hard",
                    f"{offering.course_name} weekly hours must be divisible by session duration.",
                    {"course_offering_id": offering.id},
                )
            )
            continue
        count = offering.sessions_per_week or offering.weekly_hours // offering.session_duration_blocks
        if count <= 0:
            diagnostics.append(Diagnostic("invalid_sessions_per_week", "hard", "Course offering has no sessions.", {"course_offering_id": offering.id}))
            continue
        for idx in range(count):
            sessions.append(SessionDTO(id=f"{offering.id}:session:{idx + 1}", index=idx + 1, offering=offering))
    return sessions


def classify_teacher_availability(teacher: TeacherDTO, covered_slots: list[TimeSlotDTO]) -> AvailabilityType:
    statuses: list[AvailabilityType] = []
    for slot in covered_slots:
        matching = [
            block.availability_type
            for block in teacher.availability_blocks
            if block.day_of_week == slot.day_of_week
            and slot.start_time >= block.start_time
            and slot.end_time <= block.end_time
        ]
        if AvailabilityType.unavailable in matching or not matching:
            return AvailabilityType.unavailable
        if AvailabilityType.preferred in matching:
            statuses.append(AvailabilityType.preferred)
        elif AvailabilityType.available in matching:
            statuses.append(AvailabilityType.available)
        else:
            statuses.append(AvailabilityType.discouraged)
    if all(status == AvailabilityType.preferred for status in statuses):
        return AvailabilityType.preferred
    if all(status == AvailabilityType.discouraged for status in statuses):
        return AvailabilityType.discouraged
    return AvailabilityType.available


def base_penalties(
    offering: CourseOfferingDTO,
    teacher: TeacherDTO,
    room_type: RoomType,
    slot: TimeSlotDTO,
    availability: AvailabilityType,
    weights: dict[str, int],
) -> dict[str, int]:
    penalties: dict[str, int] = {}
    if availability == AvailabilityType.discouraged:
        penalties["teacher_discouraged_slot"] = weights["teacher_discouraged_slot"]
    elif availability == AvailabilityType.available and any(
        block.availability_type == AvailabilityType.preferred for block in teacher.availability_blocks
    ):
        penalties["teacher_non_preferred_slot"] = weights["teacher_non_preferred_slot"]
    if slot.shift == Shift.evening or slot.block_index in {5, 9, 13}:
        penalties["late_block"] = weights["late_block"]
    if offering.room_type_required == RoomType.any and room_type != RoomType.classroom and not offering.requires_lab:
        penalties["lab_scarcity"] = weights["lab_scarcity"]
    if teacher.preferred_shift not in {Shift.any, Shift.mixed} and teacher.preferred_shift != slot.shift:
        penalties["teacher_shift_preference"] = weights["teacher_non_preferred_slot"]
    return penalties


def validate_obvious_issues(data: SchedulerInput) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    if not data.time_slots:
        diagnostics.append(Diagnostic("no_active_time_slots", "hard", "There are no active time slots available for scheduling."))
    if not data.rooms:
        diagnostics.append(Diagnostic("no_active_rooms", "hard", "There are no active rooms."))
    if not data.offerings:
        diagnostics.append(Diagnostic("no_course_offerings", "hard", "There are no active course offerings for this academic term."))

    diagnostics.extend(_section_load_diagnostics(data))
    diagnostics.extend(_teacher_load_diagnostics(data))

    for offering in data.offerings:
        teacher = data.teachers.get(offering.teacher_id)
        section = data.sections.get(offering.section_id)
        if not teacher:
            diagnostics.append(Diagnostic("missing_teacher", "hard", "A course offering references a missing teacher.", {"course_offering_id": offering.id}))
            continue
        if not teacher.availability_blocks:
            diagnostics.append(Diagnostic("teacher_missing_availability", "hard", f"{teacher.full_name} has no availability. By MVP rule, that teacher is unavailable by default.", {"teacher_id": teacher.id}))
        if not section:
            diagnostics.append(Diagnostic("missing_section", "hard", "A course offering references a missing section.", {"course_offering_id": offering.id}))
            continue

        compatible_rooms = [room for room in data.rooms.values() if room_compatible(offering.room_type_required, offering.requires_lab, room.room_type)]
        capacity_rooms = [room for room in compatible_rooms if room.capacity >= section.student_count]
        if offering.room_type_required in {RoomType.lab, RoomType.workshop, RoomType.computer_lab} and not compatible_rooms:
            diagnostics.append(Diagnostic("insufficient_compatible_rooms", "hard", f"{offering.course_name} requires {offering.room_type_required.value}, but no compatible active room exists.", {"course_offering_id": offering.id}))
        if compatible_rooms and not capacity_rooms:
            diagnostics.append(Diagnostic("room_capacity_mismatch", "hard", f"Compatible rooms for {offering.course_name} are too small for section {section.name} ({section.student_count} students).", {"course_offering_id": offering.id}))
        if not compatible_rooms:
            diagnostics.append(Diagnostic("no_compatible_room", "hard", f"No compatible room exists for {offering.course_name} / {section.name}.", {"course_offering_id": offering.id}))
        elif not capacity_rooms:
            diagnostics.append(Diagnostic("no_compatible_room_capacity", "hard", f"No compatible room has enough capacity for {offering.course_name} / {section.name}.", {"course_offering_id": offering.id}))

        if teacher and section and not _has_teacher_compatible_slot(data, offering, teacher, section):
            diagnostics.append(Diagnostic("no_compatible_slot_due_teacher_availability", "hard", f"{teacher.full_name} has no allowed availability block that fits {offering.course_name} for section {section.name}.", {"course_offering_id": offering.id, "teacher_id": teacher.id}))
    return diagnostics


def validate_manual_locks(data: SchedulerInput, sessions: list[SessionDTO], placements: dict[str, list[PlacementDTO]]) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    lock_coverage: list[tuple[ManualLockDTO, CourseOfferingDTO, list[str]]] = []
    offerings = {offering.id: offering for offering in data.offerings}
    for lock in data.manual_locks:
        offering = offerings.get(lock.course_offering_id)
        matching_sessions = [s for s in sessions if s.offering.id == lock.course_offering_id]
        if not offering or not matching_sessions:
            diagnostics.append(Diagnostic("manual_lock_missing_offering", "hard", "Manual lock references an offering that is not active.", {"course_offering_id": lock.course_offering_id}))
            continue
        slot = data.time_slots.get(lock.start_time_slot_id)
        room = data.rooms.get(lock.room_id)
        teacher = data.teachers.get(offering.teacher_id)
        section = data.sections.get(offering.section_id)
        covered = consecutive_coverage(slot, lock.duration_blocks, data.time_slots) if slot else None
        if not slot or not room or not teacher or not section or not covered:
            diagnostics.append(Diagnostic("manual_lock_invalid_reference", "hard", "Manual lock references a missing room, slot, teacher, section, or invalid duration.", {"course_offering_id": lock.course_offering_id}))
            continue
        covered_ids = [item.id for item in covered]
        lock_coverage.append((lock, offering, covered_ids))
        if classify_teacher_availability(teacher, covered) == AvailabilityType.unavailable:
            diagnostics.append(Diagnostic("manual_lock_teacher_unavailable", "hard", f"Manual lock for {offering.course_name} conflicts with {teacher.full_name}'s availability.", {"course_offering_id": offering.id}))
        if not shift_allows(section.shift, slot.shift):
            diagnostics.append(Diagnostic("manual_lock_section_shift_conflict", "hard", f"Manual lock for {section.name} uses a {slot.shift.value} slot, outside the section shift {section.shift.value}.", {"course_offering_id": offering.id}))
        if any(slot_id in room.unavailable_slot_ids for slot_id in covered_ids):
            diagnostics.append(Diagnostic("manual_lock_room_unavailable", "hard", f"Manual lock uses room {room.code} during an unavailable room period.", {"room_id": room.id}))
        has_match = any(
            p.start_slot_id == lock.start_time_slot_id and p.room_id == lock.room_id
            for session in matching_sessions
            for p in placements.get(session.id, [])
        )
        if not has_match:
            diagnostics.append(Diagnostic("manual_lock_conflict", "hard", "A manual lock is incompatible with availability, room type, capacity, room availability, or shift.", {"course_offering_id": lock.course_offering_id, "room_id": lock.room_id}))
    diagnostics.extend(_manual_lock_double_booking(lock_coverage, data))
    return diagnostics


def _section_load_diagnostics(data: SchedulerInput) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    section_hours = Counter()
    for offering in data.offerings:
        section_hours[offering.section_id] += offering.weekly_hours
    for section_id, hours in section_hours.items():
        section = data.sections.get(section_id)
        if not section:
            continue
        available_slots = sum(1 for slot in data.time_slots.values() if shift_allows(section.shift, slot.shift))
        if hours > available_slots:
            diagnostics.append(Diagnostic("section_weekly_hours_exceed_shift_capacity", "hard", f"Section {section.name} needs {hours} weekly hours, but only {available_slots} active slots match its shift.", {"section_id": section.id}))
    return diagnostics


def _teacher_load_diagnostics(data: SchedulerInput) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    load = Counter()
    for offering in data.offerings:
        load[offering.teacher_id] += offering.weekly_hours
    for teacher_id, hours in load.items():
        teacher = data.teachers.get(teacher_id)
        if teacher and hours > teacher.max_weekly_hours:
            diagnostics.append(Diagnostic("max_weekly_hours_exceeded", "hard", f"{teacher.full_name} has {hours} assigned hours, above max {teacher.max_weekly_hours}.", {"teacher_id": teacher_id}))
    return diagnostics


def _has_teacher_compatible_slot(data: SchedulerInput, offering: CourseOfferingDTO, teacher: TeacherDTO, section) -> bool:
    for slot in data.time_slots.values():
        covered = consecutive_coverage(slot, offering.session_duration_blocks, data.time_slots)
        if not covered or not shift_allows(section.shift, slot.shift):
            continue
        if classify_teacher_availability(teacher, covered) != AvailabilityType.unavailable:
            return True
    return False


def _manual_lock_double_booking(lock_coverage: list[tuple[ManualLockDTO, CourseOfferingDTO, list[str]]], data: SchedulerInput) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    busy: dict[tuple[str, str, str], ManualLockDTO] = {}
    for lock, offering, slot_ids in lock_coverage:
        keys = [("teacher", offering.teacher_id), ("section", offering.section_id), ("room", lock.room_id)]
        for kind, entity_id in keys:
            for slot_id in slot_ids:
                key = (kind, entity_id, slot_id)
                if key in busy:
                    diagnostics.append(Diagnostic("manual_lock_double_booking", "hard", f"Manual locks double-book the same {kind} in slot {slot_id}.", {"entity_type": kind, "entity_id": entity_id}))
                busy[key] = lock
    return diagnostics


def _dedupe(diagnostics: list[Diagnostic]) -> list[Diagnostic]:
    seen = set()
    result = []
    for item in diagnostics:
        key = (item.conflict_type, item.message, repr(item.entity))
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


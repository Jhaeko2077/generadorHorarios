from __future__ import annotations

from datetime import time

import pytest

from app.core.enums import AvailabilityType, DayOfWeek, EmploymentType, RoomType, Shift
from app.services.scheduler.models import (
    AvailabilityBlockDTO,
    CourseOfferingDTO,
    RoomDTO,
    SchedulerInput,
    SectionDTO,
    TeacherDTO,
    TimeSlotDTO,
)


@pytest.fixture
def simple_scheduler_input() -> SchedulerInput:
    slots = {}
    for block, hour in enumerate([7, 8, 9, 10], start=1):
        slot = TimeSlotDTO(
            id=f"m{block}",
            day_of_week=DayOfWeek.monday,
            block_index=block,
            start_time=time(hour),
            end_time=time(hour + 1),
            shift=Shift.morning,
        )
        slots[slot.id] = slot
    teacher = TeacherDTO(
        id="t1",
        user_id="u1",
        full_name="Teacher One",
        employment_type=EmploymentType.full_time,
        max_weekly_hours=8,
        min_weekly_hours=0,
        max_daily_hours=4,
        max_consecutive_blocks=4,
        preferred_shift=Shift.morning,
        availability_blocks=[
            AvailabilityBlockDTO(DayOfWeek.monday, time(7), time(11), AvailabilityType.preferred)
        ],
    )
    section = SectionDTO("s1", "Section A", 24, Shift.morning, "c1", 1)
    offering = CourseOfferingDTO(
        id="o1",
        course_id="c1",
        course_name="Applied Math",
        section_id="s1",
        section_name="Section A",
        teacher_id="t1",
        weekly_hours=4,
        session_duration_blocks=2,
        sessions_per_week=2,
        requires_lab=False,
        room_type_required=RoomType.classroom,
        priority=1,
    )
    room = RoomDTO("r1", "A101", RoomType.classroom, 40, set())
    return SchedulerInput(
        academic_term_id="term",
        teachers={teacher.id: teacher},
        sections={section.id: section},
        offerings=[offering],
        rooms={room.id: room},
        time_slots=slots,
        manual_locks=[],
        previous_assignments=[],
    )

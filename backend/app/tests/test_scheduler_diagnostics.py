from __future__ import annotations

from datetime import time

from app.core.enums import AvailabilityType, DayOfWeek
from app.services.scheduler.domain import validate_obvious_issues
from app.services.scheduler.models import AvailabilityBlockDTO, TeacherDTO


def test_section_load_exceeding_shift_capacity_is_diagnostic(simple_scheduler_input) -> None:
    simple_scheduler_input.time_slots = {
        key: slot for key, slot in simple_scheduler_input.time_slots.items() if key in {"m1", "m2"}
    }
    diagnostics = validate_obvious_issues(simple_scheduler_input)
    assert any(item.conflict_type == "section_weekly_hours_exceed_shift_capacity" for item in diagnostics)


def test_teacher_insufficient_availability_is_specific_diagnostic(simple_scheduler_input) -> None:
    teacher = simple_scheduler_input.teachers["t1"]
    simple_scheduler_input.teachers["t1"] = TeacherDTO(
        id=teacher.id,
        user_id=teacher.user_id,
        full_name=teacher.full_name,
        employment_type=teacher.employment_type,
        max_weekly_hours=teacher.max_weekly_hours,
        min_weekly_hours=teacher.min_weekly_hours,
        max_daily_hours=teacher.max_daily_hours,
        max_consecutive_blocks=teacher.max_consecutive_blocks,
        preferred_shift=teacher.preferred_shift,
        availability_blocks=[
            AvailabilityBlockDTO(DayOfWeek.monday, time(7), time(9), AvailabilityType.available)
        ],
    )

    diagnostics = validate_obvious_issues(simple_scheduler_input)

    assert any(item.conflict_type == "teacher_insufficient_availability" for item in diagnostics)

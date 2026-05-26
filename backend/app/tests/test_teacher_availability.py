from datetime import time

from app.core.enums import AvailabilityType, DayOfWeek, EmploymentType, Shift
from app.services.scheduler.domain import classify_teacher_availability
from app.services.scheduler.models import AvailabilityBlockDTO, TeacherDTO, TimeSlotDTO


def test_unavailable_overrides_available() -> None:
    teacher = TeacherDTO(
        id="t",
        user_id="u",
        full_name="Teacher",
        employment_type=EmploymentType.part_time,
        max_weekly_hours=8,
        min_weekly_hours=0,
        max_daily_hours=4,
        max_consecutive_blocks=2,
        preferred_shift=Shift.any,
        availability_blocks=[
            AvailabilityBlockDTO(DayOfWeek.monday, time(7), time(10), AvailabilityType.available),
            AvailabilityBlockDTO(DayOfWeek.monday, time(8), time(9), AvailabilityType.unavailable),
        ],
    )
    slot = TimeSlotDTO("slot", DayOfWeek.monday, 2, time(8), time(9), Shift.morning)
    assert classify_teacher_availability(teacher, [slot]) == AvailabilityType.unavailable

from __future__ import annotations

from datetime import time

from app.core.enums import (
    AvailabilityType,
    DayOfWeek,
    EmploymentType,
    RoomType,
    ScheduleRunStatus,
    Shift,
)
from app.db.seed import _teachers
from app.services.scheduler.models import (
    AvailabilityBlockDTO,
    CourseOfferingDTO,
    RoomDTO,
    SchedulerInput,
    SectionDTO,
    TeacherDTO,
    TimeSlotDTO,
)
from app.services.scheduler.solver import ScheduleSolver


def test_demo_seed_teacher_accounts_use_documented_credentials() -> None:
    teachers = _teachers()
    emails = {user.full_name: user.email for user, _ in teachers}

    assert emails == {
        "Ana Rojas": "ana.rojas@example.com",
        "Luis Vega": "luis.vega@example.com",
        "Carmen Diaz": "carmen.diaz@example.com",
        "Marco Torres": "marco.torres@example.com",
        "Elena Ramos": "elena.ramos@example.com",
        "Pedro Salas": "pedro.salas@example.com",
    }
    assert all(profile.teacher_code for _, profile in teachers)


def test_sd_c2_evening_demo_bottleneck_is_feasible_with_carmen_monday_availability() -> None:
    result = ScheduleSolver().solve(_sd_c2_evening_input(), max_seconds=10, random_seed=42)

    assert result.status in {ScheduleRunStatus.optimal, ScheduleRunStatus.feasible}
    assert len(result.assignments) == 7


def _sd_c2_evening_input() -> SchedulerInput:
    days = [
        DayOfWeek.monday,
        DayOfWeek.tuesday,
        DayOfWeek.wednesday,
        DayOfWeek.thursday,
        DayOfWeek.friday,
    ]
    slots = {}
    for day in days:
        for block_index, hour in enumerate([18, 19, 20, 21], start=10):
            slot = TimeSlotDTO(
                id=f"{day.value}-{block_index}",
                day_of_week=day,
                block_index=block_index,
                start_time=time(hour),
                end_time=time(hour + 1),
                shift=Shift.evening,
            )
            slots[slot.id] = slot

    teachers = {
        "pedro": _teacher(
            "pedro",
            "Pedro Salas",
            20,
            6,
            3,
            [AvailabilityBlockDTO(day, time(18), time(22), AvailabilityType.preferred) for day in days],
        ),
        "carmen": _teacher(
            "carmen",
            "Carmen Diaz",
            22,
            6,
            3,
            [
                AvailabilityBlockDTO(DayOfWeek.monday, time(18), time(22), AvailabilityType.discouraged),
                AvailabilityBlockDTO(DayOfWeek.tuesday, time(18), time(22), AvailabilityType.discouraged),
                AvailabilityBlockDTO(DayOfWeek.thursday, time(18), time(22), AvailabilityType.discouraged),
            ],
        ),
        "marco": _teacher(
            "marco",
            "Marco Torres",
            28,
            8,
            4,
            [
                AvailabilityBlockDTO(DayOfWeek.tuesday, time(18), time(22), AvailabilityType.discouraged),
                AvailabilityBlockDTO(DayOfWeek.thursday, time(18), time(22), AvailabilityType.discouraged),
            ],
        ),
        "elena": _teacher(
            "elena",
            "Elena Ramos",
            10,
            4,
            2,
            [AvailabilityBlockDTO(DayOfWeek.thursday, time(18), time(22), AvailabilityType.available)],
        ),
    }
    section = SectionDTO("sd-c2-a", "SD-C2-A", 22, Shift.evening, "sd-c2", 2)
    offerings = [
        _offering("prg", "PRG101", "Programming Fundamentals", "pedro", True, RoomType.computer_lab, 4),
        _offering("db", "DB101", "Databases", "carmen", True, RoomType.computer_lab, 4),
        _offering("cad", "CAD101", "Technical Drawing", "marco", True, RoomType.computer_lab, 4),
        _offering("eth", "ETH101", "Professional Ethics", "elena", False, RoomType.classroom, 2),
    ]
    rooms = {
        "labpc1": RoomDTO("labpc1", "LABPC1", RoomType.computer_lab, 30, set()),
        "a101": RoomDTO("a101", "A101", RoomType.classroom, 40, set()),
    }
    return SchedulerInput(
        academic_term_id="2026-I",
        teachers=teachers,
        sections={section.id: section},
        offerings=offerings,
        rooms=rooms,
        time_slots=slots,
        manual_locks=[],
        previous_assignments=[],
    )


def _teacher(
    teacher_id: str,
    full_name: str,
    max_weekly_hours: int,
    max_daily_hours: int,
    max_consecutive_blocks: int,
    availability_blocks: list[AvailabilityBlockDTO],
) -> TeacherDTO:
    return TeacherDTO(
        id=teacher_id,
        user_id=f"user-{teacher_id}",
        full_name=full_name,
        employment_type=EmploymentType.full_time,
        max_weekly_hours=max_weekly_hours,
        min_weekly_hours=0,
        max_daily_hours=max_daily_hours,
        max_consecutive_blocks=max_consecutive_blocks,
        preferred_shift=Shift.evening,
        availability_blocks=availability_blocks,
    )


def _offering(
    offering_id: str,
    course_id: str,
    course_name: str,
    teacher_id: str,
    requires_lab: bool,
    room_type: RoomType,
    weekly_hours: int,
) -> CourseOfferingDTO:
    return CourseOfferingDTO(
        id=offering_id,
        course_id=course_id,
        course_name=course_name,
        section_id="sd-c2-a",
        section_name="SD-C2-A",
        teacher_id=teacher_id,
        weekly_hours=weekly_hours,
        session_duration_blocks=2,
        sessions_per_week=weekly_hours // 2,
        requires_lab=requires_lab,
        room_type_required=room_type,
        priority=1,
    )

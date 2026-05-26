from __future__ import annotations

from dataclasses import dataclass, field
from datetime import time
from typing import Any

from app.core.enums import (
    AvailabilityType,
    DayOfWeek,
    EmploymentType,
    RoomType,
    ScheduleRunStatus,
    Shift,
)


@dataclass(frozen=True)
class AvailabilityBlockDTO:
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    availability_type: AvailabilityType


@dataclass(frozen=True)
class TeacherDTO:
    id: str
    user_id: str
    full_name: str
    employment_type: EmploymentType
    max_weekly_hours: int
    min_weekly_hours: int
    max_daily_hours: int
    max_consecutive_blocks: int
    preferred_shift: Shift
    availability_blocks: list[AvailabilityBlockDTO]


@dataclass(frozen=True)
class SectionDTO:
    id: str
    name: str
    student_count: int
    shift: Shift
    cycle_id: str
    cycle_number: int


@dataclass(frozen=True)
class CourseOfferingDTO:
    id: str
    course_id: str
    course_name: str
    section_id: str
    section_name: str
    teacher_id: str
    weekly_hours: int
    session_duration_blocks: int
    sessions_per_week: int
    requires_lab: bool
    room_type_required: RoomType
    priority: int


@dataclass(frozen=True)
class RoomDTO:
    id: str
    code: str
    room_type: RoomType
    capacity: int
    unavailable_slot_ids: set[str]


@dataclass(frozen=True)
class TimeSlotDTO:
    id: str
    day_of_week: DayOfWeek
    block_index: int
    start_time: time
    end_time: time
    shift: Shift


@dataclass(frozen=True)
class ManualLockDTO:
    course_offering_id: str
    room_id: str
    start_time_slot_id: str
    duration_blocks: int


@dataclass(frozen=True)
class PreviousAssignmentDTO:
    course_offering_id: str
    teacher_id: str
    section_id: str
    room_id: str
    start_time_slot_id: str
    day_of_week: DayOfWeek
    duration_blocks: int


@dataclass
class SessionDTO:
    id: str
    index: int
    offering: CourseOfferingDTO


@dataclass
class PlacementDTO:
    session_id: str
    offering_id: str
    teacher_id: str
    section_id: str
    start_slot_id: str
    room_id: str
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    duration_blocks: int
    covered_slot_ids: list[str]
    availability_type: AvailabilityType
    base_penalties: dict[str, int] = field(default_factory=dict)


@dataclass
class SchedulerInput:
    academic_term_id: str
    teachers: dict[str, TeacherDTO]
    sections: dict[str, SectionDTO]
    offerings: list[CourseOfferingDTO]
    rooms: dict[str, RoomDTO]
    time_slots: dict[str, TimeSlotDTO]
    manual_locks: list[ManualLockDTO]
    previous_assignments: list[PreviousAssignmentDTO]


@dataclass
class Diagnostic:
    conflict_type: str
    severity: str
    message: str
    entity: dict[str, Any] | None = None


@dataclass
class DomainResult:
    sessions: list[SessionDTO]
    placements: dict[str, list[PlacementDTO]]
    diagnostics: list[Diagnostic]


@dataclass
class AssignmentResult:
    course_offering_id: str
    teacher_id: str
    section_id: str
    room_id: str
    start_time_slot_id: str
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    duration_blocks: int
    covered_slot_ids: list[str]
    penalty_score: int
    explanation: str


@dataclass
class SchedulerResult:
    status: ScheduleRunStatus
    objective_value: int | None
    soft_penalty_score: int
    diversity_score: float | None
    assignments: list[AssignmentResult]
    diagnostics: list[Diagnostic]
    metadata: dict[str, Any]

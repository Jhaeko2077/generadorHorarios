from __future__ import annotations

from datetime import date, datetime, time
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.enums import (
    AcademicRole,
    AvailabilityType,
    ConflictSeverity,
    DayOfWeek,
    EmploymentType,
    RoomType,
    ScheduleRunStatus,
    Shift,
    UserRole,
)


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(ORMModel):
    id: str
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TeacherRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8)
    employment_type: EmploymentType
    academic_role: AcademicRole
    max_weekly_hours: int = Field(gt=0, le=40)
    max_daily_hours: int = Field(gt=0, le=12)
    max_consecutive_blocks: int = Field(gt=0, le=8)
    preferred_shift: Shift = Shift.any
    can_teach_theory: bool = True
    can_teach_labs: bool = False
    can_teach_workshops: bool = False


class AdminCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8)


class TeacherProfileBase(BaseModel):
    teacher_code: str | None = None
    employment_type: EmploymentType
    academic_role: AcademicRole
    max_weekly_hours: int = Field(gt=0)
    min_weekly_hours: int = Field(default=0, ge=0)
    max_daily_hours: int = Field(gt=0)
    max_consecutive_blocks: int = Field(gt=0)
    preferred_shift: Shift = Shift.any
    can_teach_theory: bool = True
    can_teach_labs: bool = False
    can_teach_workshops: bool = False
    can_teach_online: bool = False
    is_available_for_substitution: bool = False
    notes: str | None = None


class TeacherProfileUpdate(TeacherProfileBase):
    pass


class TeacherProfileRead(TeacherProfileBase, ORMModel):
    id: str
    user_id: str
    user: UserRead


class AvailabilityCreate(BaseModel):
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    availability_type: AvailabilityType
    max_hours_in_range: int | None = Field(default=None, ge=0)
    reason: str | None = None

    @field_validator("end_time")
    @classmethod
    def validate_range(cls, value: time, info):
        start = info.data.get("start_time")
        if start and value <= start:
            raise ValueError("end_time must be after start_time")
        return value


class AvailabilityRead(AvailabilityCreate, ORMModel):
    id: str
    teacher_id: str


class AcademicTermIn(BaseModel):
    name: str
    code: str
    start_date: date
    end_date: date
    is_active: bool = True
    previous_term_id: str | None = None


class ProgramIn(BaseModel):
    code: str
    name: str
    description: str | None = None
    is_active: bool = True


class CycleIn(BaseModel):
    program_id: str
    name: str
    number: int = Field(gt=0)
    description: str | None = None


class SectionIn(BaseModel):
    academic_term_id: str
    cycle_id: str
    code: str
    name: str
    student_count: int = Field(gt=0)
    shift: Shift
    is_active: bool = True


class CourseIn(BaseModel):
    cycle_id: str
    code: str
    name: str
    weekly_hours: int = Field(gt=0)
    session_duration_blocks: int = Field(gt=0)
    sessions_per_week: int | None = Field(default=None, gt=0)
    requires_lab: bool = False
    room_type_required: RoomType = RoomType.any
    requires_consecutive_blocks: bool = True
    priority: int = 1
    is_active: bool = True


class RoomIn(BaseModel):
    code: str
    name: str
    room_type: RoomType
    capacity: int = Field(gt=0)
    campus: str | None = None
    building: str | None = None
    floor: str | None = None
    is_active: bool = True
    notes: str | None = None


class RoomUnavailabilityIn(BaseModel):
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    reason: str | None = None


class TimeSlotIn(BaseModel):
    day_of_week: DayOfWeek
    block_index: int = Field(gt=0)
    start_time: time
    end_time: time
    shift: Shift
    is_active: bool = True


class CourseOfferingIn(BaseModel):
    academic_term_id: str
    course_id: str
    section_id: str
    teacher_id: str
    weekly_hours: int = Field(gt=0)
    session_duration_blocks: int = Field(gt=0)
    sessions_per_week: int = Field(gt=0)
    requires_lab: bool = False
    room_type_required: RoomType = RoomType.any
    priority: int = 1
    notes: str | None = None
    is_active: bool = True


class ManualLockIn(BaseModel):
    academic_term_id: str
    course_offering_id: str
    room_id: str
    start_time_slot_id: str
    duration_blocks: int = Field(gt=0)
    reason: str | None = None


class ScheduleWeights(BaseModel):
    teacher_discouraged_slot: int = 30
    teacher_non_preferred_slot: int = 8
    teacher_gap: int = 15
    section_gap: int = 20
    late_block: int = 5
    lab_scarcity: int = 25
    teacher_daily_concentration: int = 8
    fairness: int = 10
    diversity_repetition: int = 12
    target_load_balance: int = 5


class ScheduleGenerateRequest(BaseModel):
    academic_term_id: str
    name: str | None = None
    random_seed: int = 42
    max_seconds: int = Field(default=20, ge=1, le=300)
    candidate_count: int = Field(default=1, ge=1, le=10)
    weights: ScheduleWeights = Field(default_factory=ScheduleWeights)
    respect_manual_locks: bool = True
    publish_on_success: bool = False


class ScheduleGenerateResponse(BaseModel):
    schedule_run_id: str
    status: ScheduleRunStatus
    objective_value: int | None
    hard_conflicts_count: int
    soft_penalty_score: int
    diversity_score: float | None
    summary: dict[str, Any]
    diagnostics: list[dict[str, Any]]


class RecommendationRequest(BaseModel):
    academic_term_id: str
    schedule_run_id: str | None = None
    limit: int = Field(default=5, ge=1, le=20)


class RecommendationItem(BaseModel):
    time_slot_id: str
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    room_id: str
    room_code: str
    score: int
    explanation: str
    penalties: dict[str, int]


class ReadModel(ORMModel):
    id: str


class ScheduleRunRead(ORMModel):
    id: str
    academic_term_id: str
    name: str
    status: ScheduleRunStatus
    objective_value: int | None
    hard_conflicts_count: int
    soft_penalty_score: int
    diversity_score: float | None
    candidates_generated: int
    selected_candidate_index: int | None
    metadata_json: dict | None
    created_at: datetime
    finished_at: datetime | None


class ScheduleConflictRead(ORMModel):
    id: str
    conflict_type: str
    severity: ConflictSeverity
    message: str
    entity_json: dict | None
    created_at: datetime

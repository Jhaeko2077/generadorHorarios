from __future__ import annotations

from datetime import datetime, time, timezone
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import ConflictSeverity, DayOfWeek, ScheduleRunStatus
from app.db.base import Base, UUIDMixin

if TYPE_CHECKING:
    from app.models.academic import CourseOffering, Section, TimeSlot
    from app.models.room import Room
    from app.models.teacher import TeacherProfile


class ScheduleRun(UUIDMixin, Base):
    __tablename__ = "schedule_runs"

    academic_term_id: Mapped[str] = mapped_column(ForeignKey("academic_terms.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    status: Mapped[ScheduleRunStatus] = mapped_column(
        Enum(ScheduleRunStatus, native_enum=False), default=ScheduleRunStatus.pending
    )
    solver_name: Mapped[str] = mapped_column(String(80), default="OR-Tools CP-SAT", nullable=False)
    random_seed: Mapped[int] = mapped_column(Integer, default=42, nullable=False)
    max_seconds: Mapped[int] = mapped_column(Integer, default=20, nullable=False)
    objective_value: Mapped[int | None] = mapped_column(Integer)
    hard_conflicts_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    soft_penalty_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    diversity_score: Mapped[float | None] = mapped_column(Float)
    candidates_generated: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    selected_candidate_index: Mapped[int | None] = mapped_column(Integer)
    weights_json: Mapped[dict | None] = mapped_column(JSON)
    metadata_json: Mapped[dict | None] = mapped_column(JSON)
    created_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    assignments: Mapped[list[ScheduleAssignment]] = relationship(
        "ScheduleAssignment", back_populates="schedule_run", cascade="all, delete-orphan"
    )
    conflicts: Mapped[list[ScheduleConflict]] = relationship(
        "ScheduleConflict", back_populates="schedule_run", cascade="all, delete-orphan"
    )


class ScheduleAssignment(UUIDMixin, Base):
    __tablename__ = "schedule_assignments"

    schedule_run_id: Mapped[str] = mapped_column(ForeignKey("schedule_runs.id", ondelete="CASCADE"))
    course_offering_id: Mapped[str] = mapped_column(ForeignKey("course_offerings.id", ondelete="CASCADE"))
    teacher_id: Mapped[str] = mapped_column(ForeignKey("teacher_profiles.id", ondelete="CASCADE"))
    section_id: Mapped[str] = mapped_column(ForeignKey("sections.id", ondelete="CASCADE"))
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"))
    start_time_slot_id: Mapped[str] = mapped_column(ForeignKey("time_slots.id", ondelete="CASCADE"))
    day_of_week: Mapped[DayOfWeek] = mapped_column(Enum(DayOfWeek, native_enum=False))
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration_blocks: Mapped[int] = mapped_column(Integer, nullable=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    penalty_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    schedule_run: Mapped[ScheduleRun] = relationship("ScheduleRun", back_populates="assignments")
    offering: Mapped[CourseOffering] = relationship("CourseOffering")
    teacher: Mapped[TeacherProfile] = relationship("TeacherProfile")
    section: Mapped[Section] = relationship("Section")
    room: Mapped[Room] = relationship("Room")
    start_time_slot: Mapped[TimeSlot] = relationship("TimeSlot")
    slots: Mapped[list[ScheduleAssignmentSlot]] = relationship(
        "ScheduleAssignmentSlot", back_populates="assignment", cascade="all, delete-orphan"
    )


class ScheduleAssignmentSlot(UUIDMixin, Base):
    __tablename__ = "schedule_assignment_slots"

    schedule_assignment_id: Mapped[str] = mapped_column(
        ForeignKey("schedule_assignments.id", ondelete="CASCADE")
    )
    time_slot_id: Mapped[str] = mapped_column(ForeignKey("time_slots.id", ondelete="CASCADE"))

    assignment: Mapped[ScheduleAssignment] = relationship("ScheduleAssignment", back_populates="slots")
    time_slot: Mapped[TimeSlot] = relationship("TimeSlot")


class ScheduleConflict(UUIDMixin, Base):
    __tablename__ = "schedule_conflicts"

    schedule_run_id: Mapped[str] = mapped_column(ForeignKey("schedule_runs.id", ondelete="CASCADE"))
    conflict_type: Mapped[str] = mapped_column(String(80), nullable=False)
    severity: Mapped[ConflictSeverity] = mapped_column(Enum(ConflictSeverity, native_enum=False))
    message: Mapped[str] = mapped_column(Text, nullable=False)
    entity_json: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    schedule_run: Mapped[ScheduleRun] = relationship("ScheduleRun", back_populates="conflicts")


class ManualLock(UUIDMixin, Base):
    __tablename__ = "manual_locks"

    academic_term_id: Mapped[str] = mapped_column(ForeignKey("academic_terms.id", ondelete="CASCADE"))
    course_offering_id: Mapped[str] = mapped_column(ForeignKey("course_offerings.id", ondelete="CASCADE"))
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"))
    start_time_slot_id: Mapped[str] = mapped_column(ForeignKey("time_slots.id", ondelete="CASCADE"))
    duration_blocks: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    created_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class PublishedSchedule(UUIDMixin, Base):
    __tablename__ = "published_schedules"

    academic_term_id: Mapped[str] = mapped_column(ForeignKey("academic_terms.id", ondelete="CASCADE"))
    schedule_run_id: Mapped[str] = mapped_column(ForeignKey("schedule_runs.id", ondelete="CASCADE"))
    published_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

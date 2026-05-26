from __future__ import annotations

from datetime import date, time
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import DayOfWeek, RoomType, Shift
from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.teacher import TeacherProfile


class AcademicTerm(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "academic_terms"

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    previous_term_id: Mapped[str | None] = mapped_column(ForeignKey("academic_terms.id"))


class Program(UUIDMixin, Base):
    __tablename__ = "programs"

    code: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    cycles: Mapped[list[Cycle]] = relationship("Cycle", back_populates="program")


class Cycle(UUIDMixin, Base):
    __tablename__ = "cycles"
    __table_args__ = (UniqueConstraint("program_id", "number", name="uq_cycles_program_number"),)

    program_id: Mapped[str] = mapped_column(ForeignKey("programs.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    program: Mapped[Program] = relationship("Program", back_populates="cycles")


class Section(UUIDMixin, Base):
    __tablename__ = "sections"
    __table_args__ = (UniqueConstraint("academic_term_id", "cycle_id", "code", name="uq_section_term_cycle_code"),)

    academic_term_id: Mapped[str] = mapped_column(ForeignKey("academic_terms.id", ondelete="CASCADE"))
    cycle_id: Mapped[str] = mapped_column(ForeignKey("cycles.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(40), nullable=False)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    student_count: Mapped[int] = mapped_column(Integer, nullable=False)
    shift: Mapped[Shift] = mapped_column(Enum(Shift, native_enum=False), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    cycle: Mapped[Cycle] = relationship("Cycle")
    academic_term: Mapped[AcademicTerm] = relationship("AcademicTerm")


class Course(UUIDMixin, Base):
    __tablename__ = "courses"

    cycle_id: Mapped[str] = mapped_column(ForeignKey("cycles.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    weekly_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    session_duration_blocks: Mapped[int] = mapped_column(Integer, nullable=False)
    sessions_per_week: Mapped[int | None] = mapped_column(Integer)
    requires_lab: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    room_type_required: Mapped[RoomType] = mapped_column(Enum(RoomType, native_enum=False), default=RoomType.any)
    requires_consecutive_blocks: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    cycle: Mapped[Cycle] = relationship("Cycle")


class TimeSlot(UUIDMixin, Base):
    __tablename__ = "time_slots"
    __table_args__ = (
        UniqueConstraint("day_of_week", "block_index", name="uq_time_slot_day_block"),
        CheckConstraint("start_time < end_time", name="ck_time_slot_time_range"),
    )

    day_of_week: Mapped[DayOfWeek] = mapped_column(Enum(DayOfWeek, native_enum=False), nullable=False)
    block_index: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    shift: Mapped[Shift] = mapped_column(Enum(Shift, native_enum=False), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class CourseOffering(UUIDMixin, Base):
    __tablename__ = "course_offerings"

    academic_term_id: Mapped[str] = mapped_column(ForeignKey("academic_terms.id", ondelete="CASCADE"))
    course_id: Mapped[str] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    section_id: Mapped[str] = mapped_column(ForeignKey("sections.id", ondelete="CASCADE"))
    teacher_id: Mapped[str] = mapped_column(ForeignKey("teacher_profiles.id", ondelete="CASCADE"))
    weekly_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    session_duration_blocks: Mapped[int] = mapped_column(Integer, nullable=False)
    sessions_per_week: Mapped[int] = mapped_column(Integer, nullable=False)
    requires_lab: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    room_type_required: Mapped[RoomType] = mapped_column(Enum(RoomType, native_enum=False), default=RoomType.any)
    priority: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    academic_term: Mapped[AcademicTerm] = relationship("AcademicTerm")
    course: Mapped[Course] = relationship("Course")
    section: Mapped[Section] = relationship("Section")
    teacher: Mapped[TeacherProfile] = relationship("TeacherProfile")

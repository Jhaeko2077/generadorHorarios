from __future__ import annotations

from datetime import time
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import AcademicRole, AvailabilityType, DayOfWeek, EmploymentType, Shift
from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User


class TeacherProfile(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "teacher_profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    teacher_code: Mapped[str | None] = mapped_column(String(40), unique=True)
    employment_type: Mapped[EmploymentType] = mapped_column(Enum(EmploymentType, native_enum=False))
    academic_role: Mapped[AcademicRole] = mapped_column(Enum(AcademicRole, native_enum=False))
    max_weekly_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    min_weekly_hours: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_daily_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    max_consecutive_blocks: Mapped[int] = mapped_column(Integer, nullable=False)
    preferred_shift: Mapped[Shift] = mapped_column(Enum(Shift, native_enum=False), default=Shift.any)
    can_teach_theory: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_teach_labs: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_teach_workshops: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_teach_online: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_available_for_substitution: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User] = relationship("User", back_populates="teacher_profile")
    availability: Mapped[list[TeacherAvailability]] = relationship(
        "TeacherAvailability", back_populates="teacher", cascade="all, delete-orphan"
    )


class TeacherAvailability(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "teacher_availability"
    __table_args__ = (
        CheckConstraint("start_time < end_time", name="ck_teacher_availability_time_range"),
    )

    teacher_id: Mapped[str] = mapped_column(ForeignKey("teacher_profiles.id", ondelete="CASCADE"))
    day_of_week: Mapped[DayOfWeek] = mapped_column(Enum(DayOfWeek, native_enum=False))
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    availability_type: Mapped[AvailabilityType] = mapped_column(Enum(AvailabilityType, native_enum=False))
    max_hours_in_range: Mapped[int | None] = mapped_column(Integer)
    reason: Mapped[str | None] = mapped_column(Text)

    teacher: Mapped[TeacherProfile] = relationship("TeacherProfile", back_populates="availability")

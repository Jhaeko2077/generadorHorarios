from __future__ import annotations

from datetime import time

from sqlalchemy import Boolean, CheckConstraint, Enum, ForeignKey, Integer, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import DayOfWeek, RoomType
from app.db.base import Base, TimestampMixin, UUIDMixin


class Room(UUIDMixin, Base):
    __tablename__ = "rooms"

    code: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    room_type: Mapped[RoomType] = mapped_column(Enum(RoomType, native_enum=False), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    campus: Mapped[str | None] = mapped_column(String(120))
    building: Mapped[str | None] = mapped_column(String(120))
    floor: Mapped[str | None] = mapped_column(String(40))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    unavailability: Mapped[list[RoomUnavailability]] = relationship(
        "RoomUnavailability", back_populates="room", cascade="all, delete-orphan"
    )


class RoomUnavailability(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "room_unavailability"
    __table_args__ = (CheckConstraint("start_time < end_time", name="ck_room_unavailability_time_range"),)

    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"))
    day_of_week: Mapped[DayOfWeek] = mapped_column(Enum(DayOfWeek, native_enum=False))
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)

    room: Mapped[Room] = relationship("Room", back_populates="unavailability")

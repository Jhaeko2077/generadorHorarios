from __future__ import annotations

from collections import defaultdict

from app.core.enums import DayOfWeek, RoomType, Shift
from app.services.scheduler.models import TimeSlotDTO

DAY_ORDER = [
    DayOfWeek.monday,
    DayOfWeek.tuesday,
    DayOfWeek.wednesday,
    DayOfWeek.thursday,
    DayOfWeek.friday,
    DayOfWeek.saturday,
    DayOfWeek.sunday,
]


def slots_by_day(slots: dict[str, TimeSlotDTO]) -> dict[DayOfWeek, list[TimeSlotDTO]]:
    grouped: dict[DayOfWeek, list[TimeSlotDTO]] = defaultdict(list)
    for slot in slots.values():
        grouped[slot.day_of_week].append(slot)
    return {day: sorted(items, key=lambda s: s.block_index) for day, items in grouped.items()}


def consecutive_coverage(
    start_slot: TimeSlotDTO, duration_blocks: int, slots: dict[str, TimeSlotDTO]
) -> list[TimeSlotDTO] | None:
    day_slots = slots_by_day(slots).get(start_slot.day_of_week, [])
    index = next((i for i, slot in enumerate(day_slots) if slot.id == start_slot.id), -1)
    if index < 0:
        return None
    covered = day_slots[index : index + duration_blocks]
    if len(covered) != duration_blocks:
        return None
    expected = start_slot.block_index
    for slot in covered:
        if slot.block_index != expected:
            return None
        expected += 1
    return covered


def room_compatible(required: RoomType, requires_lab: bool, room_type: RoomType) -> bool:
    if required == RoomType.any:
        return True
    if required == RoomType.classroom:
        return room_type == RoomType.classroom
    if required == RoomType.lab:
        return room_type == RoomType.lab
    if required == RoomType.workshop:
        return room_type == RoomType.workshop
    if required == RoomType.computer_lab:
        return room_type == RoomType.computer_lab
    if requires_lab:
        return room_type in {RoomType.lab, RoomType.workshop, RoomType.computer_lab}
    return True


def shift_allows(section_shift: Shift, slot_shift: Shift) -> bool:
    return section_shift in {Shift.mixed, Shift.any} or section_shift == slot_shift

from __future__ import annotations

from collections import defaultdict

from ortools.sat.python import cp_model

from app.services.scheduler.models import DomainResult, SchedulerInput, TimeSlotDTO
from app.services.scheduler.utils import slots_by_day

VarMap = dict[tuple[str, int], cp_model.IntVar]


def add_session_assignment_constraints(
    model: cp_model.CpModel, domain: DomainResult, variables: VarMap
) -> None:
    for session in domain.sessions:
        model.AddExactlyOne(
            variables[(session.id, idx)] for idx, _ in enumerate(domain.placements.get(session.id, []))
        )


def add_no_overlap_constraints(
    model: cp_model.CpModel, domain: DomainResult, variables: VarMap, entity: str
) -> None:
    grouped: dict[tuple[str, str], list[cp_model.IntVar]] = defaultdict(list)
    for session in domain.sessions:
        for idx, placement in enumerate(domain.placements.get(session.id, [])):
            entity_id = getattr(placement, f"{entity}_id")
            for slot_id in placement.covered_slot_ids:
                grouped[(entity_id, slot_id)].append(variables[(session.id, idx)])
    for items in grouped.values():
        model.Add(sum(items) <= 1)


def add_teacher_load_constraints(
    model: cp_model.CpModel, data: SchedulerInput, domain: DomainResult, variables: VarMap
) -> None:
    by_teacher: dict[str, list[tuple[int, cp_model.IntVar]]] = defaultdict(list)
    by_teacher_day: dict[tuple[str, str], list[tuple[int, cp_model.IntVar]]] = defaultdict(list)
    for session in domain.sessions:
        for idx, placement in enumerate(domain.placements.get(session.id, [])):
            var = variables[(session.id, idx)]
            by_teacher[placement.teacher_id].append((placement.duration_blocks, var))
            by_teacher_day[(placement.teacher_id, placement.day_of_week.value)].append((placement.duration_blocks, var))
    for teacher_id, items in by_teacher.items():
        teacher = data.teachers[teacher_id]
        model.Add(sum(duration * var for duration, var in items) <= teacher.max_weekly_hours)
    for (teacher_id, _day), items in by_teacher_day.items():
        teacher = data.teachers[teacher_id]
        model.Add(sum(duration * var for duration, var in items) <= teacher.max_daily_hours)


def build_busy_variables(
    model: cp_model.CpModel,
    data: SchedulerInput,
    domain: DomainResult,
    variables: VarMap,
    entity: str,
) -> dict[tuple[str, str], cp_model.IntVar]:
    covering: dict[tuple[str, str], list[cp_model.IntVar]] = defaultdict(list)
    ids = data.teachers.keys() if entity == "teacher" else data.sections.keys()
    for entity_id in ids:
        for slot_id in data.time_slots:
            covering[(entity_id, slot_id)] = []
    for session in domain.sessions:
        for idx, placement in enumerate(domain.placements.get(session.id, [])):
            entity_id = getattr(placement, f"{entity}_id")
            for slot_id in placement.covered_slot_ids:
                covering[(entity_id, slot_id)].append(variables[(session.id, idx)])
    busy: dict[tuple[str, str], cp_model.IntVar] = {}
    for key, vars_for_slot in covering.items():
        busy_var = model.NewBoolVar(f"{entity}_busy_{key[0]}_{key[1]}")
        if vars_for_slot:
            model.Add(busy_var == sum(vars_for_slot))
        else:
            model.Add(busy_var == 0)
        busy[key] = busy_var
    return busy


def add_teacher_consecutive_constraints(
    model: cp_model.CpModel,
    data: SchedulerInput,
    teacher_busy: dict[tuple[str, str], cp_model.IntVar],
) -> None:
    grouped_slots = slots_by_day(data.time_slots)
    for teacher in data.teachers.values():
        window_size = teacher.max_consecutive_blocks + 1
        for slots in grouped_slots.values():
            for idx in range(0, max(0, len(slots) - window_size + 1)):
                window = slots[idx : idx + window_size]
                model.Add(sum(teacher_busy[(teacher.id, slot.id)] for slot in window) <= teacher.max_consecutive_blocks)


def add_manual_lock_constraints(
    model: cp_model.CpModel, data: SchedulerInput, domain: DomainResult, variables: VarMap
) -> None:
    for lock in data.manual_locks:
        matching: list[cp_model.IntVar] = []
        for session in domain.sessions:
            if session.offering.id != lock.course_offering_id:
                continue
            for idx, placement in enumerate(domain.placements.get(session.id, [])):
                if placement.start_slot_id == lock.start_time_slot_id and placement.room_id == lock.room_id:
                    matching.append(variables[(session.id, idx)])
        if matching:
            model.Add(sum(matching) == 1)


def gap_penalty_terms(
    model: cp_model.CpModel,
    data: SchedulerInput,
    busy: dict[tuple[str, str], cp_model.IntVar],
    entity_ids: list[str],
    slots: dict[str, TimeSlotDTO],
    weight: int,
    label: str,
) -> list[cp_model.IntVar]:
    terms: list[cp_model.IntVar] = []
    for entity_id in entity_ids:
        for day_slots in slots_by_day(slots).values():
            for idx in range(len(day_slots) - 2):
                left = busy[(entity_id, day_slots[idx].id)]
                middle = busy[(entity_id, day_slots[idx + 1].id)]
                right = busy[(entity_id, day_slots[idx + 2].id)]
                gap = model.NewBoolVar(f"{label}_gap_{entity_id}_{day_slots[idx + 1].id}")
                model.AddBoolOr([left.Not(), right.Not(), middle, gap])
                terms.append(gap * weight)
    return terms

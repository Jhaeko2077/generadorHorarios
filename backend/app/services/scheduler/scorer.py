from __future__ import annotations

from collections import Counter, defaultdict

from app.services.scheduler.models import AssignmentResult, PreviousAssignmentDTO, SchedulerInput

DEFAULT_WEIGHTS = {
    "teacher_discouraged_slot": 30,
    "teacher_non_preferred_slot": 8,
    "teacher_gap": 15,
    "section_gap": 20,
    "late_block": 5,
    "lab_scarcity": 25,
    "teacher_daily_concentration": 8,
    "fairness": 10,
    "diversity_repetition": 12,
    "target_load_balance": 5,
}


def normalize_weights(overrides: dict | None) -> dict[str, int]:
    weights = DEFAULT_WEIGHTS.copy()
    if overrides:
        weights.update({key: int(value) for key, value in overrides.items() if key in weights})
    return weights


def assignment_penalty_breakdown(assignment: AssignmentResult) -> dict[str, int]:
    return {"stored_penalty": assignment.penalty_score}


def compute_diversity_score(assignments: list[AssignmentResult], previous: list[PreviousAssignmentDTO]) -> float | None:
    if not previous:
        return None
    previous_by_offering = defaultdict(list)
    for item in previous:
        previous_by_offering[item.course_offering_id].append(item)
    comparable = 0
    changed = 0
    for assignment in assignments:
        matches = previous_by_offering.get(assignment.course_offering_id, [])
        if not matches:
            continue
        comparable += 1
        if not any(
            match.start_time_slot_id == assignment.start_time_slot_id and match.room_id == assignment.room_id
            for match in matches
        ):
            changed += 1
    return changed / comparable if comparable else None


def post_solve_metrics(data: SchedulerInput, assignments: list[AssignmentResult]) -> dict:
    teacher_hours = Counter()
    teacher_day_hours = Counter()
    section_penalties = Counter()
    for assignment in assignments:
        teacher_hours[assignment.teacher_id] += assignment.duration_blocks
        teacher_day_hours[(assignment.teacher_id, assignment.day_of_week.value)] += assignment.duration_blocks
        section_penalties[assignment.section_id] += assignment.penalty_score
    return {
        "assignment_count": len(assignments),
        "teacher_hours": dict(teacher_hours),
        "teacher_day_hours": {f"{teacher}:{day}": hours for (teacher, day), hours in teacher_day_hours.items()},
        "max_section_penalty": max(section_penalties.values()) if section_penalties else 0,
        "section_penalties": dict(section_penalties),
        "has_previous_term": bool(data.previous_assignments),
    }

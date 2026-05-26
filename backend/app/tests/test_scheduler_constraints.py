from collections import defaultdict

from app.core.enums import ScheduleRunStatus
from app.services.scheduler.solver import ScheduleSolver


def test_no_teacher_section_or_room_conflicts(simple_scheduler_input) -> None:
    result = ScheduleSolver().solve(simple_scheduler_input, max_seconds=5, random_seed=42)
    assert result.status in {ScheduleRunStatus.optimal, ScheduleRunStatus.feasible}
    seen = defaultdict(set)
    for assignment in result.assignments:
        for slot_id in assignment.covered_slot_ids:
            assert slot_id not in seen[("teacher", assignment.teacher_id)]
            assert slot_id not in seen[("section", assignment.section_id)]
            assert slot_id not in seen[("room", assignment.room_id)]
            seen[("teacher", assignment.teacher_id)].add(slot_id)
            seen[("section", assignment.section_id)].add(slot_id)
            seen[("room", assignment.room_id)].add(slot_id)


def test_assignments_respect_teacher_unavailable(simple_scheduler_input) -> None:
    result = ScheduleSolver().solve(simple_scheduler_input, max_seconds=5, random_seed=42)
    assigned_slots = {slot for assignment in result.assignments for slot in assignment.covered_slot_ids}
    assert assigned_slots == {"m1", "m2", "m3", "m4"}

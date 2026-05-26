from app.core.enums import ScheduleRunStatus
from app.services.scheduler.solver import ScheduleSolver


def test_scheduler_generates_feasible_assignments(simple_scheduler_input) -> None:
    result = ScheduleSolver().solve(simple_scheduler_input, max_seconds=5, random_seed=42)
    assert result.status in {ScheduleRunStatus.optimal, ScheduleRunStatus.feasible}
    assert len(result.assignments) == 2

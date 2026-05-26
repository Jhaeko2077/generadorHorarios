from app.core.enums import ScheduleRunStatus
from app.services.scheduler.solver import ScheduleSolver


def test_impossible_case_returns_diagnostics(simple_scheduler_input) -> None:
    teacher = simple_scheduler_input.teachers["t1"]
    simple_scheduler_input.teachers["t1"] = teacher.__class__(
        **{**teacher.__dict__, "max_weekly_hours": 2}
    )
    result = ScheduleSolver().solve(simple_scheduler_input, max_seconds=5)
    assert result.status == ScheduleRunStatus.infeasible
    assert result.diagnostics

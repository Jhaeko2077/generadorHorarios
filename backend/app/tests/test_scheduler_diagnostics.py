from app.services.scheduler.domain import validate_obvious_issues


def test_section_load_exceeding_shift_capacity_is_diagnostic(simple_scheduler_input) -> None:
    simple_scheduler_input.time_slots = {
        key: slot for key, slot in simple_scheduler_input.time_slots.items() if key in {"m1", "m2"}
    }
    diagnostics = validate_obvious_issues(simple_scheduler_input)
    assert any(item.conflict_type == "section_weekly_hours_exceed_shift_capacity" for item in diagnostics)

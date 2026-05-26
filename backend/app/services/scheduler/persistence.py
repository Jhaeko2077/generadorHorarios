from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.enums import ConflictSeverity, ScheduleRunStatus
from app.models.schedule import (
    PublishedSchedule,
    ScheduleAssignment,
    ScheduleAssignmentSlot,
    ScheduleConflict,
    ScheduleRun,
)
from app.services.scheduler.models import SchedulerResult


def create_schedule_run(
    db: Session,
    *,
    academic_term_id: str,
    name: str,
    user_id: str | None,
    random_seed: int,
    max_seconds: int,
    candidate_count: int,
    weights: dict,
) -> ScheduleRun:
    run = ScheduleRun(
        academic_term_id=academic_term_id,
        name=name,
        status=ScheduleRunStatus.running,
        random_seed=random_seed,
        max_seconds=max_seconds,
        candidates_generated=candidate_count,
        weights_json=weights,
        created_by_user_id=user_id,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def save_result(db: Session, run: ScheduleRun, result: SchedulerResult) -> ScheduleRun:
    run.status = result.status
    run.objective_value = result.objective_value
    run.soft_penalty_score = result.soft_penalty_score
    run.diversity_score = result.diversity_score
    run.hard_conflicts_count = len([d for d in result.diagnostics if d.severity == "hard"])
    run.metadata_json = result.metadata
    run.selected_candidate_index = result.metadata.get("candidate_index")
    run.finished_at = datetime.now(timezone.utc)
    for assignment in result.assignments:
        row = ScheduleAssignment(
            schedule_run_id=run.id,
            course_offering_id=assignment.course_offering_id,
            teacher_id=assignment.teacher_id,
            section_id=assignment.section_id,
            room_id=assignment.room_id,
            start_time_slot_id=assignment.start_time_slot_id,
            day_of_week=assignment.day_of_week,
            start_time=assignment.start_time,
            end_time=assignment.end_time,
            duration_blocks=assignment.duration_blocks,
            penalty_score=assignment.penalty_score,
            explanation=assignment.explanation,
        )
        db.add(row)
        db.flush()
        for slot_id in assignment.covered_slot_ids:
            db.add(ScheduleAssignmentSlot(schedule_assignment_id=row.id, time_slot_id=slot_id))
    for diagnostic in result.diagnostics:
        db.add(
            ScheduleConflict(
                schedule_run_id=run.id,
                conflict_type=diagnostic.conflict_type,
                severity=ConflictSeverity(diagnostic.severity),
                message=diagnostic.message,
                entity_json=diagnostic.entity,
            )
        )
    db.commit()
    db.refresh(run)
    return run


def publish_schedule(db: Session, run: ScheduleRun, user_id: str | None) -> PublishedSchedule:
    db.query(PublishedSchedule).filter(
        PublishedSchedule.academic_term_id == run.academic_term_id,
        PublishedSchedule.is_active.is_(True),
    ).update({"is_active": False})
    published = PublishedSchedule(
        academic_term_id=run.academic_term_id,
        schedule_run_id=run.id,
        published_by_user_id=user_id,
        is_active=True,
    )
    db.add(published)
    db.commit()
    db.refresh(published)
    return published

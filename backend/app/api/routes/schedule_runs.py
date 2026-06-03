from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import current_teacher_profile, require_admin, require_teacher_or_admin
from app.core.enums import ScheduleRunStatus
from app.db.session import get_db
from app.models.schedule import (
    PublishedSchedule,
    ScheduleAssignment,
    ScheduleAssignmentSlot,
    ScheduleConflict,
    ScheduleRun,
)
from app.models.teacher import TeacherProfile
from app.models.user import User
from app.schemas.common import (
    RecommendationItem,
    RecommendationRequest,
    ScheduleGenerateRequest,
    ScheduleGenerateResponse,
    ScheduleRunRead,
)
from app.services.audit_service import write_audit
from app.services.scheduler.data_loader import load_scheduler_input
from app.services.scheduler.persistence import create_schedule_run, publish_schedule, save_result
from app.services.scheduler.recommendations import recommend_placements
from app.services.scheduler.scorer import normalize_weights
from app.services.scheduler.solver import ScheduleSolver

router = APIRouter(tags=["schedule runs"])


@router.post("/schedule-runs/generate", response_model=ScheduleGenerateResponse)
def generate_schedule(
    payload: ScheduleGenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
) -> ScheduleGenerateResponse:
    weights = normalize_weights(payload.weights.model_dump())
    name = payload.name or "Generated schedule"
    run = create_schedule_run(
        db,
        academic_term_id=payload.academic_term_id,
        name=name,
        user_id=user.id,
        random_seed=payload.random_seed,
        max_seconds=payload.max_seconds,
        candidate_count=payload.candidate_count,
        weights=weights,
    )
    try:
        data = load_scheduler_input(db, payload.academic_term_id, payload.respect_manual_locks)
        result = ScheduleSolver().solve(
            data,
            weights=weights,
            random_seed=payload.random_seed,
            max_seconds=payload.max_seconds,
            candidate_count=payload.candidate_count,
        )
    except Exception as exc:
        from app.services.scheduler.models import Diagnostic, SchedulerResult

        result = SchedulerResult(
            status=ScheduleRunStatus.failed,
            objective_value=None,
            soft_penalty_score=0,
            diversity_score=None,
            assignments=[],
            diagnostics=[Diagnostic("solver_exception", "hard", f"Schedule generation failed before completion: {exc}")],
            metadata={"exception": type(exc).__name__},
        )
    save_result(db, run, result)
    if payload.publish_on_success and run.status in {ScheduleRunStatus.optimal, ScheduleRunStatus.feasible}:
        publish_schedule(db, run, user.id)
    write_audit(
        db,
        user_id=user.id,
        action="generate",
        entity_type="schedule_run",
        entity_id=run.id,
        after={"status": run.status.value, "assignments": len(result.assignments)},
    )
    db.commit()
    return ScheduleGenerateResponse(
        schedule_run_id=run.id,
        status=run.status,
        objective_value=run.objective_value,
        hard_conflicts_count=run.hard_conflicts_count,
        soft_penalty_score=run.soft_penalty_score,
        diversity_score=run.diversity_score,
        summary=run.metadata_json or {},
        diagnostics=[d.__dict__ for d in result.diagnostics],
    )


@router.get("/schedule-runs", response_model=list[ScheduleRunRead])
def list_runs(db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return db.scalars(select(ScheduleRun).order_by(ScheduleRun.created_at.desc())).all()


@router.get("/schedule-runs/{run_id}", response_model=ScheduleRunRead)
def get_run(run_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    run = db.get(ScheduleRun, run_id)
    if not run:
        raise HTTPException(404, "Schedule run not found")
    return run


@router.get("/schedule-runs/{run_id}/assignments")
def list_assignments(run_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return [_assignment_dict(item) for item in _assignment_rows(db, run_id)]


@router.get("/schedule-runs/{run_id}/assignments/by-section")
def assignments_by_section(run_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _group_assignments(_assignment_rows(db, run_id), "section")


@router.get("/schedule-runs/{run_id}/assignments/by-teacher")
def assignments_by_teacher(run_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _group_assignments(_assignment_rows(db, run_id), "teacher")


@router.get("/schedule-runs/{run_id}/assignments/by-room")
def assignments_by_room(run_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return _group_assignments(_assignment_rows(db, run_id), "room")


@router.get("/schedule-runs/{run_id}/conflicts")
def list_conflicts(run_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return db.scalars(select(ScheduleConflict).where(ScheduleConflict.schedule_run_id == run_id)).all()


@router.post("/schedule-runs/{run_id}/publish")
def publish_run(run_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    run = db.get(ScheduleRun, run_id)
    if not run:
        raise HTTPException(404, "Schedule run not found")
    if run.status not in {ScheduleRunStatus.optimal, ScheduleRunStatus.feasible}:
        raise HTTPException(409, "Only feasible schedules can be published")
    published = publish_schedule(db, run, user.id)
    write_audit(db, user_id=user.id, action="publish", entity_type="schedule_run", entity_id=run.id)
    db.commit()
    return published


@router.delete("/schedule-runs/{run_id}")
def delete_run(run_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    run = db.get(ScheduleRun, run_id)
    if not run:
        raise HTTPException(404, "Schedule run not found")
    assignment_ids = db.scalars(
        select(ScheduleAssignment.id).where(ScheduleAssignment.schedule_run_id == run_id)
    ).all()
    if assignment_ids:
        db.execute(
            delete(ScheduleAssignmentSlot).where(
                ScheduleAssignmentSlot.schedule_assignment_id.in_(assignment_ids)
            )
        )
    db.execute(delete(PublishedSchedule).where(PublishedSchedule.schedule_run_id == run_id))
    db.execute(delete(ScheduleConflict).where(ScheduleConflict.schedule_run_id == run_id))
    db.execute(delete(ScheduleAssignment).where(ScheduleAssignment.schedule_run_id == run_id))
    db.delete(run)
    write_audit(db, user_id=user.id, action="delete", entity_type="schedule_run", entity_id=run_id)
    db.commit()
    return {"ok": True}


@router.get("/me/schedule")
def my_schedule(
    db: Session = Depends(get_db),
    profile: TeacherProfile = Depends(current_teacher_profile),
    _: User = Depends(require_teacher_or_admin),
):
    published = db.scalar(
        select(PublishedSchedule)
        .where(PublishedSchedule.is_active.is_(True))
        .order_by(PublishedSchedule.published_at.desc())
    )
    if not published:
        return {"schedule_run": None, "groups": [], "assignments": []}
    run = db.get(ScheduleRun, published.schedule_run_id)
    rows = _assignment_rows(db, published.schedule_run_id, teacher_id=profile.id)
    return {
        "schedule_run": run,
        "groups": _group_assignments(rows, "teacher"),
        "assignments": [_assignment_dict(item) for item in rows],
    }


@router.post("/recommendations/course-offering/{course_offering_id}", response_model=list[RecommendationItem])
def recommend(
    course_offering_id: str,
    payload: RecommendationRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher_or_admin),
):
    return recommend_placements(
        db,
        course_offering_id=course_offering_id,
        academic_term_id=payload.academic_term_id,
        schedule_run_id=payload.schedule_run_id,
        limit=payload.limit,
    )


def _assignment_rows(db: Session, run_id: str, teacher_id: str | None = None) -> list[ScheduleAssignment]:
    stmt = (
        select(ScheduleAssignment)
        .where(ScheduleAssignment.schedule_run_id == run_id)
        .options(
            selectinload(ScheduleAssignment.offering).selectinload("*"),
            selectinload(ScheduleAssignment.teacher).selectinload("*"),
            selectinload(ScheduleAssignment.section),
            selectinload(ScheduleAssignment.room),
        )
        .order_by(ScheduleAssignment.day_of_week, ScheduleAssignment.start_time)
    )
    if teacher_id:
        stmt = stmt.where(ScheduleAssignment.teacher_id == teacher_id)
    return db.scalars(stmt).all()


def _assignment_dict(item: ScheduleAssignment) -> dict:
    return {
        "id": item.id,
        "day_of_week": item.day_of_week.value,
        "start_time": item.start_time.isoformat(timespec="minutes"),
        "end_time": item.end_time.isoformat(timespec="minutes"),
        "duration_blocks": item.duration_blocks,
        "course_name": item.offering.course.name,
        "section_id": item.section_id,
        "section_name": item.section.name,
        "teacher_id": item.teacher_id,
        "teacher_name": item.teacher.user.full_name,
        "room_id": item.room_id,
        "room_code": item.room.code,
        "penalty_score": item.penalty_score,
        "explanation": item.explanation,
    }


def _group_assignments(assignments: list[ScheduleAssignment], by: str) -> list[dict]:
    grouped: dict[str, dict] = {}
    for item in assignments:
        if by == "section":
            key, name = item.section_id, item.section.name
        elif by == "teacher":
            key, name = item.teacher_id, item.teacher.user.full_name
        else:
            key, name = item.room_id, item.room.code
        bucket = grouped.setdefault(key, {"id": key, "name": name, "days": {}})
        bucket["days"].setdefault(item.day_of_week.value, []).append(_assignment_dict(item))
    return list(grouped.values())

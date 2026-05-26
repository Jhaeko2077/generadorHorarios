from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import require_teacher_or_admin
from app.db.session import get_db
from app.models.user import User
from app.services.export_service import schedule_excel, schedule_pdf

router = APIRouter(prefix="/exports", tags=["exports"])


@router.get("/schedule-runs/{run_id}/excel")
def export_run_excel(run_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return StreamingResponse(
        schedule_excel(db, run_id),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="schedule-{run_id}.xlsx"'},
    )


@router.get("/schedule-runs/{run_id}/pdf")
def export_run_pdf(run_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return StreamingResponse(
        schedule_pdf(db, run_id),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="schedule-{run_id}.pdf"'},
    )


@router.get("/schedule-runs/{run_id}/teacher/{teacher_id}/excel")
def export_teacher_excel(run_id: str, teacher_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return StreamingResponse(
        schedule_excel(db, run_id, teacher_id=teacher_id),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="schedule-{run_id}-teacher-{teacher_id}.xlsx"'},
    )


@router.get("/schedule-runs/{run_id}/section/{section_id}/pdf")
def export_section_pdf(run_id: str, section_id: str, db: Session = Depends(get_db), _: User = Depends(require_teacher_or_admin)):
    return StreamingResponse(
        schedule_pdf(db, run_id, section_id=section_id),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="schedule-{run_id}-section-{section_id}.pdf"'},
    )

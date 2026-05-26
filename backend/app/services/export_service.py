from __future__ import annotations

from io import BytesIO

from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.schedule import ScheduleAssignment, ScheduleRun


def schedule_excel(db: Session, schedule_run_id: str, teacher_id: str | None = None, section_id: str | None = None) -> BytesIO:
    run = db.get(ScheduleRun, schedule_run_id)
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Schedule"
    sheet.append(["Run", run.name if run else schedule_run_id])
    sheet.append(["Status", run.status.value if run else "unknown"])
    if teacher_id:
        sheet.append(["Filtered teacher", teacher_id])
    if section_id:
        sheet.append(["Filtered section", section_id])
    sheet.append([])
    sheet.append(["Day", "Start", "End", "Course", "Section", "Teacher", "Room", "Penalty"])
    for assignment in _assignments(db, schedule_run_id, teacher_id=teacher_id, section_id=section_id):
        sheet.append(
            [
                assignment.day_of_week.value,
                assignment.start_time.isoformat(timespec="minutes"),
                assignment.end_time.isoformat(timespec="minutes"),
                assignment.offering.course.name,
                assignment.section.name,
                assignment.teacher.user.full_name,
                assignment.room.code,
                assignment.penalty_score,
            ]
        )
    stream = BytesIO()
    workbook.save(stream)
    stream.seek(0)
    return stream


def schedule_pdf(db: Session, schedule_run_id: str, teacher_id: str | None = None, section_id: str | None = None) -> BytesIO:
    run = db.get(ScheduleRun, schedule_run_id)
    stream = BytesIO()
    pdf = canvas.Canvas(stream, pagesize=letter)
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(40, 750, "Academic Timetable Optimizer")
    pdf.setFont("Helvetica", 10)
    pdf.drawString(40, 732, f"Schedule run: {run.name if run else schedule_run_id}")
    pdf.drawString(40, 718, f"Status: {run.status.value if run else 'unknown'}")
    if teacher_id:
        pdf.drawString(40, 704, f"Teacher filter: {teacher_id}")
    if section_id:
        pdf.drawString(40, 704, f"Section filter: {section_id}")
    y = 680
    for assignment in _assignments(db, schedule_run_id, teacher_id=teacher_id, section_id=section_id):
        line = (
            f"{assignment.day_of_week.value} {assignment.start_time:%H:%M}-{assignment.end_time:%H:%M} | "
            f"{assignment.offering.course.name} | {assignment.section.name} | "
            f"{assignment.teacher.user.full_name} | {assignment.room.code}"
        )
        pdf.drawString(40, y, line[:115])
        y -= 16
        if y < 60:
            pdf.showPage()
            pdf.setFont("Helvetica", 10)
            y = 750
    pdf.save()
    stream.seek(0)
    return stream


def _assignments(
    db: Session,
    schedule_run_id: str,
    teacher_id: str | None = None,
    section_id: str | None = None,
) -> list[ScheduleAssignment]:
    stmt = (
        select(ScheduleAssignment)
        .where(ScheduleAssignment.schedule_run_id == schedule_run_id)
        .options(
            selectinload(ScheduleAssignment.offering).selectinload("*"),
            selectinload(ScheduleAssignment.section),
            selectinload(ScheduleAssignment.teacher).selectinload("*"),
            selectinload(ScheduleAssignment.room),
        )
        .order_by(ScheduleAssignment.day_of_week, ScheduleAssignment.start_time)
    )
    if teacher_id:
        stmt = stmt.where(ScheduleAssignment.teacher_id == teacher_id)
    if section_id:
        stmt = stmt.where(ScheduleAssignment.section_id == section_id)
    return db.scalars(stmt).all()

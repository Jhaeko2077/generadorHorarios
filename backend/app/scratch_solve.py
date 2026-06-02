from __future__ import annotations

from datetime import time

from app.core.enums import (
    AcademicRole,
    AvailabilityType,
    DayOfWeek,
    EmploymentType,
    RoomType,
    Shift,
)
from app.services.scheduler.domain import build_domain
from app.services.scheduler.models import (
    AvailabilityBlockDTO,
    CourseOfferingDTO,
    ManualLockDTO,
    RoomDTO,
    SchedulerInput,
    SectionDTO,
    TeacherDTO,
    TimeSlotDTO,
)
from app.services.scheduler.scorer import normalize_weights
from app.services.scheduler.solver import ScheduleSolver


def run_scratch_solve():
    # 1. Teachers
    teachers_data = [
        ("Ana Rojas", "t1", EmploymentType.full_time, AcademicRole.theory_teacher, 20, 6, 3, Shift.morning, True, False, False),
        ("Luis Vega", "t2", EmploymentType.part_time, AcademicRole.lab_teacher, 8, 4, 2, Shift.evening, False, True, False),
        ("Carmen Diaz", "t3", EmploymentType.full_time, AcademicRole.mixed, 22, 6, 3, Shift.any, True, True, False),
        ("Marco Torres", "t4", EmploymentType.extended_availability, AcademicRole.workshop_teacher, 28, 8, 4, Shift.any, True, False, True),
        ("Elena Ramos", "t5", EmploymentType.part_time, AcademicRole.theory_teacher, 10, 4, 2, Shift.morning, True, False, False),
        ("Pedro Salas", "t6", EmploymentType.full_time, AcademicRole.computer_lab, 20, 6, 3, Shift.evening, True, True, False),
    ]

    teachers = {}
    profiles = {}
    for name, tid, employment, _role, weekly, daily, consecutive, shift, _theory, _labs, _workshops in teachers_data:
        # Build availability blocks
        blocks = []
        weekdays = [DayOfWeek.monday, DayOfWeek.tuesday, DayOfWeek.wednesday, DayOfWeek.thursday, DayOfWeek.friday]
        saturday = DayOfWeek.saturday
        
        if name == "Ana Rojas":
            for d in weekdays:
                blocks.append(AvailabilityBlockDTO(d, time(7), time(12), AvailabilityType.preferred))
                blocks.append(AvailabilityBlockDTO(d, time(13), time(17), AvailabilityType.available))
            blocks.append(AvailabilityBlockDTO(DayOfWeek.friday, time(10), time(12), AvailabilityType.unavailable))
        elif name == "Luis Vega":
            for d in [DayOfWeek.monday, DayOfWeek.wednesday, DayOfWeek.friday]:
                blocks.append(AvailabilityBlockDTO(d, time(18), time(22), AvailabilityType.preferred))
            for d in [DayOfWeek.tuesday, DayOfWeek.thursday]:
                blocks.append(AvailabilityBlockDTO(d, time(13), time(17), AvailabilityType.available))
            blocks.append(AvailabilityBlockDTO(saturday, time(7), time(12), AvailabilityType.available))
        elif name == "Carmen Diaz":
            for d in weekdays:
                blocks.append(AvailabilityBlockDTO(d, time(7), time(17), AvailabilityType.available))
            for d in [DayOfWeek.monday, DayOfWeek.tuesday, DayOfWeek.thursday]:
                blocks.append(AvailabilityBlockDTO(d, time(18), time(22), AvailabilityType.discouraged))
        elif name == "Marco Torres":
            for d in weekdays:
                blocks.append(AvailabilityBlockDTO(d, time(7), time(17), AvailabilityType.available))
            for d in [DayOfWeek.tuesday, DayOfWeek.thursday]:
                blocks.append(AvailabilityBlockDTO(d, time(18), time(22), AvailabilityType.discouraged))
            blocks.append(AvailabilityBlockDTO(saturday, time(7), time(12), AvailabilityType.preferred))
        elif name == "Elena Ramos":
            for d in [DayOfWeek.monday, DayOfWeek.wednesday, DayOfWeek.friday]:
                blocks.append(AvailabilityBlockDTO(d, time(7), time(12), AvailabilityType.preferred))
            blocks.append(AvailabilityBlockDTO(DayOfWeek.tuesday, time(13), time(17), AvailabilityType.discouraged))
            blocks.append(AvailabilityBlockDTO(DayOfWeek.thursday, time(18), time(22), AvailabilityType.available))
            blocks.append(AvailabilityBlockDTO(DayOfWeek.tuesday, time(18), time(22), AvailabilityType.available))
        elif name == "Pedro Salas":
            for d in weekdays:
                blocks.append(AvailabilityBlockDTO(d, time(7), time(12), AvailabilityType.available))
                blocks.append(AvailabilityBlockDTO(d, time(18), time(22), AvailabilityType.preferred))

        teachers[tid] = TeacherDTO(
            id=tid,
            user_id="u_" + tid,
            full_name=name,
            employment_type=employment,
            max_weekly_hours=weekly,
            min_weekly_hours=0,
            max_daily_hours=daily,
            max_consecutive_blocks=consecutive,
            preferred_shift=shift,
            availability_blocks=blocks,
        )
        profiles[name] = tid

    # 2. Rooms
    rooms_data = [
        ("r1", "A101", RoomType.classroom, 40),
        ("r2", "A102", RoomType.classroom, 35),
        ("r3", "A201", RoomType.classroom, 30),
        ("r4", "LAB1", RoomType.lab, 28),
        ("r5", "LABPC1", RoomType.computer_lab, 30),
        ("r6", "TALLER1", RoomType.workshop, 35),
    ]
    rooms = {
        rid: RoomDTO(rid, code, rtype, cap, set())
        for rid, code, rtype, cap in rooms_data
    }

    # 3. Time Slots
    blocks_def = [
        (1, time(7), time(8), Shift.morning),
        (2, time(8), time(9), Shift.morning),
        (3, time(9), time(10), Shift.morning),
        (4, time(10), time(11), Shift.morning),
        (5, time(11), time(12), Shift.morning),
        (6, time(13), time(14), Shift.afternoon),
        (7, time(14), time(15), Shift.afternoon),
        (8, time(15), time(16), Shift.afternoon),
        (9, time(16), time(17), Shift.afternoon),
        (10, time(18), time(19), Shift.evening),
        (11, time(19), time(20), Shift.evening),
        (12, time(20), time(21), Shift.evening),
        (13, time(21), time(22), Shift.evening),
    ]
    time_slots = {}
    slot_id_map = {} # (day, block) -> id
    for day in [DayOfWeek.monday, DayOfWeek.tuesday, DayOfWeek.wednesday, DayOfWeek.thursday, DayOfWeek.friday, DayOfWeek.saturday]:
        for idx, start, end, shift in blocks_def:
            sid = f"ts_{day.value}_{idx}"
            time_slots[sid] = TimeSlotDTO(sid, day, idx, start, end, shift)
            slot_id_map[(day, idx)] = sid

    # 4. Sections
    sections_data = [
        ("s1", "IM-C1-A", 30, Shift.morning, "c1", 1),
        ("s2", "IM-C1-B", 28, Shift.afternoon, "c1", 1),
        ("s3", "SD-C1-A", 25, Shift.morning, "c2", 1),
        ("s4", "SD-C2-A", 22, Shift.evening, "c3", 2),
    ]
    sections = {
        sid: SectionDTO(sid, name, count, shift, cid, cyc_num)
        for sid, name, count, shift, cid, cyc_num in sections_data
    }

    # 5. Course Offerings
    offerings_data = [
        # (code, name, hours, rtype, requires_lab, section_id, teacher_name)
        ("MAT101", "Applied Mathematics", 4, RoomType.classroom, False, "s1", "Ana Rojas"),
        ("COM101", "Technical Communication", 2, RoomType.classroom, False, "s1", "Elena Ramos"),
        ("MEC101", "Basic Mechanics", 4, RoomType.workshop, True, "s1", "Marco Torres"),
        ("SAF101", "Industrial Safety", 2, RoomType.classroom, False, "s1", "Carmen Diaz"),
        
        ("MAT101", "Applied Mathematics", 4, RoomType.classroom, False, "s2", "Ana Rojas"),
        ("MEC101", "Basic Mechanics", 4, RoomType.workshop, True, "s2", "Marco Torres"),
        ("ELE101", "Basic Electricity", 4, RoomType.lab, True, "s2", "Luis Vega"),
        ("QLT101", "Quality Control", 2, RoomType.classroom, False, "s2", "Carmen Diaz"),
        
        ("PRG101", "Programming Fundamentals", 4, RoomType.computer_lab, True, "s3", "Pedro Salas"),
        ("DB101", "Databases", 4, RoomType.computer_lab, True, "s3", "Pedro Salas"),
        ("MAT101", "Applied Mathematics", 4, RoomType.classroom, False, "s3", "Ana Rojas"),
        ("ETH101", "Professional Ethics", 2, RoomType.classroom, False, "s3", "Elena Ramos"),
        
        ("PRG101", "Programming Fundamentals", 4, RoomType.computer_lab, True, "s4", "Pedro Salas"),
        ("DB101", "Databases", 4, RoomType.computer_lab, True, "s4", "Carmen Diaz"),
        ("CAD101", "Technical Drawing", 4, RoomType.computer_lab, True, "s4", "Marco Torres"),
        ("ETH101", "Professional Ethics", 2, RoomType.classroom, False, "s4", "Elena Ramos"),
    ]

    offerings = []
    for idx, (code, cname, hours, rtype, lab, sec_id, tname) in enumerate(offerings_data, start=1):
        off_id = f"off_{idx}"
        offerings.append(
            CourseOfferingDTO(
                id=off_id,
                course_id="c_" + code,
                course_name=cname,
                section_id=sec_id,
                section_name=sections[sec_id].name,
                teacher_id=profiles[tname],
                weekly_hours=hours,
                session_duration_blocks=2,
                sessions_per_week=hours // 2,
                requires_lab=lab,
                room_type_required=rtype,
                priority=1
            )
        )

    # 6. Manual Locks
    # Monday Block 1 (7:00-8:00) locked for MAT101 on section IM-C1-A (offering 1) in room A101 (r1)
    lock_slot_id = slot_id_map[(DayOfWeek.monday, 1)]
    locks = [
        ManualLockDTO(
            course_offering_id="off_1",
            room_id="r1",
            start_time_slot_id=lock_slot_id,
            duration_blocks=2
        )
    ]

    # Combine into input
    sch_input = SchedulerInput(
        academic_term_id="2026-I",
        teachers=teachers,
        sections=sections,
        offerings=offerings,
        rooms=rooms,
        time_slots=time_slots,
        manual_locks=locks,
        previous_assignments=[]
    )

    weights = normalize_weights({})
    print("--- Pre-solve diagnostics (build_domain) ---")
    domain = build_domain(sch_input, weights)
    print(f"Total sessions: {len(domain.sessions)}")
    print(f"Pre-solve diagnostics count: {len(domain.diagnostics)}")
    for d in domain.diagnostics:
        print(f"[{d.severity}] type={d.conflict_type}: {d.message} (entity={d.entity})")

    # Run solver
    print("\n--- Solving ---")
    solver = ScheduleSolver()
    result = solver.solve(sch_input, weights=weights, max_seconds=10)
    print(f"Solver Status: {result.status}")
    print(f"Solver Diagnostics count: {len(result.diagnostics)}")
    for d in result.diagnostics:
        print(f"[{d.severity}] type={d.conflict_type}: {d.message} (entity={d.entity})")


if __name__ == "__main__":
    run_scratch_solve()

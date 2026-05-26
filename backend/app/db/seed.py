from __future__ import annotations

from datetime import date, time

from sqlalchemy import select

from app.core.enums import (
    AcademicRole,
    AvailabilityType,
    DayOfWeek,
    EmploymentType,
    RoomType,
    Shift,
    UserRole,
)
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.academic import (
    AcademicTerm,
    Course,
    CourseOffering,
    Cycle,
    Program,
    Section,
    TimeSlot,
)
from app.models.room import Room
from app.models.schedule import ManualLock
from app.models.teacher import TeacherAvailability, TeacherProfile
from app.models.user import User


def run_seed() -> None:
    db = SessionLocal()
    try:
        if db.scalar(select(User.id).where(User.email == "admin@example.com")):
            print("Seed data already exists.")
            return
        admin = User(
            full_name="Admin Demo",
            email="admin@example.com",
            password_hash=hash_password("admin123456"),
            role=UserRole.admin,
        )
        db.add(admin)
        term = AcademicTerm(
            name="2026-I Demo Term",
            code="2026-I",
            start_date=date(2026, 3, 1),
            end_date=date(2026, 7, 30),
            is_active=True,
        )
        db.add(term)
        im = Program(code="IM", name="Industrial Mechanics", description="Mechanics technical program")
        sd = Program(code="SD", name="Software Development", description="Software technical program")
        db.add_all([im, sd])
        db.flush()
        cycles = [
            Cycle(program_id=im.id, name="Cycle 1", number=1),
            Cycle(program_id=im.id, name="Cycle 2", number=2),
            Cycle(program_id=sd.id, name="Cycle 1", number=1),
            Cycle(program_id=sd.id, name="Cycle 2", number=2),
        ]
        db.add_all(cycles)
        db.flush()
        sections = [
            Section(academic_term_id=term.id, cycle_id=cycles[0].id, code="IM-C1-A", name="IM-C1-A", student_count=30, shift=Shift.morning),
            Section(academic_term_id=term.id, cycle_id=cycles[0].id, code="IM-C1-B", name="IM-C1-B", student_count=28, shift=Shift.afternoon),
            Section(academic_term_id=term.id, cycle_id=cycles[2].id, code="SD-C1-A", name="SD-C1-A", student_count=25, shift=Shift.morning),
            Section(academic_term_id=term.id, cycle_id=cycles[3].id, code="SD-C2-A", name="SD-C2-A", student_count=22, shift=Shift.evening),
        ]
        db.add_all(sections)
        teachers = _teachers()
        db.add_all([teacher[0] for teacher in teachers])
        db.flush()
        profiles: dict[str, TeacherProfile] = {}
        for user, profile in teachers:
            profile.user_id = user.id
            db.add(profile)
            profiles[user.full_name] = profile
        db.flush()
        _availability(db, profiles)
        rooms = [
            Room(code="A101", name="Aula 101", room_type=RoomType.classroom, capacity=40),
            Room(code="A102", name="Aula 102", room_type=RoomType.classroom, capacity=35),
            Room(code="A201", name="Aula 201", room_type=RoomType.classroom, capacity=30),
            Room(code="LAB1", name="Laboratorio General", room_type=RoomType.lab, capacity=28),
            Room(code="LABPC1", name="Laboratorio de Computo", room_type=RoomType.computer_lab, capacity=30),
            Room(code="TALLER1", name="Taller Industrial", room_type=RoomType.workshop, capacity=35),
        ]
        db.add_all(rooms)
        _time_slots(db)
        db.flush()
        courses = _courses(cycles)
        db.add_all(courses)
        db.flush()
        course_by_code = {course.code: course for course in courses}
        offerings = [
            ("MAT101", sections[0], "Ana Rojas"),
            ("COM101", sections[0], "Elena Ramos"),
            ("MEC101", sections[0], "Marco Torres"),
            ("SAF101", sections[0], "Carmen Diaz"),
            ("MAT101", sections[1], "Ana Rojas"),
            ("MEC101", sections[1], "Marco Torres"),
            ("ELE101", sections[1], "Luis Vega"),
            ("QLT101", sections[1], "Carmen Diaz"),
            ("PRG101", sections[2], "Pedro Salas"),
            ("DB101", sections[2], "Pedro Salas"),
            ("MAT101", sections[2], "Ana Rojas"),
            ("ETH101", sections[2], "Elena Ramos"),
            ("PRG101", sections[3], "Pedro Salas"),
            ("DB101", sections[3], "Carmen Diaz"),
            ("CAD101", sections[3], "Marco Torres"),
            ("ETH101", sections[3], "Elena Ramos"),
        ]
        created_offerings: list[CourseOffering] = []
        for code, section, teacher_name in offerings:
            course = course_by_code[code]
            offering = CourseOffering(
                academic_term_id=term.id,
                course_id=course.id,
                section_id=section.id,
                teacher_id=profiles[teacher_name].id,
                weekly_hours=course.weekly_hours,
                session_duration_blocks=course.session_duration_blocks,
                sessions_per_week=course.sessions_per_week or course.weekly_hours // course.session_duration_blocks,
                requires_lab=course.requires_lab,
                room_type_required=course.room_type_required,
                priority=course.priority,
            )
            db.add(offering)
            created_offerings.append(offering)
        db.flush()
        morning_lock_slot = db.scalar(
            select(TimeSlot).where(TimeSlot.day_of_week == DayOfWeek.monday, TimeSlot.block_index == 1)
        )
        a101 = db.scalar(select(Room).where(Room.code == "A101"))
        db.add(
            ManualLock(
                academic_term_id=term.id,
                course_offering_id=created_offerings[0].id,
                room_id=a101.id,
                start_time_slot_id=morning_lock_slot.id,
                duration_blocks=2,
                reason="Demo lock for contest walkthrough",
                created_by_user_id=admin.id,
            )
        )
        db.commit()
        print("Seed data created. Admin: admin@example.com / admin123456")
    finally:
        db.close()


def _teachers() -> list[tuple[User, TeacherProfile]]:
    specs = [
        ("Ana Rojas", "ana@example.com", EmploymentType.full_time, AcademicRole.theory_teacher, 20, 6, 3, Shift.morning, True, False, False),
        ("Luis Vega", "luis@example.com", EmploymentType.part_time, AcademicRole.lab_teacher, 8, 4, 2, Shift.evening, False, True, False),
        ("Carmen Diaz", "carmen@example.com", EmploymentType.full_time, AcademicRole.mixed, 22, 6, 3, Shift.any, True, True, False),
        ("Marco Torres", "marco@example.com", EmploymentType.extended_availability, AcademicRole.workshop_teacher, 28, 8, 4, Shift.any, True, False, True),
        ("Elena Ramos", "elena@example.com", EmploymentType.part_time, AcademicRole.theory_teacher, 10, 4, 2, Shift.morning, True, False, False),
        ("Pedro Salas", "pedro@example.com", EmploymentType.full_time, AcademicRole.computer_lab, 20, 6, 3, Shift.evening, True, True, False),
    ]
    result = []
    for idx, (name, email, employment, role, weekly, daily, consecutive, shift, theory, labs, workshops) in enumerate(specs, start=1):
        user = User(full_name=name, email=email, password_hash=hash_password("teacher123456"), role=UserRole.teacher)
        profile = TeacherProfile(
            user_id="",
            teacher_code=f"T{idx:03}",
            employment_type=employment,
            academic_role=role,
            max_weekly_hours=weekly,
            max_daily_hours=daily,
            max_consecutive_blocks=consecutive,
            preferred_shift=shift,
            can_teach_theory=theory,
            can_teach_labs=labs,
            can_teach_workshops=workshops,
        )
        result.append((user, profile))
    return result


def _availability(db, profiles: dict[str, TeacherProfile]) -> None:
    weekdays = [DayOfWeek.monday, DayOfWeek.tuesday, DayOfWeek.wednesday, DayOfWeek.thursday, DayOfWeek.friday]
    saturday = DayOfWeek.saturday
    rules = {
        "Ana Rojas": [(weekdays, time(7), time(12), AvailabilityType.preferred), (weekdays, time(13), time(17), AvailabilityType.available)],
        "Luis Vega": [
            ([DayOfWeek.monday, DayOfWeek.wednesday, DayOfWeek.friday], time(18), time(22), AvailabilityType.preferred),
            ([DayOfWeek.tuesday, DayOfWeek.thursday], time(13), time(17), AvailabilityType.available),
            ([saturday], time(7), time(12), AvailabilityType.available),
        ],
        "Carmen Diaz": [(weekdays, time(7), time(17), AvailabilityType.available), ([DayOfWeek.tuesday, DayOfWeek.thursday], time(18), time(22), AvailabilityType.discouraged)],
        "Marco Torres": [
            (weekdays, time(7), time(17), AvailabilityType.available),
            ([DayOfWeek.tuesday, DayOfWeek.thursday], time(18), time(22), AvailabilityType.discouraged),
            ([saturday], time(7), time(12), AvailabilityType.preferred),
        ],
        "Elena Ramos": [
            ([DayOfWeek.monday, DayOfWeek.wednesday, DayOfWeek.friday], time(7), time(12), AvailabilityType.preferred),
            ([DayOfWeek.tuesday], time(13), time(17), AvailabilityType.discouraged),
            ([DayOfWeek.thursday], time(18), time(22), AvailabilityType.available),
        ],
        "Pedro Salas": [(weekdays, time(7), time(12), AvailabilityType.available), (weekdays, time(18), time(22), AvailabilityType.preferred)],
    }
    for name, ranges in rules.items():
        for days, start, end, kind in ranges:
            for day in days:
                db.add(TeacherAvailability(teacher_id=profiles[name].id, day_of_week=day, start_time=start, end_time=end, availability_type=kind))
        if name == "Ana Rojas":
            db.add(TeacherAvailability(teacher_id=profiles[name].id, day_of_week=DayOfWeek.friday, start_time=time(10), end_time=time(12), availability_type=AvailabilityType.unavailable, reason="Coordination meeting"))


def _time_slots(db) -> None:
    blocks = [
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
    for day in [DayOfWeek.monday, DayOfWeek.tuesday, DayOfWeek.wednesday, DayOfWeek.thursday, DayOfWeek.friday, DayOfWeek.saturday]:
        for block_index, start, end, shift in blocks:
            db.add(TimeSlot(day_of_week=day, block_index=block_index, start_time=start, end_time=end, shift=shift))


def _courses(cycles: list[Cycle]) -> list[Course]:
    im_c1, _, sd_c1, sd_c2 = cycles
    specs = [
        (im_c1, "MAT101", "Applied Mathematics", 4, RoomType.classroom, False),
        (im_c1, "COM101", "Technical Communication", 2, RoomType.classroom, False),
        (im_c1, "MEC101", "Basic Mechanics", 4, RoomType.workshop, True),
        (im_c1, "SAF101", "Industrial Safety", 2, RoomType.classroom, False),
        (im_c1, "CAD101", "Technical Drawing", 4, RoomType.computer_lab, True),
        (sd_c1, "PRG101", "Programming Fundamentals", 4, RoomType.computer_lab, True),
        (sd_c1, "DB101", "Databases", 4, RoomType.computer_lab, True),
        (im_c1, "ELE101", "Basic Electricity", 4, RoomType.lab, True),
        (im_c1, "QLT101", "Quality Control", 2, RoomType.classroom, False),
        (sd_c2, "ETH101", "Professional Ethics", 2, RoomType.classroom, False),
    ]
    return [
        Course(
            cycle_id=cycle.id,
            code=code,
            name=name,
            weekly_hours=hours,
            session_duration_blocks=2,
            sessions_per_week=hours // 2,
            requires_lab=requires_lab,
            room_type_required=room_type,
        )
        for cycle, code, name, hours, room_type, requires_lab in specs
    ]


if __name__ == "__main__":
    run_seed()

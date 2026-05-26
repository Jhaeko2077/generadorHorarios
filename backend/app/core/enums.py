from __future__ import annotations

from enum import StrEnum


class UserRole(StrEnum):
    admin = "admin"
    teacher = "teacher"


class EmploymentType(StrEnum):
    part_time = "part_time"
    full_time = "full_time"
    extended_availability = "extended_availability"


class AcademicRole(StrEnum):
    theory_teacher = "theory_teacher"
    lab_teacher = "lab_teacher"
    workshop_teacher = "workshop_teacher"
    coordinator = "coordinator"
    mixed = "mixed"
    computer_lab = "computer_lab"


class AvailabilityType(StrEnum):
    available = "available"
    preferred = "preferred"
    discouraged = "discouraged"
    unavailable = "unavailable"


class DayOfWeek(StrEnum):
    monday = "monday"
    tuesday = "tuesday"
    wednesday = "wednesday"
    thursday = "thursday"
    friday = "friday"
    saturday = "saturday"
    sunday = "sunday"


class Shift(StrEnum):
    morning = "morning"
    afternoon = "afternoon"
    evening = "evening"
    mixed = "mixed"
    any = "any"


class RoomType(StrEnum):
    classroom = "classroom"
    lab = "lab"
    workshop = "workshop"
    computer_lab = "computer_lab"
    any = "any"


class ScheduleRunStatus(StrEnum):
    pending = "pending"
    running = "running"
    optimal = "optimal"
    feasible = "feasible"
    infeasible = "infeasible"
    failed = "failed"


class ConflictSeverity(StrEnum):
    hard = "hard"
    soft = "soft"
    warning = "warning"

from app.services.export_service import _assignments


class FakeScalarResult:
    def all(self):
        return []


class FakeDb:
    def __init__(self):
        self.statement = None

    def scalars(self, statement):
        self.statement = statement
        return FakeScalarResult()


def test_assignment_query_filters_teacher_and_section() -> None:
    db = FakeDb()
    _assignments(db, "run-1", teacher_id="teacher-1", section_id="section-1")
    compiled = str(db.statement)
    assert "schedule_assignments.teacher_id" in compiled
    assert "schedule_assignments.section_id" in compiled

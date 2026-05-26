import { endpoints } from "../api/academic";
import { roomTypes } from "../utils/constants";
import CrudPage from "./CrudPage";

export default function CourseOfferingsPage() {
  return <CrudPage title="Course Offerings" path={endpoints.offerings} fields={[
    { name: "academic_term_id", label: "Term ID", defaultValue: "" },
    { name: "course_id", label: "Course ID", defaultValue: "" },
    { name: "section_id", label: "Section ID", defaultValue: "" },
    { name: "teacher_id", label: "Teacher ID", defaultValue: "" },
    { name: "weekly_hours", label: "Weekly hours", type: "number", defaultValue: 4 },
    { name: "session_duration_blocks", label: "Session blocks", type: "number", defaultValue: 2 },
    { name: "sessions_per_week", label: "Sessions/week", type: "number", defaultValue: 2 },
    { name: "requires_lab", label: "Requires lab", type: "checkbox", defaultValue: false },
    { name: "room_type_required", label: "Room type", options: roomTypes, defaultValue: "classroom" },
    { name: "priority", label: "Priority", type: "number", defaultValue: 1 },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true }
  ]} />;
}

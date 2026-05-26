import { endpoints } from "../api/academic";
import { roomTypes } from "../utils/constants";
import CrudPage from "./CrudPage";

export default function CoursesPage() {
  return <CrudPage title="Courses" path={endpoints.courses} fields={[
    { name: "cycle_id", label: "Cycle ID", defaultValue: "" },
    { name: "code", label: "Code", defaultValue: "" },
    { name: "name", label: "Name", defaultValue: "" },
    { name: "weekly_hours", label: "Weekly hours", type: "number", defaultValue: 4 },
    { name: "session_duration_blocks", label: "Session blocks", type: "number", defaultValue: 2 },
    { name: "requires_lab", label: "Requires lab", type: "checkbox", defaultValue: false },
    { name: "room_type_required", label: "Room type", options: roomTypes, defaultValue: "classroom" },
    { name: "priority", label: "Priority", type: "number", defaultValue: 1 },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true }
  ]} />;
}

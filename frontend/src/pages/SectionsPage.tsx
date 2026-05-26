import { endpoints } from "../api/academic";
import { shifts } from "../utils/constants";
import CrudPage from "./CrudPage";

export default function SectionsPage() {
  return <CrudPage title="Sections" path={endpoints.sections} fields={[
    { name: "academic_term_id", label: "Term ID", defaultValue: "" },
    { name: "cycle_id", label: "Cycle ID", defaultValue: "" },
    { name: "code", label: "Code", defaultValue: "" },
    { name: "name", label: "Name", defaultValue: "" },
    { name: "student_count", label: "Students", type: "number", defaultValue: 25 },
    { name: "shift", label: "Shift", options: shifts, defaultValue: "morning" },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true }
  ]} />;
}

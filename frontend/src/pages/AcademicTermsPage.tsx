import { endpoints } from "../api/academic";
import CrudPage from "./CrudPage";

export default function AcademicTermsPage() {
  return <CrudPage title="Academic Terms" path={endpoints.terms} fields={[
    { name: "name", label: "Name", defaultValue: "2026-I" },
    { name: "code", label: "Code", defaultValue: "2026-I" },
    { name: "start_date", label: "Start date", type: "date", defaultValue: "2026-03-01" },
    { name: "end_date", label: "End date", type: "date", defaultValue: "2026-07-30" },
    { name: "previous_term_id", label: "Previous term ID", defaultValue: "", required: false },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true }
  ]} />;
}

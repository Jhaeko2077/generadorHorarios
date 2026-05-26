import { endpoints } from "../api/academic";
import CrudPage from "./CrudPage";

export default function ProgramsPage() {
  return <CrudPage title="Programs" path={endpoints.programs} fields={[
    { name: "code", label: "Code", defaultValue: "" },
    { name: "name", label: "Name", defaultValue: "" },
    { name: "description", label: "Description", defaultValue: "", required: false },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true }
  ]} />;
}

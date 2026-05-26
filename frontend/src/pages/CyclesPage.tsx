import { endpoints } from "../api/academic";
import CrudPage from "./CrudPage";

export default function CyclesPage() {
  return <CrudPage title="Cycles" path={endpoints.cycles} fields={[
    { name: "program_id", label: "Program ID", defaultValue: "" },
    { name: "name", label: "Name", defaultValue: "Cycle 1" },
    { name: "number", label: "Number", type: "number", defaultValue: 1 },
    { name: "description", label: "Description", defaultValue: "", required: false }
  ]} />;
}

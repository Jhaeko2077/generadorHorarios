import { endpoints } from "../api/academic";
import { roomTypes } from "../utils/constants";
import CrudPage from "./CrudPage";

export default function RoomsPage() {
  return <CrudPage title="Rooms" path={endpoints.rooms} fields={[
    { name: "code", label: "Code", defaultValue: "" },
    { name: "name", label: "Name", defaultValue: "" },
    { name: "room_type", label: "Type", options: roomTypes.filter((x) => x !== "any"), defaultValue: "classroom" },
    { name: "capacity", label: "Capacity", type: "number", defaultValue: 30 },
    { name: "campus", label: "Campus", defaultValue: "", required: false },
    { name: "is_active", label: "Active", type: "checkbox", defaultValue: true }
  ]} />;
}

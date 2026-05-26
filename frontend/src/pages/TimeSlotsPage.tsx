import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkGenerateSlots, endpoints } from "../api/academic";
import { dayOptions, shifts } from "../utils/constants";
import CrudPage from "./CrudPage";

export default function TimeSlotsPage() {
  const qc = useQueryClient();
  const bulk = useMutation({ mutationFn: bulkGenerateSlots, onSuccess: () => qc.invalidateQueries({ queryKey: [endpoints.slots] }) });
  return (
    <>
      <button className="secondary" onClick={() => bulk.mutate()}>Generate default Monday-Saturday slots</button>
      <CrudPage title="Time Slots" path={endpoints.slots} fields={[
        { name: "day_of_week", label: "Day", options: dayOptions, defaultValue: "monday" },
        { name: "block_index", label: "Block", type: "number", defaultValue: 1 },
        { name: "start_time", label: "Start", type: "time", defaultValue: "07:00" },
        { name: "end_time", label: "End", type: "time", defaultValue: "08:00" },
        { name: "shift", label: "Shift", options: shifts.filter((x) => !["mixed", "any"].includes(x)), defaultValue: "morning" },
        { name: "is_active", label: "Active", type: "checkbox", defaultValue: true }
      ]} />
    </>
  );
}

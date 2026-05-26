import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { addMyAvailability, deleteAvailability, myAvailability, myProfile, updateAvailability } from "../api/teachers";
import ErrorMessage from "../components/ErrorMessage";
import FormField from "../components/FormField";
import Loading from "../components/Loading";
import type { AvailabilityBlock } from "../types/teacher";
import { dayOptions } from "../utils/constants";

const emptyForm = {
  day_of_week: "monday",
  start_time: "07:00",
  end_time: "09:00",
  availability_type: "available",
  max_hours_in_range: "",
  reason: ""
};

export default function TeacherAvailabilityPage() {
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["me-profile"], queryFn: myProfile });
  const query = useQuery({ queryKey: ["me-availability"], queryFn: myAvailability });
  const [form, setForm] = useState<Record<string, string | number | boolean>>(emptyForm);
  const [editing, setEditing] = useState<AvailabilityBlock | null>(null);
  const [message, setMessage] = useState("");

  const save = useMutation({
    mutationFn: (payload: Partial<AvailabilityBlock>) =>
      editing && profile.data
        ? updateAvailability(profile.data.id, editing.id, payload)
        : addMyAvailability(payload),
    onSuccess: async () => {
      setMessage(editing ? "Availability block updated." : "Availability block created.");
      setEditing(null);
      setForm(emptyForm);
      await qc.invalidateQueries({ queryKey: ["me-availability"] });
    }
  });
  const del = useMutation({
    mutationFn: (block: AvailabilityBlock) => deleteAvailability(block.teacher_id, block.id),
    onSuccess: async () => {
      setMessage("Availability block deleted.");
      await qc.invalidateQueries({ queryKey: ["me-availability"] });
    }
  });

  const set = (name: string, value: string | number | boolean) => setForm((prev) => ({ ...prev, [name]: value }));

  if (query.isLoading || profile.isLoading) return <Loading />;
  if (query.error || profile.error) return <ErrorMessage error={query.error || profile.error} />;

  const payload = {
    ...form,
    max_hours_in_range: form.max_hours_in_range === "" ? null : Number(form.max_hours_in_range)
  };

  return (
    <div>
      <h1>Availability</h1>
      <div className="notice">preferred = best time, available = allowed, discouraged = allowed but avoided, unavailable = forbidden.</div>
      <form className="panel formGrid" onSubmit={(event) => { event.preventDefault(); save.mutate(payload as any); }}>
        <FormField label="Day" name="day_of_week" options={dayOptions} value={form.day_of_week} onChange={set} />
        <FormField label="Start" name="start_time" type="time" value={form.start_time} onChange={set} />
        <FormField label="End" name="end_time" type="time" value={form.end_time} onChange={set} />
        <FormField label="Type" name="availability_type" options={["available", "preferred", "discouraged", "unavailable"]} value={form.availability_type} onChange={set} />
        <FormField label="Max hours in range" name="max_hours_in_range" type="number" value={form.max_hours_in_range} onChange={set} />
        <FormField label="Reason" name="reason" value={form.reason} onChange={set} />
        <button>{editing ? "Save block" : "Add block"}</button>
        {editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>}
      </form>
      {message && <div className="notice">{message}</div>}
      {(save.error || del.error) && <ErrorMessage error={save.error || del.error} />}
      <div className="tableWrap">
        <table>
          <thead><tr><th>Day</th><th>Start</th><th>End</th><th>Type</th><th>Max hours</th><th>Reason</th><th>Actions</th></tr></thead>
          <tbody>
            {(query.data || []).map((block) => (
              <tr key={block.id}>
                <td>{block.day_of_week}</td><td>{block.start_time}</td><td>{block.end_time}</td><td>{block.availability_type}</td><td>{block.max_hours_in_range ?? ""}</td><td>{block.reason ?? ""}</td>
                <td><div className="rowActions"><button className="small" onClick={() => { setEditing(block); setForm({ day_of_week: block.day_of_week, start_time: block.start_time.slice(0, 5), end_time: block.end_time.slice(0, 5), availability_type: block.availability_type, max_hours_in_range: block.max_hours_in_range ?? "", reason: block.reason ?? "" }); }}>Edit</button><button className="small dangerButton" onClick={() => confirm("Delete this block?") && del.mutate(block)}>Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

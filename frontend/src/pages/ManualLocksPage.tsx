import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { create, endpoints, list, remove } from "../api/academic";
import ErrorMessage from "../components/ErrorMessage";
import FormField from "../components/FormField";
import Loading from "../components/Loading";

const emptyLock = {
  academic_term_id: "",
  course_offering_id: "",
  room_id: "",
  start_time_slot_id: "",
  duration_blocks: 2,
  reason: ""
};

export default function ManualLocksPage() {
  const qc = useQueryClient();
  const locks = useQuery({ queryKey: [endpoints.locks], queryFn: () => list<any>(endpoints.locks) });
  const [form, setForm] = useState<Record<string, string | number | boolean>>(emptyLock);
  const save = useMutation({ mutationFn: (payload: unknown) => create(endpoints.locks, payload), onSuccess: () => qc.invalidateQueries({ queryKey: [endpoints.locks] }) });
  const del = useMutation({ mutationFn: (id: string) => remove(endpoints.locks, id), onSuccess: () => qc.invalidateQueries({ queryKey: [endpoints.locks] }) });
  const set = (name: string, value: string | number | boolean) => setForm((prev) => ({ ...prev, [name]: value }));
  if (locks.isLoading) return <Loading />;
  return (
    <div>
      <h1>Manual Locks</h1>
      <div className="notice">Manual locks are hard constraints. OR-Tools must place the selected offering in the selected room and start slot, or the run becomes infeasible with diagnostics.</div>
      <form className="panel formGrid" onSubmit={(event) => { event.preventDefault(); save.mutate(form); }}>
        <FormField label="Academic term ID" name="academic_term_id" value={form.academic_term_id} onChange={set} />
        <FormField label="Course offering ID" name="course_offering_id" value={form.course_offering_id} onChange={set} />
        <FormField label="Room ID" name="room_id" value={form.room_id} onChange={set} />
        <FormField label="Start time slot ID" name="start_time_slot_id" value={form.start_time_slot_id} onChange={set} />
        <FormField label="Duration blocks" name="duration_blocks" type="number" value={form.duration_blocks} onChange={set} />
        <FormField label="Reason" name="reason" value={form.reason} onChange={set} />
        <button>Create lock</button>
      </form>
      {(save.error || del.error) && <ErrorMessage error={save.error || del.error} />}
      <div className="tableWrap"><table><thead><tr><th>Term</th><th>Offering</th><th>Room</th><th>Start slot</th><th>Blocks</th><th>Reason</th><th>Actions</th></tr></thead><tbody>{(locks.data || []).map((lock: any) => <tr key={lock.id}><td>{lock.academic_term_id}</td><td>{lock.course_offering_id}</td><td>{lock.room_id}</td><td>{lock.start_time_slot_id}</td><td>{lock.duration_blocks}</td><td>{lock.reason}</td><td><button className="small dangerButton" onClick={() => confirm("Delete this manual lock?") && del.mutate(lock.id)}>Delete</button></td></tr>)}</tbody></table></div>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { exportExcel, exportPdf } from "../api/exports";
import { assignments, conflicts, publishRun, scheduleRun } from "../api/schedules";
import Loading from "../components/Loading";
import ScheduleGrid from "../components/ScheduleGrid";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";

export default function ScheduleRunDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const auth = useAuth();
  const run = useQuery({ queryKey: ["run", id], queryFn: () => scheduleRun(id) });
  const grouped = useQuery({ queryKey: ["run-section", id], queryFn: () => assignments(id, "section") });
  const conflictList = useQuery({ queryKey: ["run-conflicts", id], queryFn: () => conflicts(id) });
  const publish = useMutation({ mutationFn: () => publishRun(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["run", id] }) });
  if (run.isLoading || grouped.isLoading) return <Loading />;
  const canPublish = auth.data?.role === "admin" && ["optimal", "feasible"].includes(run.data?.status || "");
  return (
    <div>
      <h1>{run.data?.name} {run.data && <StatusBadge status={run.data.status} />}</h1>
      <p>Objective {run.data?.objective_value ?? "n/a"} | Penalty {run.data?.soft_penalty_score} | Diversity {run.data?.diversity_score ?? "n/a"}</p>
      <div className="actions"><a className="button" href={exportExcel(id)}>Excel</a><a className="button" href={exportPdf(id)}>PDF</a>{canPublish && <button onClick={() => publish.mutate()}>Publish</button>}</div>
      {publish.isSuccess && <div className="notice">Schedule run published.</div>}
      {publish.error && <div className="notice danger">{(publish.error as Error).message}</div>}
      <ScheduleGrid groups={(grouped.data || []) as any[]} />
      <h2>Conflicts</h2>
      <pre>{JSON.stringify(conflictList.data || [], null, 2)}</pre>
    </div>
  );
}

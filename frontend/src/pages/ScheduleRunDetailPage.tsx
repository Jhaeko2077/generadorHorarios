import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { exportExcel, exportPdf } from "../api/exports";
import { assignments, conflicts, deleteRun, publishRun, scheduleRun } from "../api/schedules";
import Loading from "../components/Loading";
import ScheduleGrid from "../components/ScheduleGrid";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";

export default function ScheduleRunDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const auth = useAuth();
  const run = useQuery({ queryKey: ["run", id], queryFn: () => scheduleRun(id) });
  const grouped = useQuery({ queryKey: ["run-section", id], queryFn: () => assignments(id, "section") });
  const conflictList = useQuery({ queryKey: ["run-conflicts", id], queryFn: () => conflicts(id) });
  const publish = useMutation({
    mutationFn: () => publishRun(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["run", id] })
  });
  const remove = useMutation({
    mutationFn: () => deleteRun(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["runs"] });
      navigate("/");
    }
  });

  if (run.isLoading || grouped.isLoading) return <Loading />;

  const canPublish = auth.data?.role === "admin" && ["optimal", "feasible"].includes(run.data?.status || "");
  const canDelete = auth.data?.role === "admin";

  return (
    <div>
      <h1>{run.data?.name} {run.data && <StatusBadge status={run.data.status} />}</h1>
      <p>
        Objetivo {run.data?.objective_value ?? "n/a"} | Penalizacion {run.data?.soft_penalty_score} | Diversidad {run.data?.diversity_score ?? "n/a"}
      </p>
      <div className="actions wrapActions">
        <a className="button" href={exportExcel(id)}>Excel</a>
        <a className="button" href={exportPdf(id)}>PDF</a>
        {canPublish && <button onClick={() => publish.mutate()} disabled={publish.isPending}>Publicar</button>}
        {canDelete && (
          <button
            className="dangerButton"
            disabled={remove.isPending}
            onClick={() => {
              if (confirm("Borrar este horario generado? Tambien se eliminaran sus asignaciones, conflictos y publicacion asociada.")) {
                remove.mutate();
              }
            }}
          >
            {remove.isPending ? "Borrando..." : "Borrar horario"}
          </button>
        )}
      </div>
      {publish.isSuccess && <div className="notice">Horario publicado.</div>}
      {publish.error && <div className="notice danger">{(publish.error as Error).message}</div>}
      {remove.error && <div className="notice danger">{(remove.error as Error).message}</div>}
      <ScheduleGrid groups={(grouped.data || []) as any[]} />
      <h2>Conflictos</h2>
      <pre>{JSON.stringify(conflictList.data || [], null, 2)}</pre>
    </div>
  );
}

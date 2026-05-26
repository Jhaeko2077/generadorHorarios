import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { exportSectionPdf, exportTeacherExcel } from "../api/exports";
import { assignments, scheduleRuns } from "../api/schedules";
import Loading from "../components/Loading";
import ScheduleGrid from "../components/ScheduleGrid";

export default function ScheduleGroupPage({ group, title }: { group: "section" | "teacher" | "room"; title: string }) {
  const runs = useQuery({ queryKey: ["runs"], queryFn: scheduleRuns });
  const [runId, setRunId] = useState("");
  const activeRun = runId || runs.data?.[0]?.id || "";
  const grouped = useQuery({ queryKey: ["assignments", group, activeRun], queryFn: () => assignments(activeRun, group), enabled: Boolean(activeRun) });
  if (runs.isLoading) return <Loading />;
  return (
    <div>
      <h1>{title}</h1>
      <select value={activeRun} onChange={(event) => setRunId(event.target.value)}>
        {runs.data?.map((run) => <option key={run.id} value={run.id}>{run.name} ({run.status})</option>)}
      </select>
      {grouped.isLoading ? <Loading /> : (
        <>
          {group !== "room" && <GroupedExports runId={activeRun} group={group} groups={(grouped.data || []) as any[]} />}
          <ScheduleGrid groups={(grouped.data || []) as any[]} />
        </>
      )}
    </div>
  );
}

function GroupedExports({ runId, group, groups }: { runId: string; group: "section" | "teacher"; groups: any[] }) {
  return (
    <section className="panel">
      <h2>Filtered exports</h2>
      <div className="actions wrapActions">
        {groups.map((item) => (
          <a
            className="button secondary"
            key={item.id}
            href={group === "teacher" ? exportTeacherExcel(runId, item.id) : exportSectionPdf(runId, item.id)}
          >
            {group === "teacher" ? "Teacher Excel" : "Section PDF"}: {item.name}
          </a>
        ))}
      </div>
    </section>
  );
}

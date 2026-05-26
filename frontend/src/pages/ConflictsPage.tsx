import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { conflicts, scheduleRuns } from "../api/schedules";
import DataTable from "../components/DataTable";

export default function ConflictsPage() {
  const runs = useQuery({ queryKey: ["runs"], queryFn: scheduleRuns });
  const [runId, setRunId] = useState("");
  const activeRun = runId || runs.data?.[0]?.id || "";
  const query = useQuery({ queryKey: ["conflicts", activeRun], queryFn: () => conflicts(activeRun), enabled: Boolean(activeRun) });
  return (
    <div>
      <h1>Conflicts & Diagnostics</h1>
      <select value={activeRun} onChange={(event) => setRunId(event.target.value)}>{runs.data?.map((run) => <option key={run.id} value={run.id}>{run.name}</option>)}</select>
      <DataTable rows={(query.data || []) as any[]} />
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { exportTeacherExcel } from "../api/exports";
import { mySchedule } from "../api/schedules";
import Loading from "../components/Loading";
import ScheduleGrid from "../components/ScheduleGrid";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";

export default function MySchedulePage() {
  const auth = useAuth();
  const query = useQuery({ queryKey: ["my-schedule"], queryFn: mySchedule });
  if (query.isLoading || auth.isLoading) return <Loading />;
  const run = query.data?.schedule_run;
  return (
    <div>
      <h1>My Schedule</h1>
      {!run ? (
        <div className="notice">No published schedule available yet.</div>
      ) : (
        <>
          <section className="panel">
            <h2>{run.name} <StatusBadge status={run.status} /></h2>
            <p>Published schedule for {auth.data?.full_name}</p>
            {Boolean(query.data?.groups?.[0]) && <a className="button" href={exportTeacherExcel(run.id, (query.data!.groups[0] as any).id)}>Export my schedule</a>}
          </section>
          <ScheduleGrid groups={(query.data?.groups || []) as any[]} />
        </>
      )}
    </div>
  );
}


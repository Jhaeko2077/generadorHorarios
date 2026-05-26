import { useQuery } from "@tanstack/react-query";
import { endpoints, list } from "../api/academic";
import { scheduleRuns } from "../api/schedules";
import Loading from "../components/Loading";
import StatusBadge from "../components/StatusBadge";

export default function DashboardPage() {
  const teachers = useQuery({ queryKey: ["teachers"], queryFn: () => list(endpoints.teachers) });
  const courses = useQuery({ queryKey: ["courses"], queryFn: () => list(endpoints.courses) });
  const sections = useQuery({ queryKey: ["sections"], queryFn: () => list(endpoints.sections) });
  const rooms = useQuery({ queryKey: ["rooms"], queryFn: () => list(endpoints.rooms) });
  const runs = useQuery({ queryKey: ["runs"], queryFn: scheduleRuns });
  if ([teachers, courses, sections, rooms, runs].some((q) => q.isLoading)) return <Loading />;
  const latest = runs.data?.[0];
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div className="metrics">
        <Metric label="Teachers" value={teachers.data?.length || 0} />
        <Metric label="Courses" value={courses.data?.length || 0} />
        <Metric label="Sections" value={sections.data?.length || 0} />
        <Metric label="Rooms" value={rooms.data?.length || 0} />
      </div>
      <section className="panel">
        <h2>Latest Schedule Run</h2>
        {latest ? <p>{latest.name} <StatusBadge status={latest.status} /></p> : <p>No runs yet.</p>}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

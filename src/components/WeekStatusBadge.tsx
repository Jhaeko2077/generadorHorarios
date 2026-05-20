export function WeekStatusBadge({ status }: { status: "draft" | "completed" | "exported" }) {
  const styles = {
    draft: "bg-slate-100 text-slate-700",
    completed: "bg-amber-100 text-amber-700",
    exported: "bg-emerald-100 text-emerald-700",
  } as const;

  return <span className={`rounded px-2 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>;
}

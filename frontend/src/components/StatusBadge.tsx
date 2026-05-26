import { statuses } from "../utils/constants";

export default function StatusBadge({ status }: { status: string }) {
  const tone = statuses[status as keyof typeof statuses] || "muted";
  return <span className={`badge ${tone}`}>{status.toUpperCase()}</span>;
}

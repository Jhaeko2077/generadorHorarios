import { useQuery } from "@tanstack/react-query";
import { auditLogs } from "../api/audit";
import Loading from "../components/Loading";

export default function AuditLogsPage() {
  const query = useQuery({ queryKey: ["audit"], queryFn: auditLogs });
  if (query.isLoading) return <Loading />;
  return (
    <div>
      <h1>Audit Logs</h1>
      <div className="tableWrap">
        <table>
          <thead><tr><th>Created</th><th>User</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>Details</th></tr></thead>
          <tbody>
            {(query.data || []).map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td>{log.user_id || "system"}</td>
                <td>{log.action}</td>
                <td>{log.entity_type}</td>
                <td>{log.entity_id}</td>
                <td><details><summary>JSON</summary><pre>{JSON.stringify({ before: log.before_json, after: log.after_json }, null, 2)}</pre></details></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

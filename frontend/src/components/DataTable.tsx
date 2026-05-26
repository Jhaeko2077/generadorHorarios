export default function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).slice(0, 8);
  if (!rows.length) return <div className="notice">No records yet.</div>;
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>{keys.map((key) => <th key={key}>{key}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)}>
              {keys.map((key) => (
                <td key={key}>{format(row[key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function format(value: unknown) {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (value && typeof value === "object") return "object";
  return String(value ?? "");
}

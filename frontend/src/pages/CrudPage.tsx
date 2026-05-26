import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { create, list, remove, update } from "../api/academic";
import ErrorMessage from "../components/ErrorMessage";
import FormField from "../components/FormField";
import Loading from "../components/Loading";

type Field = {
  name: string;
  label: string;
  type?: string;
  options?: string[];
  defaultValue: string | number | boolean;
  required?: boolean;
};

type Row = Record<string, unknown> & { id?: string };

export default function CrudPage({ title, path, fields }: { title: string; path: string; fields: Field[] }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: [path], queryFn: () => list<Row>(path) });
  const initial = useMemo(() => Object.fromEntries(fields.map((field) => [field.name, field.defaultValue])), [fields]);
  const [form, setForm] = useState<Record<string, unknown>>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editingId ? update(path, editingId, payload) : create(path, payload),
    onSuccess: async () => {
      setMessage(editingId ? "Record updated." : "Record created.");
      setEditingId(null);
      setForm(initial);
      await queryClient.invalidateQueries({ queryKey: [path] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove(path, id),
    onSuccess: async () => {
      setMessage("Record deleted.");
      await queryClient.invalidateQueries({ queryKey: [path] });
    }
  });

  function submit() {
    const missing = fields.find((field) => field.required !== false && field.type !== "checkbox" && String(form[field.name] ?? "").trim() === "");
    if (missing) {
      setMessage(`${missing.label} is required.`);
      return;
    }
    const payload = Object.fromEntries(fields.map((field) => [field.name, field.required === false && form[field.name] === "" ? null : form[field.name]]));
    saveMutation.mutate(payload);
  }

  function edit(row: Row) {
    setEditingId(String(row.id));
    setForm(Object.fromEntries(fields.map((field) => [field.name, row[field.name] ?? field.defaultValue])));
    setMessage("");
  }

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  const rows = query.data || [];
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).slice(0, 8);

  return (
    <div>
      <h1>{title}</h1>
      <form
        className="panel formGrid"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {fields.map((field) => (
          <FormField
            key={field.name}
            {...field}
            value={form[field.name] as string | number | boolean}
            onChange={(name, value) => setForm({ ...form, [name]: value })}
          />
        ))}
        <button>{editingId ? "Save changes" : "Create"}</button>
        {editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(initial); }}>Cancel</button>}
      </form>
      {message && <div className="notice">{message}</div>}
      {(saveMutation.error || deleteMutation.error) && <ErrorMessage error={saveMutation.error || deleteMutation.error} />}
      {!rows.length ? (
        <div className="notice">No records yet.</div>
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                {columns.map((key) => <th key={key}>{key}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={String(row.id ?? index)}>
                  {columns.map((key) => <td key={key}>{format(row[key])}</td>)}
                  <td>
                    <div className="rowActions">
                      <button type="button" className="small" onClick={() => edit(row)} disabled={!row.id}>Edit</button>
                      <button
                        type="button"
                        className="small dangerButton"
                        onClick={() => row.id && confirm("Delete this record?") && deleteMutation.mutate(row.id)}
                        disabled={!row.id}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function format(value: unknown) {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (value && typeof value === "object") return "object";
  return String(value ?? "");
}




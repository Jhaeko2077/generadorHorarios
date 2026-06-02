import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { endpoints, list } from "../api/academic";
import { generateSchedule } from "../api/schedules";
import StatusBadge from "../components/StatusBadge";

const defaultWeights = {
  teacher_discouraged_slot: 30,
  teacher_non_preferred_slot: 8,
  teacher_gap: 15,
  section_gap: 20,
  late_block: 5,
  lab_scarcity: 25,
  teacher_daily_concentration: 8,
  fairness: 10,
  diversity_repetition: 12,
  target_load_balance: 5
};

export default function GenerateSchedulePage() {
  const terms = useQuery({ queryKey: ["terms"], queryFn: () => list<any>(endpoints.terms) });
  const [advanced, setAdvanced] = useState(false);
  const [weights, setWeights] = useState(defaultWeights);
  const [form, setForm] = useState({ academic_term_id: "", random_seed: 42, max_seconds: 20, candidate_count: 3, respect_manual_locks: true, publish_on_success: false });
  const mutation = useMutation({ mutationFn: generateSchedule });
  const termId = form.academic_term_id || terms.data?.[0]?.id || "";
  return (
    <div>
      <h1>Generar horario</h1>
      <form className="panel formGrid" onSubmit={(event) => { event.preventDefault(); mutation.mutate({ ...form, academic_term_id: termId, weights }); }}>
        <label className="field"><span>Periodo academico</span><select value={termId} onChange={(event) => setForm({ ...form, academic_term_id: event.target.value })}>{terms.data?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label className="field"><span>Semilla aleatoria</span><input type="number" value={form.random_seed} onChange={(e) => setForm({ ...form, random_seed: Number(e.target.value) })} /></label>
        <label className="field"><span>Segundos maximos</span><input type="number" value={form.max_seconds} onChange={(e) => setForm({ ...form, max_seconds: Number(e.target.value) })} /></label>
        <label className="field"><span>Candidatos</span><input type="number" value={form.candidate_count} onChange={(e) => setForm({ ...form, candidate_count: Number(e.target.value) })} /></label>
        <label className="field checkbox"><input type="checkbox" checked={form.respect_manual_locks} onChange={(e) => setForm({ ...form, respect_manual_locks: e.target.checked })} />Respetar bloqueos manuales</label>
        <label className="field checkbox"><input type="checkbox" checked={form.publish_on_success} onChange={(e) => setForm({ ...form, publish_on_success: e.target.checked })} />Publicar si tiene exito</label>
        <button>Generar horario con OR-Tools</button>
      </form>
      <section className="panel">
        <button className="secondary" onClick={() => setAdvanced((value) => !value)}>{advanced ? "Ocultar" : "Mostrar"} pesos avanzados de optimizacion</button>
        {advanced && (
          <div>
            <p>Un peso mas alto hace que el optimizador evite con mas fuerza esa condicion, siempre respetando las restricciones duras.</p>
            <div className="formGrid compactWeights">
              {Object.entries(weights).map(([key, value]) => (
                <label className="field" key={key}><span>{key}</span><input type="number" value={value} onChange={(event) => setWeights({ ...weights, [key]: Number(event.target.value) })} /></label>
              ))}
            </div>
            <button className="secondary" onClick={() => setWeights(defaultWeights)}>Restaurar valores</button>
          </div>
        )}
      </section>
      {mutation.data && <Result data={mutation.data as any} />}
      {mutation.error && <div className="notice danger">{(mutation.error as Error).message}</div>}
    </div>
  );
}

function Result({ data }: { data: any }) {
  const diagnostics = Array.isArray(data.diagnostics) ? data.diagnostics : [];
  return (
    <section className="panel">
      <h2>Resultado <StatusBadge status={data.status} /></h2>
      <p>Objetivo: {data.objective_value ?? "n/a"} | Penalizacion suave: {data.soft_penalty_score} | Conflictos duros: {data.hard_conflicts_count} | Diversidad: {data.diversity_score ?? "n/a"}</p>
      <a href={`/schedule-runs/${data.schedule_run_id}`}>Abrir ejecucion</a>
      {diagnostics.length ? (
        <div className="diagnosticList">
          <h3>Diagnosticos</h3>
          <ul>
            {diagnostics.map((item: any, index: number) => (
              <li key={`${item.conflict_type || "diagnostic"}-${index}`}>
                <strong>{item.conflict_type || item.type || "diagnostico"}:</strong> {diagnosticMessage(item)}
                {item.severity ? <span className="diagnosticMeta"> severidad: {item.severity}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function diagnosticMessage(item: any) {
  if (typeof item === "string") return item;
  if (item?.message) return item.message;
  if (item?.detail) return item.detail;
  return JSON.stringify(item);
}

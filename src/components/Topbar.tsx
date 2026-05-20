import { format } from "date-fns";

export function Topbar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Generador Vida y Ministerio - Umachiri</h1>
        <p className="text-sm text-slate-500">Panel interno de asignaciones semanales</p>
      </div>
      <div className="text-sm text-slate-500">{format(new Date(), "dd/MM/yyyy")}</div>
    </header>
  );
}

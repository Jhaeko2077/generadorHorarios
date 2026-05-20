import Link from "next/link";
import { format } from "date-fns";

import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { WeekStatusBadge } from "@/components/WeekStatusBadge";
import { NextWeekButton } from "@/components/NextWeekButton";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SemanasPage() {
  const weeks = await prisma.meetingWeek.findMany({ orderBy: { weekStart: "desc" } });

  return (
    <div>
      <PageHeader
        title="Semanas"
        description="Listado de semanas y acciones"
        actions={<Link href="/semanas/nueva" className="rounded-md bg-blue-700 px-4 py-2 text-sm text-white">Nueva semana</Link>}
      />

      <DataTable headers={["Inicio", "Fin", "Reunion", "Lectura", "Estado", "Acciones"]}>
        {weeks.map((week) => (
          <tr key={week.id} className="border-t border-slate-100">
            <td className="px-4 py-3">{format(week.weekStart, "dd/MM/yyyy")}</td>
            <td className="px-4 py-3">{format(week.weekEnd, "dd/MM/yyyy")}</td>
            <td className="px-4 py-3">{format(week.meetingDate, "dd/MM/yyyy")}</td>
            <td className="px-4 py-3">{week.bibleReading ?? "-"}</td>
            <td className="px-4 py-3"><WeekStatusBadge status={week.status} /></td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <Link href={`/semanas/${week.id}/editar`} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">Editar</Link>
                <Link href={`/semanas/${week.id}/preview`} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">Vista previa</Link>
                <a href={`/api/semanas/${week.id}/export-docx`} className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">Descargar Word</a>
                <NextWeekButton weekId={week.id} />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

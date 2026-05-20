import Link from "next/link";
import { format } from "date-fns";

import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalMembers, totalGroups, totalCategories, latestWeek, nextDraft] = await Promise.all([
    prisma.member.count({ where: { active: true } }),
    prisma.group.count(),
    prisma.category.count(),
    prisma.meetingWeek.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.meetingWeek.findFirst({ where: { status: "draft" }, orderBy: { weekStart: "asc" } }),
  ]);

  const cards = [
    { label: "Hermanos activos", value: totalMembers },
    { label: "Grupos", value: totalGroups },
    { label: "Categorias", value: totalCategories },
    { label: "Ultima semana", value: latestWeek ? format(latestWeek.weekStart, "dd/MM/yyyy") : "-" },
    { label: "Proxima pendiente", value: nextDraft ? format(nextDraft.weekStart, "dd/MM/yyyy") : "-" },
  ];

  return (
    <div>
      <PageHeader
        title="Vida y Ministerio - Umachiri"
        description="Resumen general y accesos rapidos"
        actions={<Link href="/semanas/nueva" className="rounded-md bg-blue-700 px-4 py-2 text-sm text-white">Nueva semana</Link>}
      />

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {["/semanas/nueva", "/semanas", "/hermanos", "/grupos", "/categorias", "/templates"].map((href, index) => {
          const labels = ["Nueva semana", "Semanas", "Hermanos", "Grupos", "Categorias", "Plantilla Word"];
          return (
            <Link key={href} href={href} className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300">
              {labels[index]}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-800">{card.value}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";

import { deleteMemberAction, deactivateMemberAction } from "@/app/actions/members";
import { DataTable } from "@/components/DataTable";
import { MemberForm } from "@/components/MemberForm";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HermanosPage() {
  const [members, groups, categories] = await Promise.all([
    prisma.member.findMany({
      include: {
        group: true,
        categories: { include: { category: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.group.findMany({ where: { active: true }, orderBy: { prefixNumber: "asc" } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Hermanos" description="CRUD de hermanos y codigos" />

      <div className="mb-6">
        <MemberForm
          groups={groups.map((group) => ({ id: group.id, name: group.name, prefixNumber: group.prefixNumber }))}
          categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        />
      </div>

      <DataTable headers={["Codigo", "Nombre", "Grupo", "Categorias", "Estado", "Acciones"]}>
        {members.map((member) => (
          <tr key={member.id} className="border-t border-slate-100">
            <td className="px-4 py-3">{member.code}</td>
            <td className="px-4 py-3">{member.fullName}</td>
            <td className="px-4 py-3">{member.group.name}</td>
            <td className="px-4 py-3 text-xs text-slate-600">
              {member.categories.map((item) => item.category.name).join(", ")}
            </td>
            <td className="px-4 py-3">{member.active ? "Activo" : "Inactivo"}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <Link href={`/hermanos/${member.id}/editar`} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  Editar
                </Link>
                <form action={deactivateMemberAction.bind(null, member.id)}>
                  <button className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700">Desactivar</button>
                </form>
                <form action={deleteMemberAction.bind(null, member.id)}>
                  <button className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">Borrar</button>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

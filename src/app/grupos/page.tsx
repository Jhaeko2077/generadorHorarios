import Link from "next/link";

import { deleteGroupAction } from "@/app/actions/groups";
import { DataTable } from "@/components/DataTable";
import { GroupForm } from "@/components/GroupForm";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  const groups = await prisma.group.findMany({
    include: {
      _count: {
        select: { members: true },
      },
    },
    orderBy: { prefixNumber: "asc" },
  });

  return (
    <div>
      <PageHeader title="Grupos" description="CRUD de grupos principales" />
      <div className="mb-6">
        <GroupForm />
      </div>

      <DataTable headers={["Nombre", "Prefijo", "Descripcion", "Hermanos", "Estado", "Acciones"]}>
        {groups.map((group) => (
          <tr key={group.id} className="border-t border-slate-100">
            <td className="px-4 py-3">{group.name}</td>
            <td className="px-4 py-3">{group.prefixNumber}</td>
            <td className="px-4 py-3">{group.description ?? "-"}</td>
            <td className="px-4 py-3">{group._count.members}</td>
            <td className="px-4 py-3">{group.active ? "Activo" : "Inactivo"}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <Link href={`/grupos/${group.id}/editar`} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  Editar
                </Link>
                <form action={deleteGroupAction.bind(null, group.id)}>
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

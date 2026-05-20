import Link from "next/link";

import { deleteCategoryAction } from "@/app/actions/categories";
import { CategoryForm } from "@/components/CategoryForm";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { members: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Categorias" description="Subgrupos y categorias editables" />
      <div className="mb-6">
        <CategoryForm />
      </div>

      <DataTable headers={["Nombre", "Descripcion", "Miembros", "Estado", "Acciones"]}>
        {categories.map((category) => (
          <tr key={category.id} className="border-t border-slate-100">
            <td className="px-4 py-3">{category.name}</td>
            <td className="px-4 py-3">{category.description ?? "-"}</td>
            <td className="px-4 py-3">{category._count.members}</td>
            <td className="px-4 py-3">{category.active ? "Activa" : "Inactiva"}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <Link href={`/categorias/${category.id}/editar`} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  Editar
                </Link>
                <form action={deleteCategoryAction.bind(null, category.id)}>
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

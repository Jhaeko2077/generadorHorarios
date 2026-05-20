import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/CategoryForm";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditarCategoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={`Editar ${category.name}`} />
      <CategoryForm
        initialData={{
          id: category.id,
          name: category.name,
          description: category.description ?? "",
          active: category.active,
        }}
      />
    </div>
  );
}

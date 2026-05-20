import { notFound } from "next/navigation";

import { MemberForm } from "@/components/MemberForm";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditarHermanoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [member, groups, categories] = await Promise.all([
    prisma.member.findUnique({
      where: { id },
      include: { categories: true },
    }),
    prisma.group.findMany({ where: { active: true }, orderBy: { prefixNumber: "asc" } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!member) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={`Editar: ${member.fullName}`} description="Actualiza datos del hermano" />
      <MemberForm
        groups={groups.map((group) => ({ id: group.id, name: group.name, prefixNumber: group.prefixNumber }))}
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        initialData={{
          id: member.id,
          fullName: member.fullName,
          code: member.code,
          groupId: member.groupId,
          notes: member.notes ?? "",
          active: member.active,
          categoryIds: member.categories.map((item) => item.categoryId),
        }}
      />
    </div>
  );
}

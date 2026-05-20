import { notFound } from "next/navigation";

import { GroupForm } from "@/components/GroupForm";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditarGrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await prisma.group.findUnique({ where: { id } });

  if (!group) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={`Editar ${group.name}`} />
      <GroupForm
        initialData={{
          id: group.id,
          name: group.name,
          prefixNumber: group.prefixNumber,
          description: group.description ?? "",
          active: group.active,
        }}
      />
    </div>
  );
}

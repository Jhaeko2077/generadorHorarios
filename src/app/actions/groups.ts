"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { groupSchema, type GroupInput } from "@/lib/validation";

export async function upsertGroupAction(rawData: GroupInput) {
  const parsed = groupSchema.safeParse(rawData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const data = parsed.data;
  const existing = await prisma.group.findFirst({
    where: {
      prefixNumber: data.prefixNumber,
      NOT: data.id ? { id: data.id } : undefined,
    },
  });

  if (existing) {
    return { ok: false, message: "prefixNumber ya existe" };
  }

  if (data.id) {
    await prisma.group.update({
      where: { id: data.id },
      data: {
        name: data.name,
        prefixNumber: data.prefixNumber,
        description: data.description,
        active: data.active,
      },
    });
  } else {
    await prisma.group.create({
      data: {
        name: data.name,
        prefixNumber: data.prefixNumber,
        description: data.description,
        active: data.active,
      },
    });
  }

  revalidatePath("/grupos");
  revalidatePath("/hermanos");
  return { ok: true };
}

export async function deleteGroupAction(id: string) {
  const memberCount = await prisma.member.count({ where: { groupId: id, active: true } });
  if (memberCount > 0) {
    await prisma.group.update({ where: { id }, data: { active: false } });
    revalidatePath("/grupos");
    return { ok: true, softDeleted: true };
  }

  await prisma.group.delete({ where: { id } });
  revalidatePath("/grupos");
  return { ok: true, softDeleted: false };
}

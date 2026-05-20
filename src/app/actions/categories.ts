"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { categorySchema, type CategoryInput } from "@/lib/validation";

export async function upsertCategoryAction(rawData: CategoryInput) {
  const parsed = categorySchema.safeParse(rawData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const data = parsed.data;

  const existing = await prisma.category.findFirst({
    where: {
      name: data.name,
      NOT: data.id ? { id: data.id } : undefined,
    },
  });

  if (existing) {
    return { ok: false, message: "La categoria ya existe" };
  }

  if (data.id) {
    await prisma.category.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        active: data.active,
      },
    });
  } else {
    await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        active: data.active,
      },
    });
  }

  revalidatePath("/categorias");
  revalidatePath("/hermanos");
  return { ok: true };
}

export async function deleteCategoryAction(id: string) {
  const memberLinkCount = await prisma.memberCategory.count({ where: { categoryId: id } });

  if (memberLinkCount > 0) {
    await prisma.category.update({ where: { id }, data: { active: false } });
    revalidatePath("/categorias");
    return { ok: true, softDeleted: true };
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/categorias");
  return { ok: true, softDeleted: false };
}

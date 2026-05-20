"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { memberSchema, type MemberInput } from "@/lib/validation";
import { generateNextMemberCode } from "@/lib/members/service";

export async function suggestMemberCodeAction(groupId: string) {
  return generateNextMemberCode(groupId);
}

export async function upsertMemberAction(rawData: MemberInput) {
  const parsed = memberSchema.safeParse(rawData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const data = parsed.data;

  const existing = await prisma.member.findFirst({
    where: {
      code: data.code,
      NOT: data.id ? { id: data.id } : undefined,
    },
  });

  if (existing) {
    return { ok: false, message: "El codigo ya existe" };
  }

  if (data.id) {
    await prisma.member.update({
      where: { id: data.id },
      data: {
        fullName: data.fullName,
        code: data.code,
        groupId: data.groupId,
        notes: data.notes,
        active: data.active,
      },
    });

    await prisma.memberCategory.deleteMany({ where: { memberId: data.id } });
    if (data.categoryIds.length > 0) {
      await prisma.memberCategory.createMany({
        data: data.categoryIds.map((categoryId) => ({ memberId: data.id!, categoryId })),
      });
    }
  } else {
    const created = await prisma.member.create({
      data: {
        fullName: data.fullName,
        code: data.code,
        groupId: data.groupId,
        notes: data.notes,
        active: data.active,
      },
    });

    if (data.categoryIds.length > 0) {
      await prisma.memberCategory.createMany({
        data: data.categoryIds.map((categoryId) => ({ memberId: created.id, categoryId })),
      });
    }
  }

  revalidatePath("/hermanos");
  revalidatePath("/semanas");
  return { ok: true };
}

export async function deactivateMemberAction(id: string) {
  await prisma.member.update({
    where: { id },
    data: { active: false },
  });
  revalidatePath("/hermanos");
}

export async function deleteMemberAction(id: string) {
  const assignmentCount = await prisma.assignment.count({ where: { memberId: id } });
  if (assignmentCount > 0) {
    await prisma.member.update({ where: { id }, data: { active: false } });
    revalidatePath("/hermanos");
    return { ok: true, softDeleted: true };
  }

  await prisma.memberCategory.deleteMany({ where: { memberId: id } });
  await prisma.member.delete({ where: { id } });
  revalidatePath("/hermanos");
  return { ok: true, softDeleted: false };
}

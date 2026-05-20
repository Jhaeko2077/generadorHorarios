import { prisma } from "@/lib/prisma";

export async function generateNextMemberCode(groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw new Error("Grupo no encontrado");
  }

  const members = await prisma.member.findMany({
    where: { groupId },
    select: { code: true },
  });

  const prefix = String(group.prefixNumber);
  const maxCorrelative = members.reduce((max, member) => {
    if (!member.code.startsWith(prefix)) {
      return max;
    }

    const suffix = Number(member.code.slice(prefix.length));
    if (Number.isNaN(suffix)) {
      return max;
    }

    return Math.max(max, suffix);
  }, 0);

  const nextCorrelative = String(maxCorrelative + 1).padStart(2, "0");
  return `${prefix}${nextCorrelative}`;
}

export async function findMemberByCode(code: string) {
  return prisma.member.findUnique({
    where: { code },
    include: {
      group: true,
      categories: { include: { category: true } },
    },
  });
}

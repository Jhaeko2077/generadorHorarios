import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_BASE_PARTS, nextWeekDates } from "@/lib/meetings/baseStructure";

export async function createWeekWithBaseStructure(data: {
  congregationId: string;
  weekStart: Date;
  weekEnd: Date;
  meetingDate: Date;
  sourceUrl?: string | null;
  bibleReading?: string | null;
  openingSong?: string | null;
  middleSong?: string | null;
  closingSong?: string | null;
  notes?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const week = await tx.meetingWeek.create({
      data,
    });

    await tx.meetingPart.createMany({
      data: DEFAULT_BASE_PARTS.map((part, index) => ({
        meetingWeekId: week.id,
        section: part.section,
        partNumber: index + 1,
        title: part.title,
        durationMinutes: part.durationMinutes,
        reference: part.reference,
        orderIndex: index + 1,
        requiresTwoRooms: part.requiresTwoRooms ?? false,
        assignmentMode: part.assignmentMode,
      })),
    });

    return week;
  });
}

export async function duplicateAsNextWeek(meetingWeekId: string) {
  return prisma.$transaction(async (tx) => {
    const sourceWeek = await tx.meetingWeek.findUnique({
      where: { id: meetingWeekId },
      include: { parts: { orderBy: { orderIndex: "asc" } } },
    });

    if (!sourceWeek) {
      throw new Error("Semana no encontrada");
    }

    const nextDates = nextWeekDates(sourceWeek.weekStart, sourceWeek.weekEnd, sourceWeek.meetingDate);

    const newWeek = await tx.meetingWeek.create({
      data: {
        congregationId: sourceWeek.congregationId,
        weekStart: nextDates.weekStart,
        weekEnd: nextDates.weekEnd,
        meetingDate: nextDates.meetingDate,
        sourceUrl: null,
        bibleReading: sourceWeek.bibleReading,
        openingSong: sourceWeek.openingSong,
        middleSong: sourceWeek.middleSong,
        closingSong: sourceWeek.closingSong,
        notes: sourceWeek.notes,
        status: "draft",
      },
    });

    if (sourceWeek.parts.length > 0) {
      await tx.meetingPart.createMany({
        data: sourceWeek.parts.map((part) => ({
          meetingWeekId: newWeek.id,
          section: part.section,
          partNumber: part.partNumber,
          title: part.title,
          durationMinutes: part.durationMinutes,
          reference: part.reference,
          orderIndex: part.orderIndex,
          requiresTwoRooms: part.requiresTwoRooms,
          assignmentMode: part.assignmentMode,
          notes: part.notes,
        })),
      });
    }

    return newWeek;
  });
}

export async function getWeekFullDetail(id: string) {
  return prisma.meetingWeek.findUnique({
    where: { id },
    include: {
      congregation: true,
      parts: {
        orderBy: { orderIndex: "asc" },
      },
      assignments: {
        include: {
          member: true,
          meetingPart: true,
        },
      },
    },
  });
}

export async function upsertAssignmentByCode(data: {
  meetingWeekId: string;
  meetingPartId?: string | null;
  role: string;
  room?: "SALA_1" | "SALA_2" | "SALA_B" | "GENERAL" | null;
  memberCode: string;
}) {
  const member = await prisma.member.findUnique({
    where: { code: data.memberCode },
  });

  if (!member) {
    throw new Error("Codigo no existe");
  }

  const where: Prisma.AssignmentWhereInput = {
    meetingWeekId: data.meetingWeekId,
    role: data.role,
    room: data.room ?? null,
    meetingPartId: data.meetingPartId ?? null,
  };

  const existing = await prisma.assignment.findFirst({ where });

  if (existing) {
    return prisma.assignment.update({
      where: { id: existing.id },
      data: {
        memberId: member.id,
        memberCodeSnapshot: member.code,
        memberNameSnapshot: member.fullName,
      },
    });
  }

  return prisma.assignment.create({
    data: {
      meetingWeekId: data.meetingWeekId,
      meetingPartId: data.meetingPartId ?? null,
      role: data.role,
      room: data.room ?? null,
      memberId: member.id,
      memberCodeSnapshot: member.code,
      memberNameSnapshot: member.fullName,
    },
  });
}

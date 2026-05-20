"use server";

import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { weekSchema, meetingPartSchema, assignmentSchema, type WeekInput, type MeetingPartInput, type AssignmentInput } from "@/lib/validation";
import { createWeekWithBaseStructure, duplicateAsNextWeek, upsertAssignmentByCode } from "@/lib/meetings/service";

export async function createWeekAction(rawData: WeekInput) {
  const parsed = weekSchema.safeParse(rawData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const data = parsed.data;
  const congregation = await prisma.congregation.findFirst({ where: { code: "2071" } });

  if (!congregation) {
    return { ok: false, message: "Congregacion UMACHIRI no existe. Ejecuta seed." };
  }

  const week = await createWeekWithBaseStructure({
    congregationId: congregation.id,
    weekStart: new Date(data.weekStart),
    weekEnd: new Date(data.weekEnd),
    meetingDate: new Date(data.meetingDate),
    sourceUrl: data.sourceUrl || null,
    bibleReading: data.bibleReading,
    openingSong: data.openingSong,
    middleSong: data.middleSong,
    closingSong: data.closingSong,
    notes: data.notes,
  });

  revalidatePath("/semanas");
  return { ok: true, id: week.id };
}

export async function updateWeekMetaAction(rawData: WeekInput & { id: string }) {
  const parsed = weekSchema.extend({ id: z.string() }).safeParse(rawData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const data = parsed.data;

  await prisma.meetingWeek.update({
    where: { id: data.id },
    data: {
      weekStart: new Date(data.weekStart),
      weekEnd: new Date(data.weekEnd),
      meetingDate: new Date(data.meetingDate),
      sourceUrl: data.sourceUrl || null,
      bibleReading: data.bibleReading,
      openingSong: data.openingSong,
      middleSong: data.middleSong,
      closingSong: data.closingSong,
      notes: data.notes,
    },
  });

  revalidatePath(`/semanas/${data.id}/editar`);
  revalidatePath(`/semanas/${data.id}/preview`);
  revalidatePath("/semanas");
  return { ok: true };
}

export async function duplicateNextWeekAction(weekId: string) {
  const week = await duplicateAsNextWeek(weekId);
  revalidatePath("/semanas");
  return { ok: true, id: week.id };
}

export async function saveMeetingPartAction(rawData: MeetingPartInput) {
  const parsed = meetingPartSchema.safeParse(rawData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Parte invalida" };
  }

  const data = parsed.data;

  if (data.id) {
    await prisma.meetingPart.update({
      where: { id: data.id },
      data: {
        section: data.section,
        partNumber: data.partNumber,
        title: data.title,
        durationMinutes: data.durationMinutes,
        reference: data.reference,
        orderIndex: data.orderIndex,
        requiresTwoRooms: data.requiresTwoRooms,
        assignmentMode: data.assignmentMode,
        notes: data.notes,
      },
    });
  } else {
    await prisma.meetingPart.create({
      data: {
        meetingWeekId: data.meetingWeekId,
        section: data.section,
        partNumber: data.partNumber,
        title: data.title,
        durationMinutes: data.durationMinutes,
        reference: data.reference,
        orderIndex: data.orderIndex,
        requiresTwoRooms: data.requiresTwoRooms,
        assignmentMode: data.assignmentMode,
        notes: data.notes,
      },
    });
  }

  revalidatePath(`/semanas/${data.meetingWeekId}/editar`);
  revalidatePath(`/semanas/${data.meetingWeekId}/preview`);
  return { ok: true };
}

export async function deleteMeetingPartAction(partId: string, meetingWeekId: string) {
  await prisma.meetingPart.delete({ where: { id: partId } });
  revalidatePath(`/semanas/${meetingWeekId}/editar`);
  revalidatePath(`/semanas/${meetingWeekId}/preview`);
  return { ok: true };
}

export async function saveAssignmentAction(rawData: AssignmentInput) {
  const parsed = assignmentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Asignacion invalida" };
  }

  const data = parsed.data;

  try {
    await upsertAssignmentByCode({
      meetingWeekId: data.meetingWeekId,
      meetingPartId: data.meetingPartId,
      role: data.role,
      room: data.room,
      memberCode: data.memberCode,
    });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo guardar" };
  }

  revalidatePath(`/semanas/${data.meetingWeekId}/editar`);
  revalidatePath(`/semanas/${data.meetingWeekId}/preview`);
  return { ok: true };
}

export async function createNextWeekQuickAction(weekId: string) {
  const source = await prisma.meetingWeek.findUnique({ where: { id: weekId } });
  if (!source) {
    return { ok: false, message: "Semana no encontrada" };
  }

  const congregationId = source.congregationId;
  const result = await createWeekWithBaseStructure({
    congregationId,
    weekStart: addDays(source.weekStart, 7),
    weekEnd: addDays(source.weekEnd, 7),
    meetingDate: addDays(source.meetingDate, 7),
    bibleReading: source.bibleReading,
    openingSong: source.openingSong,
    middleSong: source.middleSong,
    closingSong: source.closingSong,
    notes: source.notes,
  });

  revalidatePath("/semanas");
  return { ok: true, id: result.id };
}

import { z } from "zod";

export const memberSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(2, "Nombre requerido"),
  code: z.string().min(1, "Codigo requerido"),
  groupId: z.string().min(1, "Grupo requerido"),
  categoryIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
  active: z.boolean().default(true),
});

export const groupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nombre requerido"),
  prefixNumber: z.coerce.number().int().min(1).max(9),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nombre requerido"),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export const weekSchema = z.object({
  id: z.string().optional(),
  weekStart: z.string().min(1),
  weekEnd: z.string().min(1),
  meetingDate: z.string().min(1),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  bibleReading: z.string().optional(),
  openingSong: z.string().optional(),
  middleSong: z.string().optional(),
  closingSong: z.string().optional(),
  notes: z.string().optional(),
});

export const meetingPartSchema = z.object({
  id: z.string().optional(),
  meetingWeekId: z.string(),
  section: z.enum(["TESOROS", "MAESTROS", "VIDA_CRISTIANA", "OTROS"]),
  partNumber: z.coerce.number().int().nullable().optional(),
  title: z.string().min(1),
  durationMinutes: z.coerce.number().int().min(0).nullable().optional(),
  reference: z.string().optional(),
  orderIndex: z.coerce.number().int().min(0),
  requiresTwoRooms: z.boolean().default(false),
  assignmentMode: z.enum([
    "single",
    "two_rooms_single_person",
    "two_rooms_pair",
    "conductor_reader",
    "none",
  ]),
  notes: z.string().optional(),
});

export const assignmentSchema = z.object({
  meetingWeekId: z.string(),
  meetingPartId: z.string().optional().nullable(),
  role: z.string().min(1),
  room: z.enum(["SALA_1", "SALA_2", "SALA_B", "GENERAL"]).optional().nullable(),
  memberCode: z.string().min(1, "Codigo requerido"),
});

export type MemberInput = z.infer<typeof memberSchema>;
export type GroupInput = z.infer<typeof groupSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type WeekInput = z.infer<typeof weekSchema>;
export type MeetingPartInput = z.infer<typeof meetingPartSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;

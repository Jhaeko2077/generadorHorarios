import { format } from "date-fns";

import { getWeekFullDetail } from "@/lib/meetings/service";

type TemplateData = Record<string, string | number | null>;

function findAssignmentName(
  week: NonNullable<Awaited<ReturnType<typeof getWeekFullDetail>>>,
  role: string,
  room?: "SALA_1" | "SALA_2" | "SALA_B" | "GENERAL"
) {
  const assignment = week.assignments.find((item) => item.role === role && (room ? item.room === room : true));
  return assignment?.memberNameSnapshot ?? "";
}

export async function meetingTemplateMapper(meetingWeekId: string): Promise<TemplateData> {
  const week = await getWeekFullDetail(meetingWeekId);

  if (!week) {
    throw new Error("Semana no encontrada");
  }

  const treasures = week.parts.filter((part) => part.section === "TESOROS");
  const masters = week.parts.filter((part) => part.section === "MAESTROS");
  const christianLife = week.parts.filter((part) => part.section === "VIDA_CRISTIANA");

  return {
    congregation_name: week.congregation.name,
    congregation_code: week.congregation.code,
    week_date_label: `${format(week.weekStart, "dd/MM/yyyy")} - ${format(week.weekEnd, "dd/MM/yyyy")}`,
    meeting_date_label: format(week.meetingDate, "dd/MM/yyyy"),
    bible_reading: week.bibleReading ?? "",
    opening_song: week.openingSong ?? "",
    middle_song: week.middleSong ?? "",
    closing_song: week.closingSong ?? "",
    chairman_name: findAssignmentName(week, "Presidente"),
    opening_prayer_name: findAssignmentName(week, "Oracion inicial"),
    closing_prayer_name: findAssignmentName(week, "Oracion final"),
    cleaning_group: findAssignmentName(week, "Limpieza"),
    attendants: findAssignmentName(week, "Acomodadores"),
    treasures_part_1_title: treasures[0]?.title ?? "",
    treasures_part_1_duration: treasures[0]?.durationMinutes ?? "",
    treasures_part_1_speaker: findAssignmentName(week, "Tesoros"),
    spiritual_gems_speaker: findAssignmentName(week, "Perlas escondidas"),
    bible_reading_reference: treasures[2]?.reference ?? "",
    bible_reading_room_1_name: findAssignmentName(week, "Lectura Biblia", "SALA_1"),
    bible_reading_room_2_name: findAssignmentName(week, "Lectura Biblia", "SALA_2"),
    ministry_part_4_title: masters[0]?.title ?? "",
    ministry_part_4_reference: masters[0]?.reference ?? "",
    ministry_part_4_room_1_student: findAssignmentName(week, "MM4 Estudiante", "SALA_1"),
    ministry_part_4_room_1_assistant: findAssignmentName(week, "MM4 Ayudante", "SALA_1"),
    ministry_part_4_room_2_student: findAssignmentName(week, "MM4 Estudiante", "SALA_2"),
    ministry_part_4_room_2_assistant: findAssignmentName(week, "MM4 Ayudante", "SALA_2"),
    ministry_part_5_title: masters[1]?.title ?? "",
    ministry_part_5_reference: masters[1]?.reference ?? "",
    ministry_part_5_room_1_student: findAssignmentName(week, "MM5 Estudiante", "SALA_1"),
    ministry_part_5_room_1_assistant: findAssignmentName(week, "MM5 Ayudante", "SALA_1"),
    ministry_part_5_room_2_student: findAssignmentName(week, "MM5 Estudiante", "SALA_2"),
    ministry_part_5_room_2_assistant: findAssignmentName(week, "MM5 Ayudante", "SALA_2"),
    ministry_part_6_title: masters[2]?.title ?? "",
    ministry_part_6_reference: masters[2]?.reference ?? "",
    ministry_part_6_room_1_student: findAssignmentName(week, "MM6 Estudiante", "SALA_1"),
    ministry_part_6_room_1_assistant: findAssignmentName(week, "MM6 Ayudante", "SALA_1"),
    ministry_part_6_room_2_student: findAssignmentName(week, "MM6 Estudiante", "SALA_2"),
    ministry_part_6_room_2_assistant: findAssignmentName(week, "MM6 Ayudante", "SALA_2"),
    christian_life_part_7_title: christianLife[0]?.title ?? "",
    christian_life_part_7_speaker: findAssignmentName(week, "Vida Cristiana"),
    congregation_bible_study_reference: christianLife[1]?.reference ?? "",
    congregation_bible_study_conductor: findAssignmentName(week, "Conductor"),
    congregation_bible_study_reader: findAssignmentName(week, "Lector"),
  };
}

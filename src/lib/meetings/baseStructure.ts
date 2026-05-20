import { addDays } from "date-fns";

export type BasePartSeed = {
  section: "TESOROS" | "MAESTROS" | "VIDA_CRISTIANA" | "OTROS";
  title: string;
  durationMinutes: number | null;
  reference?: string;
  requiresTwoRooms?: boolean;
  assignmentMode: "single" | "two_rooms_single_person" | "two_rooms_pair" | "conductor_reader" | "none";
};

export const DEFAULT_BASE_PARTS: BasePartSeed[] = [
  { section: "OTROS", title: "Presidente", durationMinutes: null, assignmentMode: "single" },
  { section: "OTROS", title: "Oracion inicial", durationMinutes: null, assignmentMode: "single" },
  { section: "OTROS", title: "Cancion inicial e introduccion", durationMinutes: 5, assignmentMode: "none" },
  { section: "TESOROS", title: "Tesoros de la Biblia", durationMinutes: 10, assignmentMode: "single" },
  { section: "TESOROS", title: "Busquemos perlas escondidas", durationMinutes: 10, assignmentMode: "single" },
  { section: "TESOROS", title: "Lectura de la Biblia", durationMinutes: 4, assignmentMode: "two_rooms_single_person", requiresTwoRooms: true },
  { section: "MAESTROS", title: "Seamos Mejores Maestros parte 4", durationMinutes: 5, assignmentMode: "two_rooms_pair", requiresTwoRooms: true },
  { section: "MAESTROS", title: "Seamos Mejores Maestros parte 5", durationMinutes: 5, assignmentMode: "two_rooms_pair", requiresTwoRooms: true },
  { section: "MAESTROS", title: "Seamos Mejores Maestros parte 6", durationMinutes: 5, assignmentMode: "two_rooms_pair", requiresTwoRooms: true },
  { section: "OTROS", title: "Cancion intermedia", durationMinutes: 3, assignmentMode: "none" },
  { section: "VIDA_CRISTIANA", title: "Nuestra Vida Cristiana parte 7", durationMinutes: 15, assignmentMode: "single" },
  { section: "VIDA_CRISTIANA", title: "Estudio biblico de la congregacion", durationMinutes: 30, assignmentMode: "conductor_reader" },
  { section: "OTROS", title: "Palabras de conclusion y cancion final", durationMinutes: 5, assignmentMode: "none" },
  { section: "OTROS", title: "Oracion final", durationMinutes: null, assignmentMode: "single" },
  { section: "OTROS", title: "Acomodadores", durationMinutes: null, assignmentMode: "single" },
  { section: "OTROS", title: "Limpieza", durationMinutes: null, assignmentMode: "single" },
];

export function nextWeekDates(weekStart: Date, weekEnd: Date, meetingDate: Date) {
  return {
    weekStart: addDays(weekStart, 7),
    weekEnd: addDays(weekEnd, 7),
    meetingDate: addDays(meetingDate, 7),
  };
}

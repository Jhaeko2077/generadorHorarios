import { api } from "./client";

export const endpoints = {
  terms: "/academic-terms",
  programs: "/programs",
  cycles: "/cycles",
  sections: "/sections",
  courses: "/courses",
  rooms: "/rooms",
  slots: "/time-slots",
  offerings: "/course-offerings",
  teachers: "/teachers",
  locks: "/manual-locks"
};

export function list<T>(path: string) {
  return api<T[]>(path);
}

export function create<T>(path: string, payload: unknown) {
  return api<T>(path, { method: "POST", body: JSON.stringify(payload) });
}

export function update<T>(path: string, id: string, payload: unknown) {
  return api<T>(`${path}/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function remove(path: string, id: string) {
  return api<{ ok: boolean }>(`${path}/${id}`, { method: "DELETE" });
}

export function bulkGenerateSlots() {
  return api<{ created: number }>("/time-slots/bulk-generate", { method: "POST" });
}

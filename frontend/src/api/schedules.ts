import { api } from "./client";
import type { Recommendation, ScheduleRun } from "../types/schedule";

export function generateSchedule(payload: unknown) {
  return api<any>("/schedule-runs/generate", { method: "POST", body: JSON.stringify(payload) });
}

export function scheduleRuns() {
  return api<ScheduleRun[]>("/schedule-runs");
}

export function scheduleRun(id: string) {
  return api<ScheduleRun>(`/schedule-runs/${id}`);
}

export function mySchedule() {
  return api<{ schedule_run: ScheduleRun | null; groups: unknown[]; assignments: unknown[] }>("/me/schedule");
}

export function assignments(id: string, group: "section" | "teacher" | "room") {
  return api<unknown[]>(`/schedule-runs/${id}/assignments/by-${group}`);
}

export function conflicts(id: string) {
  return api<unknown[]>(`/schedule-runs/${id}/conflicts`);
}

export function publishRun(id: string) {
  return api(`/schedule-runs/${id}/publish`, { method: "POST" });
}

export function deleteRun(id: string) {
  return api<{ ok: boolean }>(`/schedule-runs/${id}`, { method: "DELETE" });
}

export function recommendations(courseOfferingId: string, payload: unknown) {
  return api<Recommendation[]>(`/recommendations/course-offering/${courseOfferingId}`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

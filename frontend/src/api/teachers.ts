import { api } from "./client";
import type { AvailabilityBlock, TeacherProfile } from "../types/teacher";

export function myProfile() {
  return api<TeacherProfile>("/me/teacher-profile");
}

export function updateMyProfile(payload: Partial<TeacherProfile>) {
  return api<TeacherProfile>("/me/teacher-profile", { method: "PUT", body: JSON.stringify(payload) });
}

export function myAvailability() {
  return api<AvailabilityBlock[]>("/me/availability");
}

export function addMyAvailability(payload: Partial<AvailabilityBlock>) {
  return api<AvailabilityBlock>("/me/availability", { method: "POST", body: JSON.stringify(payload) });
}

export function updateAvailability(teacherId: string, availabilityId: string, payload: Partial<AvailabilityBlock>) {
  return api<AvailabilityBlock>(`/teachers/${teacherId}/availability/${availabilityId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteAvailability(teacherId: string, availabilityId: string) {
  return api<{ ok: boolean }>(`/teachers/${teacherId}/availability/${availabilityId}`, {
    method: "DELETE"
  });
}

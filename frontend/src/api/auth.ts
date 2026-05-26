import { api, setToken } from "./client";
import type { LoginRequest, RegisterTeacherRequest, User } from "../types/auth";

export async function login(payload: LoginRequest) {
  const token = await api<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  setToken(token.access_token);
  return me();
}

export function me() {
  return api<User>("/auth/me");
}

export function registerTeacher(payload: RegisterTeacherRequest) {
  return api<User>("/auth/register-teacher", { method: "POST", body: JSON.stringify(payload) });
}

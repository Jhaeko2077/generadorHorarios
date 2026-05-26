const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export type ApiError = { detail?: string };

export function getToken() {
  return localStorage.getItem("ato_token");
}

export function setToken(token: string) {
  localStorage.setItem("ato_token", token);
}

export function clearToken() {
  localStorage.removeItem("ato_token");
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function downloadUrl(path: string) {
  return `${API_BASE}${path}`;
}

import { api } from "./client";

export type AuditLog = {
  id: string;
  created_at: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  before_json?: Record<string, unknown>;
  after_json?: Record<string, unknown>;
};

export function auditLogs() {
  return api<AuditLog[]>("/audit");
}

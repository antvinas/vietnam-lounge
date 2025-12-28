// apps/web/src/features/admin/api/audit/audit.api.ts

import type { AuditLogItem } from "../types";
import { safeGet } from "../http";

export const getAuditLogs = async ({ days = 30, limit = 200, q }: { days?: number; limit?: number; q?: string }) => {
  const raw: any = await safeGet("admin/audit-logs", { days, limit, q });
  const items = Array.isArray(raw) ? (raw as AuditLogItem[]) : Array.isArray(raw?.items) ? (raw.items as AuditLogItem[]) : [];
  return { items };
};

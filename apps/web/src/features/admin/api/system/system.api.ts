// apps/web/src/features/admin/api/system/system.api.ts

import type { SystemHealth } from "../types";
import { safeGet, safePost } from "../http";

export const fetchSystemHealth = async (): Promise<SystemHealth> => {
  return await safeGet("admin/system/health");
};

export const requestCachePurge = async ({
  scope,
  reason,
}: {
  scope: "spots" | "events" | "users" | "ads" | "reports" | "all";
  reason?: string;
}) => {
  return await safePost("admin/system/cache/purge", { scope, reason });
};

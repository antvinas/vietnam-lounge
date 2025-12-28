// apps/web/src/features/admin/api/sponsors/sponsors.api.ts

import type { AdminMode } from "../types";
import { safeGet } from "../http";

export const getExpiringSponsors = async (
  days = 7
): Promise<{ id: string; mode: AdminMode; name: string; sponsorLevel?: string; sponsorExpiry?: string }[]> => {
  return await safeGet("admin/sponsors/expiring", { days });
};

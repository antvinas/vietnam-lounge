// apps/web/src/features/admin/api/reports/reports.api.ts

import type { Report, ReportQueueResponse, ReportStatus } from "../types";
import { clampInt, safeGet, safePost } from "../http";

// ✅ 작업 큐(신고) - 운영용(대량 조회 제거)
export const getReportQueue = async (limit = 5): Promise<ReportQueueResponse> => {
  const lim = clampInt(limit, 1, 20, 5);

  // 1) 서버 endpoint 우선
  try {
    const raw: any = await safeGet("admin/reports/queue", { limit: lim });
    return {
      countPending: Number(raw?.countPending ?? raw?.pending ?? raw?.count ?? 0),
      top: Array.isArray(raw?.top) ? (raw.top as any[]) : [],
    };
  } catch {
    // 2) fallback: /admin/reports 로 최소화 조회
    try {
      const list = await getReports({ status: "pending" });
      const top = Array.isArray(list) ? list.slice(0, lim) : [];
      return { countPending: Array.isArray(list) ? list.length : 0, top };
    } catch {
      return { countPending: 0, top: [] };
    }
  }
};

// ✅ Pending count: /admin/reports/count 우선 사용
export const getPendingReportCount = async (): Promise<number> => {
  try {
    const raw: any = await safeGet("admin/reports/count", { status: "pending" });
    return Number(
      raw?.countPending ??
        raw?.pending ??
        raw?.count ??
        raw?.data?.countPending ??
        raw?.data?.count ??
        0
    );
  } catch {
    try {
      const q = await getReportQueue(1);
      return Number(q?.countPending ?? 0);
    } catch {
      return 0;
    }
  }
};

// --------------------------------------------
// Reports
// --------------------------------------------

export const getReports = async ({ status }: { status: ReportStatus | "all" } = { status: "pending" }) => {
  const params: any = {};
  if (status && status !== "all") params.status = status;
  return await safeGet<Report[]>("admin/reports", params);
};

export const processReport = async (reportId: string, action: "delete" | "dismiss", note?: string) => {
  return await safePost(`admin/reports/${reportId}/process`, { action, note });
};

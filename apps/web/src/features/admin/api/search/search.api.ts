// apps/web/src/features/admin/api/search/search.api.ts

import type {
  AdminSearchParams,
  AdminSearchResponse,
  AdminSearchTab,
  AdminSearchSort,
  AdminSearchModeFilter,
  AdminSearchTotals,
  AdminSearchSpotItem,
  AdminSearchEventItem,
  AdminSearchUserItem,
} from "../types";
import { clampInt, safeGet } from "../http";

function emptySearchResponse(
  p: Required<Pick<AdminSearchResponse, "q" | "tab" | "sort" | "mode" | "role" | "page" | "limit">>
): AdminSearchResponse {
  return {
    ...p,
    totals: { all: 0, spots: 0, events: 0, users: 0 },
    items: { spots: [], events: [], users: [] },
  };
}

// ✅ Admin Search (서버 엔드포인트 호출 전용)
export const searchAdmin = async (params: AdminSearchParams): Promise<AdminSearchResponse> => {
  const q = String(params?.q ?? "").trim();
  const tab = (params?.tab ?? "all") as AdminSearchTab;
  const sort = (params?.sort ?? "relevance") as AdminSearchSort;
  const mode = (params?.mode ?? "all") as AdminSearchModeFilter;
  const role = String(params?.role ?? "all");

  const page = clampInt(params?.page, 1, 9999, 1);
  const limit = clampInt(params?.limit, 1, 50, tab === "all" ? 8 : 20);

  if (!q || q.length < 2) {
    return emptySearchResponse({ q, tab, sort, mode, role, page, limit });
  }

  const raw: any = await safeGet("admin/search", { q, tab, sort, mode, role, page, limit });

  const totalsRaw = raw?.totals ?? raw?.count ?? raw?.counts ?? {};
  const totals: AdminSearchTotals = {
    all: Number(totalsRaw?.all ?? totalsRaw?.total ?? 0),
    spots: Number(totalsRaw?.spots ?? 0),
    events: Number(totalsRaw?.events ?? 0),
    users: Number(totalsRaw?.users ?? 0),
  };

  const itemsRaw = raw?.items ?? raw?.results ?? {};
  const items = {
    spots: Array.isArray(itemsRaw?.spots) ? (itemsRaw.spots as AdminSearchSpotItem[]) : [],
    events: Array.isArray(itemsRaw?.events) ? (itemsRaw.events as AdminSearchEventItem[]) : [],
    users: Array.isArray(itemsRaw?.users) ? (itemsRaw.users as AdminSearchUserItem[]) : [],
  };

  if (!totals.all) totals.all = totals.spots + totals.events + totals.users;

  return {
    q: String(raw?.q ?? q),
    tab: (raw?.tab ?? tab) as AdminSearchTab,
    sort: (raw?.sort ?? sort) as AdminSearchSort,
    mode: (raw?.mode ?? mode) as AdminSearchModeFilter,
    role: String(raw?.role ?? role),
    page: Number(raw?.page ?? page),
    limit: Number(raw?.limit ?? limit),
    totals,
    items,
  };
};

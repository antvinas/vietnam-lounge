// apps/web/src/features/admin/pages/AdminSpotList.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteSpot, getFilteredSpots, updateSpot, type AdminSpotFilter } from "@/features/admin/api/admin.api";
import {
  POPULAR_LOCATIONS,
  SPOT_CATEGORIES,
  normalizeSpotCategory,
  type SpotMode,
  PRICE_LEVEL_LABELS,
  type PriceLevel,
  BUDGET_UNITS,
} from "@/constants/filters";
import { getSpotThumbnailUrl } from "@/types/spot";

function intParam(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function strParam(v: string | null, fallback: string) {
  const s = (v || "").trim();
  return s ? s : fallback;
}

const LIMIT_OPTIONS = [20, 50, 100, 200] as const;
type LimitOption = (typeof LIMIT_OPTIONS)[number];

function normalizeLimit(input: unknown, fallback: LimitOption = 20): LimitOption {
  const n = Number(input);
  if (!Number.isFinite(n)) return fallback;
  const v = Math.trunc(n) as LimitOption;
  return (LIMIT_OPTIONS as readonly number[]).includes(v) ? v : fallback;
}

type SpotStatusTab = "all" | "active" | "draft" | "deleted";

function normalizeSpotStatusTab(v: string | null): SpotStatusTab {
  const s = String(v || "").trim().toLowerCase();
  if (s === "active" || s === "draft" || s === "deleted") return s;
  return "all";
}

/** region 코드 → 운영자용 라벨 */
const REGION_LABELS: Record<string, string> = {
  north: "북부",
  central: "중부",
  south: "남부",
  island: "섬",
};

const locationIdToName = new Map<string, string>(POPULAR_LOCATIONS.map((l) => [l.id, l.name]));

function displayRegion(spot: any): string {
  const locId = String(spot?.locationId ?? "").trim();
  if (locId && locationIdToName.has(locId)) return locationIdToName.get(locId)!;

  const region = String(spot?.region ?? "").trim();
  if (region) return REGION_LABELS[region] ?? region;

  return "-";
}

function normalizeCategoryForFilter(mode: SpotMode, raw: string): string {
  if (!raw || raw === "ALL") return raw;
  return normalizeSpotCategory(mode, raw);
}

function isPriceLevel(v: unknown): v is PriceLevel {
  const n = Number(v);
  return Number.isFinite(n) && [0, 1, 2, 3, 4].includes(Math.trunc(n));
}

function formatVnd(amount: number): string {
  try {
    return `₫${new Intl.NumberFormat("vi-VN").format(amount)}`;
  } catch {
    return `₫${amount}`;
  }
}

function getBudgetUnitLabel(unit: unknown): string {
  const u = String(unit ?? "").trim();
  if (!u) return "";
  const found = BUDGET_UNITS.find((x) => x.value === u);
  return found?.label ?? u;
}

function getSpotRecordStatus(spot: any): Exclude<SpotStatusTab, "all"> {
  const st = String(spot?.status ?? "").trim().toLowerCase();
  if (st === "deleted" || spot?.deletedAt) return "deleted";
  if (st === "draft") return "draft";
  return "active";
}

export default function AdminSpotList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const focusId = (searchParams.get("focus") || "").trim();
  const initialMode = ((searchParams.get("mode") as SpotMode | null) ?? "explorer") as SpotMode;
  const initialRegion = strParam(searchParams.get("region"), "ALL");
  const initialCategoryRaw = strParam(searchParams.get("category"), "ALL");
  const initialCategory = normalizeCategoryForFilter(initialMode, initialCategoryRaw);
  const initialLimit = normalizeLimit(intParam(searchParams.get("limit"), 20), 20);
  const initialQ = (searchParams.get("q") || "").trim();
  const initialCursor = (searchParams.get("cursor") || "").trim() || null;
  const initialStatus = normalizeSpotStatusTab(searchParams.get("status"));

  const [filter, setFilter] = useState<{
    mode: SpotMode;
    status: SpotStatusTab;
    region: string;
    category: string;
    limit: LimitOption;
    searchTerm: string;
    cursor: string | null;
  }>(() => ({
    mode: initialMode,
    status: initialStatus,
    region: initialRegion,
    category: initialCategory,
    limit: initialLimit,
    searchTerm: initialQ,
    cursor: initialCursor,
  }));

  const [cursorStack, setCursorStack] = useState<Array<string | null>>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [spots, setSpots] = useState<any[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);

  const internalUrlUpdateRef = useRef(false);

  const setParamsSafely = (updater: (prev: URLSearchParams) => URLSearchParams) => {
    internalUrlUpdateRef.current = true;
    setSearchParams((prev) => updater(new URLSearchParams(prev)));
  };

  const syncUrl = (next: typeof filter) => {
    setParamsSafely((p) => {
      p.set("mode", next.mode);

      // status tab
      if (next.status && next.status !== "all") p.set("status", next.status);
      else p.delete("status");

      if (next.region && next.region !== "ALL") p.set("region", next.region);
      else p.delete("region");

      if (next.category && next.category !== "ALL") p.set("category", next.category);
      else p.delete("category");

      p.set("limit", String(normalizeLimit(next.limit, 20)));

      const q = String(next.searchTerm || "").trim();
      if (q) p.set("q", q);
      else p.delete("q");

      if (next.cursor) p.set("cursor", next.cursor);
      else p.delete("cursor");

      p.delete("page");
      if (!focusId) p.delete("focus");

      return p;
    });
  };

  useEffect(() => {
    if (internalUrlUpdateRef.current) {
      internalUrlUpdateRef.current = false;
      return;
    }

    const mode = ((searchParams.get("mode") as any) || "explorer") as SpotMode;
    const status = normalizeSpotStatusTab(searchParams.get("status"));
    const region = strParam(searchParams.get("region"), "ALL");
    const categoryRaw = strParam(searchParams.get("category"), "ALL");
    const category = normalizeCategoryForFilter(mode, categoryRaw);
    const limit = normalizeLimit(intParam(searchParams.get("limit"), 20), 20);
    const q = (searchParams.get("q") || "").trim();
    const cursor = (searchParams.get("cursor") || "").trim() || null;

    setCursorStack([]);
    setNextCursor(null);
    setHasNext(false);

    setFilter((prev) => ({
      ...prev,
      mode,
      status,
      region,
      category,
      limit,
      searchTerm: q,
      cursor,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const loadSpots = async (f = filter) => {
    setLoading(true);
    try {
      const reqFilter: AdminSpotFilter = {
        mode: f.mode,
        region: f.region,
        category: f.category,
        limit: f.limit,
        cursor: f.cursor || undefined,
      } as any;

      // ✅ 운영툴 정석: 휴지통 탭만 includeDeleted=true
      if (f.status === "deleted") {
        (reqFilter as any).includeDeleted = true;
        (reqFilter as any).status = "deleted";
      } else if (f.status === "active") {
        (reqFilter as any).status = "active";
      } else if (f.status === "draft") {
        (reqFilter as any).status = "draft";
      } else {
        // all: 기본은 deleted 제외
        (reqFilter as any).includeDeleted = false;
      }

      if (reqFilter.region === "ALL") (reqFilter as any).region = "ALL";
      if (reqFilter.category === "ALL") (reqFilter as any).category = "ALL";

      const res = await getFilteredSpots(reqFilter);
      const data: any = (res as any)?.data ?? res;
      const items = Array.isArray(data) ? data : data?.items ?? [];

      setSpots(items);

      const serverHasNext =
        !Array.isArray(data) && typeof data?.hasNext === "boolean" ? (data.hasNext as boolean) : undefined;

      const serverNextCursor =
        !Array.isArray(data) && typeof data?.nextCursor === "string" ? (data.nextCursor as string) : null;

      const inferredHasNext = items.length >= (f.limit || 20);

      setHasNext(serverHasNext ?? inferredHasNext);
      setNextCursor(serverNextCursor);
    } catch (err) {
      console.error(err);
      toast.error("장소 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpots(filter);
    syncUrl(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.mode, filter.status, filter.region, filter.category, filter.limit, filter.cursor]);

  const filteredSpots = useMemo(() => {
    // ✅ 1) 상태 탭 필터 (서버가 무시해도 프론트에서 2차 방어)
    const statusFiltered = spots.filter((s) => {
      const st = getSpotRecordStatus(s);
      if (filter.status === "deleted") return st === "deleted";
      if (filter.status === "draft") return st === "draft";
      if (filter.status === "active") return st === "active";
      // all: deleted 기본 제외
      return st !== "deleted";
    });

    // ✅ 2) 검색
    const q = String(filter.searchTerm || "").trim().toLowerCase();
    if (!q) return statusFiltered;

    return statusFiltered.filter((s) => {
      const name = String(s.name ?? "").toLowerCase();
      const addr = String(s.address ?? "").toLowerCase();
      return name.includes(q) || addr.includes(q);
    });
  }, [spots, filter.searchTerm, filter.status]);

  useEffect(() => {
    if (!focusId) return;
    if (!filteredSpots?.length) return;

    const el = document.getElementById(`spot-row-${focusId}`);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, filteredSpots]);

  const resetPagination = () => {
    setCursorStack([]);
    setNextCursor(null);
    setHasNext(false);
    setFilter((prev) => ({ ...prev, cursor: null }));
  };

  const handleDelete = async (id: string) => {
    const first = window.confirm("정말 휴지통으로 이동하시겠습니까?\n(복구는 ‘삭제됨(휴지통)’ 탭에서만 가능합니다.)");
    if (!first) return;

    const ok = window.prompt(`휴지통으로 이동하려면 DELETE 를 입력하세요.`);
    if (ok !== "DELETE") return;

    const loadingId = toast.loading("휴지통으로 이동 중...");
    try {
      await deleteSpot(id, filter.mode);
      toast.success("휴지통으로 이동 완료", { id: loadingId });
      loadSpots(filter);
    } catch (err) {
      console.error(err);
      toast.error("처리 실패", { id: loadingId });
    }
  };

  const handleRestore = async (spot: any) => {
    // ✅ 휴지통 탭에서만 복구 가능 (코드 레벨 방어)
    if (filter.status !== "deleted") return;

    const id = String(spot?.id || "").trim();
    if (!id) return;

    const first = window.confirm("이 항목을 복구하시겠습니까?\n복구 후에는 ‘초안’ 상태로 돌아갑니다.");
    if (!first) return;

    const ok = window.prompt(`복구하려면 RESTORE 를 입력하세요.`);
    if (ok !== "RESTORE") return;

    const loadingId = toast.loading("복구 중...");

    // ✅ restore = deleted → draft (사고 방지)
    const restorePayload = {
      ...(spot as any),
      mode: filter.mode, // normalizeSpotForStore 안정성
      status: "draft",
      deletedAt: null,
      deletedBy: null,
    };

    try {
      await updateSpot(id, restorePayload);
      toast.success("복구 완료 (초안)", { id: loadingId });
      loadSpots(filter);
    } catch (err) {
      console.error(err);
      toast.error("복구 실패", { id: loadingId });
    }
  };

  const canPrev = cursorStack.length > 0;
  const canNext = Boolean(hasNext && nextCursor);

  const handlePrev = () => {
    if (!canPrev) return;

    setCursorStack((prev) => {
      if (prev.length === 0) return prev;
      const prevCursor = prev[prev.length - 1] ?? null;
      const nextStack = prev.slice(0, -1);
      setFilter((f) => ({ ...f, cursor: prevCursor }));
      return nextStack;
    });
  };

  const handleNext = () => {
    if (!canNext || !nextCursor) return;
    setCursorStack((prev) => [...prev, filter.cursor ?? null]);
    setFilter((f) => ({ ...f, cursor: nextCursor }));
  };

  const resetCursorState = () => {
    setCursorStack([]);
    setNextCursor(null);
    setHasNext(false);
  };

  const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);

  const goNew = () => {
    navigate(`/admin/spots/new?mode=${filter.mode}&returnTo=${returnTo}`);
  };

  const goEdit = (id: string) => {
    navigate(`/admin/spots/${id}/edit?mode=${filter.mode}&returnTo=${returnTo}`);
  };

  const categoryOptions = SPOT_CATEGORIES[filter.mode];

  const tabBtn = (value: SpotStatusTab, label: string) => {
    const active = filter.status === value;
    return (
      <button
        type="button"
        onClick={() => {
          resetCursorState();
          setFilter((prev) => ({
            ...prev,
            status: value,
            cursor: null,
          }));
        }}
        className={[
          "px-3 py-2 rounded-lg text-sm font-extrabold border transition",
          active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
        ].join(" ")}
        aria-pressed={active}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">장소 관리</h1>
          {focusId ? (
            <p className="text-xs text-gray-500 mt-1">
              바로가기 포커스: <span className="font-mono">{focusId}</span>
            </p>
          ) : null}
        </div>

        <button onClick={goNew} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + 장소 등록
        </button>
      </div>

      {/* ✅ 상태 탭 */}
      <div className="flex gap-2 flex-wrap mb-4">
        {tabBtn("all", "전체")}
        {tabBtn("active", "활성")}
        {tabBtn("draft", "초안")}
        {tabBtn("deleted", "삭제됨(휴지통)")}
      </div>

      <div className="bg-white p-4 rounded shadow mb-4 flex gap-3 flex-wrap items-center">
        <select
          value={filter.mode}
          onChange={(e) => {
            const nextMode = e.target.value as SpotMode;
            resetCursorState();
            setFilter((prev) => ({
              ...prev,
              mode: nextMode,
              category: "ALL",
              cursor: null,
            }));
          }}
          className="border p-2 rounded"
        >
          <option value="explorer">Explorer</option>
          <option value="nightlife">Nightlife</option>
        </select>

        <select
          value={filter.region}
          onChange={(e) => {
            resetCursorState();
            setFilter((prev) => ({
              ...prev,
              region: e.target.value,
              cursor: null,
            }));
          }}
          className="border p-2 rounded"
        >
          <option value="ALL">전체 지역</option>
          {POPULAR_LOCATIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          value={filter.category}
          onChange={(e) => {
            const v = e.target.value;
            resetCursorState();
            setFilter((prev) => ({
              ...prev,
              category: v === "ALL" ? "ALL" : normalizeSpotCategory(prev.mode, v),
              cursor: null,
            }));
          }}
          className="border p-2 rounded"
        >
          <option value="ALL">전체 카테고리</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filter.limit}
          onChange={(e) => {
            const lim = normalizeLimit(e.target.value, 20);
            resetCursorState();
            setFilter((prev) => ({
              ...prev,
              limit: lim,
              cursor: null,
            }));
          }}
          className="border p-2 rounded"
          title="한 번에 가져올 개수"
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>

        <input
          type="text"
          placeholder="이름/주소 검색"
          value={filter.searchTerm || ""}
          onChange={(e) => {
            const v = e.target.value;
            setFilter((prev) => ({ ...prev, searchTerm: v }));
            setParamsSafely((p) => {
              if (v.trim()) p.set("q", v.trim());
              else p.delete("q");

              // 현재 탭/모드 유지
              p.set("mode", String(filter.mode));
              if (filter.status !== "all") p.set("status", filter.status);
              else p.delete("status");

              if (filter.cursor) p.set("cursor", filter.cursor);
              else p.delete("cursor");

              return p;
            });
          }}
          className="border p-2 rounded flex-1 min-w-[180px]"
        />

        <button onClick={() => loadSpots(filter)} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
          새로고침
        </button>

        <button
          onClick={resetPagination}
          className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200"
          title="커서/페이지 위치 초기화"
        >
          처음으로
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-500">불러오는 중...</div>
      ) : filteredSpots.length === 0 ? (
        <div className="p-10 text-center text-gray-500">
          데이터가 없습니다.
          {focusId ? (
            <div className="text-xs text-gray-400 mt-2">포커스 대상이 현재 목록에 없을 수 있어요. 필터를 조정해 주세요.</div>
          ) : null}
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">이름</th>
                <th className="p-3">카테고리</th>
                <th className="p-3">지역</th>
                <th className="p-3">가격</th>
                <th className="p-3">광고</th>
                <th className="p-3">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpots.map((spot) => {
                const isFocus = focusId && spot.id === focusId;
                const thumb = getSpotThumbnailUrl(spot);
                const normalizedCategory = normalizeSpotCategory(filter.mode, spot.category);

                const budgetNum = typeof spot?.budget === "number" && Number.isFinite(spot.budget) ? spot.budget : null;
                const unitLabel = getBudgetUnitLabel(spot?.budgetUnit);
                const budgetText = String(spot?.budgetText ?? "").trim();

                const pl = isPriceLevel(spot?.priceLevel) ? (Math.trunc(spot.priceLevel) as PriceLevel) : null;
                const plLabel = pl !== null ? PRICE_LEVEL_LABELS[pl] : "-";

                const inTrash = filter.status === "deleted";

                return (
                  <tr
                    key={spot.id}
                    id={`spot-row-${spot.id}`}
                    className={[
                      "border-t",
                      inTrash ? "cursor-default" : "cursor-pointer hover:bg-gray-50",
                      isFocus ? "bg-yellow-50 ring-2 ring-yellow-200" : "",
                    ].join(" ")}
                    onClick={() => {
                      if (inTrash) {
                        toast("삭제됨 항목은 복구 후 수정할 수 있어요.", { icon: "🗑️" });
                        return;
                      }
                      goEdit(spot.id);
                    }}
                    title={inTrash ? "삭제됨(휴지통) 항목입니다." : "클릭하면 수정 페이지로 이동"}
                  >
                    <td className="p-3 flex items-center gap-3">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-12 h-12 rounded object-cover bg-gray-100" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                          NO IMG
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">{spot.name}</div>
                        <div className="text-xs text-gray-500">{spot.address || ""}</div>
                      </div>
                    </td>

                    <td className="p-3">{normalizedCategory}</td>
                    <td className="p-3">{displayRegion(spot)}</td>

                    {/* ✅ 예산 + 등급 라벨 표시 */}
                    <td className="p-3">
                      <div className="font-semibold">
                        {budgetNum !== null && unitLabel ? `${formatVnd(budgetNum)} · ${unitLabel}` : "—"}
                      </div>
                      <div className="text-xs text-gray-500">등급: {plLabel}</div>
                      {budgetText ? <div className="text-xs text-gray-400 mt-1 line-clamp-1">{budgetText}</div> : null}
                    </td>

                    <td className="p-3">
                      {spot.isSponsored ? (
                        <span className="text-green-600 font-bold">
                          ON ({spot.sponsorLevel}/{spot.sponsorExpiry})
                        </span>
                      ) : (
                        <span className="text-gray-400">OFF</span>
                      )}
                    </td>

                    <td className="p-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {inTrash ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleRestore(spot);
                          }}
                          className="bg-slate-900 text-white px-3 py-1 rounded hover:bg-black"
                        >
                          복구
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              goEdit(spot.id);
                            }}
                            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                          >
                            수정
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDelete(spot.id);
                            }}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-between p-4 border-t bg-gray-50">
            <button
              disabled={!canPrev}
              onClick={handlePrev}
              className={`px-4 py-2 rounded ${canPrev ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 text-gray-400"}`}
            >
              이전
            </button>

            <button
              disabled={!canNext}
              onClick={handleNext}
              className={`px-4 py-2 rounded ${canNext ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 text-gray-400"}`}
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

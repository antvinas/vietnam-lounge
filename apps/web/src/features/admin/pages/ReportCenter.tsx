// apps/web/src/features/admin/pages/ReportCenter.tsx
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FaTrash,
  FaExclamationTriangle,
  FaTimesCircle,
  FaExternalLinkAlt,
  FaSearch,
  FaSyncAlt,
  FaRegStickyNote,
} from "react-icons/fa";
import { getReports, processReport, type Report, type ReportStatus } from "@/features/admin/api/admin.api";
import { useSearchParams } from "react-router-dom";

type Tab = ReportStatus | "all";
type Sort = "newest" | "oldest" | "priority";

function parseTab(v: string | null): Tab {
  const s = String(v || "pending").toLowerCase();
  if (s === "pending" || s === "resolved" || s === "rejected" || s === "all") return s as Tab;
  return "pending";
}

function parseSort(v: string | null): Sort {
  const s = String(v || "newest").toLowerCase();
  if (s === "newest" || s === "oldest" || s === "priority") return s as Sort;
  return "newest";
}

function parseDays(v: string | null): number {
  const n = Number(v ?? "");
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(90, Math.floor(n));
}

function safeDate(value: any): Date | null {
  try {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "number") return new Date(value);
    if (typeof value === "string") return new Date(value);
    // Firestore Timestamp-ish
    if (typeof value?.toDate === "function") return value.toDate();
    if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
    return null;
  } catch {
    return null;
  }
}

function formatDate(value: any) {
  const d = safeDate(value);
  if (!d || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function shortUid(uid?: string) {
  if (!uid) return "-";
  return uid.length > 12 ? `${uid.slice(0, 8)}...` : uid;
}

/**
 * 운영 안정성: targetType별로 "안전한 관리자 편집 링크"를 우선 제공
 * - spot / adult_spot -> /admin/spots/:id/edit?mode=
 * - event / adult_event -> /admin/events/:id/edit?mode=
 * - 기타(review/comment 등) -> fallback
 */
function buildAdminTargetHref(report: Report) {
  const r: any = report as any;
  const t = String(r.targetType || r.type || "").toLowerCase();
  const id = String(r.targetId || "");
  if (!id) return "/admin";

  const isNight = t.includes("adult") || t.includes("night");
  const modeParam = isNight ? "nightlife" : "explorer";

  if (t === "spot" || t === "adult_spot" || t.includes("spot")) return `/admin/spots/${id}/edit?mode=${modeParam}`;
  if (t === "event" || t === "adult_event" || t.includes("event")) return `/admin/events/${id}/edit?mode=${modeParam}`;

  return `/admin`;
}

export default function ReportCenter() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // URL -> state
  const [tab, setTab] = useState<Tab>(() => parseTab(searchParams.get("status")));
  const [q, setQ] = useState(() => searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get("type") || "");
  const [days, setDays] = useState<number>(() => parseDays(searchParams.get("days")));
  const [sort, setSort] = useState<Sort>(() => parseSort(searchParams.get("sort")));

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const focusId = searchParams.get("focus");

  const fetchReports = async (nextTab?: Tab) => {
    const targetTab = nextTab ?? tab;
    try {
      setIsLoading(true);
      const data = await getReports({ status: targetTab });
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("신고 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // URL 변화 -> state 동기화
  useEffect(() => {
    const nextTab = parseTab(searchParams.get("status"));
    const nextQ = searchParams.get("q") || "";
    const nextType = searchParams.get("type") || "";
    const nextDays = parseDays(searchParams.get("days"));
    const nextSort = parseSort(searchParams.get("sort"));

    if (nextTab !== tab) setTab(nextTab);
    if (nextQ !== q) setQ(nextQ);
    if (nextType !== typeFilter) setTypeFilter(nextType);
    if (nextDays !== days) setDays(nextDays);
    if (nextSort !== sort) setSort(nextSort);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // tab 변경 시 재조회
  useEffect(() => {
    fetchReports(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // 필터 적용 + 정렬
  const filteredBase = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const tt = typeFilter.trim().toLowerCase();

    const now = Date.now();
    const cutoff = days > 0 ? now - days * 24 * 60 * 60 * 1000 : 0;

    const rows = reports.filter((r) => {
      const rr: any = r as any;

      // days filter
      if (cutoff > 0) {
        const d = safeDate(rr.createdAt);
        const ms = d ? d.getTime() : 0;
        if (!ms || ms < cutoff) return false;
      }

      // type filter (report.type or report.targetType)
      if (tt) {
        const t1 = String(rr.type || "").toLowerCase();
        const t2 = String(rr.targetType || "").toLowerCase();
        if (!t1.includes(tt) && !t2.includes(tt)) return false;
      }

      // search filter
      if (!qq) return true;

      const reason = String(rr.reason || "").toLowerCase();
      const desc = String(rr.description || "").toLowerCase();
      const by = String(rr.reportedBy || rr.reporterUid || rr.reporterEmail || "").toLowerCase();
      const title = String(rr.targetContent?.title || "").toLowerCase();
      const content = String(rr.targetContent?.content || "").toLowerCase();
      const type = String(rr.targetType || rr.type || "").toLowerCase();

      return reason.includes(qq) || desc.includes(qq) || by.includes(qq) || title.includes(qq) || content.includes(qq) || type.includes(qq);
    });

    const scoreOf = (r: any) => {
      const s = r?.priorityScore;
      return typeof s === "number" && Number.isFinite(s) ? s : 0;
    };

    const timeOf = (r: any) => {
      const d = safeDate(r?.createdAt);
      const ms = d ? d.getTime() : 0;
      return Number.isFinite(ms) ? ms : 0;
    };

    const sorted = [...rows].sort((a, b) => {
      const aa: any = a as any;
      const bb: any = b as any;

      if (sort === "priority") {
        const ds = scoreOf(bb) - scoreOf(aa);
        if (ds !== 0) return ds;
        return timeOf(bb) - timeOf(aa);
      }
      if (sort === "oldest") return timeOf(aa) - timeOf(bb);
      return timeOf(bb) - timeOf(aa); // newest
    });

    return sorted;
  }, [reports, q, typeFilter, days, sort]);

  // focus가 있고, 필터 때문에 빠졌으면 맨 위에 강제로 노출(운영 편의)
  const filtered = useMemo(() => {
    if (!focusId) return filteredBase;

    const existsInBase = filteredBase.some((r) => (r as any).id === focusId);
    if (existsInBase) return filteredBase;

    const focusItem = reports.find((r) => (r as any).id === focusId);
    if (!focusItem) return filteredBase;

    return [focusItem, ...filteredBase];
  }, [filteredBase, focusId, reports]);

  // focus 스크롤/하이라이트
  useEffect(() => {
    const focus = searchParams.get("focus");
    if (!focus) return;

    const exists = filtered.some((r) => (r as any).id === focus);
    if (!exists || isLoading) return;

    setHighlightId(focus);
    const el = document.getElementById(`report-${focus}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });

    const t = window.setTimeout(() => setHighlightId(null), 4000);
    return () => window.clearTimeout(t);
  }, [filtered, isLoading, searchParams]);

  const handleProcess = async (report: Report, action: "delete" | "dismiss") => {
    const confirmMsg =
      action === "delete"
        ? "이 신고의 대상 콘텐츠를 삭제 처리(Resolved) 하시겠습니까?"
        : "이 신고를 반려(Rejected) 하시겠습니까?";

    if (!window.confirm(confirmMsg)) return;

    // 운영 추적용 메모(선택)
    const note = window
      .prompt(action === "delete" ? "처리 메모(선택): 예) 스팸/음란/중복" : "반려 사유 메모(선택): 예) 증거 부족", "")
      ?.trim();

    try {
      setProcessingId((report as any).id);

      // admin.api.ts가 note를 지원하면 3번째 인자로 전달, 아니면 무시되어도 안전
      await processReport((report as any).id, action, note || undefined);

      toast.success(action === "delete" ? "삭제 처리 완료" : "반려 처리 완료");
      setReports((prev) => prev.filter((r) => (r as any).id !== (report as any).id));

      // 처리 후 focus 제거(혼동 방지)
      const next = new URLSearchParams(searchParams);
      next.delete("focus");
      setSearchParams(next, { replace: true });
    } catch (e) {
      console.error(e);
      toast.error("처리 중 오류가 발생했습니다.");
    } finally {
      setProcessingId(null);
    }
  };

  const title = useMemo(() => {
    if (tab === "pending") return "미처리 신고";
    if (tab === "resolved") return "처리 완료(Resolved)";
    if (tab === "rejected") return "반려(Rejected)";
    return "전체";
  }, [tab]);

  const setParam = (key: string, value: string | number | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "" || value === 0) next.delete(key);
    else next.set(key, String(value));
    setSearchParams(next, { replace: true });
  };

  const tabBtn = (value: Tab, label: string) => {
    const active = tab === value;
    return (
      <button
        onClick={() => {
          setTab(value);
          const next = new URLSearchParams(searchParams);
          next.set("status", value);
          next.delete("focus");
          setSearchParams(next, { replace: true });
        }}
        className={`px-3 py-2 rounded-lg text-sm font-bold border transition
          ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}
        `}
      >
        {label}
      </button>
    );
  };

  const focusOutByFilter = useMemo(() => {
    if (!focusId) return false;
    const inReports = reports.some((r) => (r as any).id === focusId);
    const inFilteredBase = filteredBase.some((r) => (r as any).id === focusId);
    return inReports && !inFilteredBase;
  }, [focusId, reports, filteredBase]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaExclamationTriangle className="text-red-500" />
            신고 관리 센터
          </h1>
          <p className="text-sm text-gray-500 mt-1">{title}를 확인하고 처리합니다.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {tabBtn("pending", "미처리")}
          {tabBtn("resolved", "처리 완료")}
          {tabBtn("rejected", "반려")}
          {tabBtn("all", "전체")}

          <button
            onClick={() => fetchReports()}
            className="ml-2 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-bold"
          >
            <FaSyncAlt />
            새로고침
          </button>
        </div>
      </div>

      {/* 검색 + 필터 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px] max-w-xl">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              value={q}
              onChange={(e) => {
                const v = e.target.value;
                setQ(v);
                const next = new URLSearchParams(searchParams);
                if (v.trim()) next.set("q", v);
                else next.delete("q");
                next.delete("focus");
                setSearchParams(next, { replace: true });
              }}
              placeholder="검색: 사유/설명/대상제목/신고자/타입"
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={days || 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDays(v);
                setParam("days", v);
                setParam("focus", null);
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
              title="최근 N일 필터"
            >
              <option value={0}>기간: 전체</option>
              <option value={1}>최근 1일</option>
              <option value={3}>최근 3일</option>
              <option value={7}>최근 7일</option>
              <option value={30}>최근 30일</option>
            </select>

            <input
              value={typeFilter}
              onChange={(e) => {
                const v = e.target.value;
                setTypeFilter(v);
                const next = new URLSearchParams(searchParams);
                if (v.trim()) next.set("type", v.trim());
                else next.delete("type");
                next.delete("focus");
                setSearchParams(next, { replace: true });
              }}
              placeholder="type: 예) spam"
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white w-[160px]"
              title="타입 필터 (report.type 또는 targetType)"
            />

            <select
              value={sort}
              onChange={(e) => {
                const v = parseSort(e.target.value);
                setSort(v);
                setParam("sort", v);
                setParam("focus", null);
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
              title="정렬"
            >
              <option value="newest">정렬: 최신</option>
              <option value="oldest">정렬: 오래된</option>
              <option value="priority">정렬: 우선순위</option>
            </select>
          </div>
        </div>

        {focusOutByFilter && (
          <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            현재 포커스된 신고가 필터 조건에서 제외되어, 목록 상단에 “강제 표시”했습니다. (필터를 조정하면 정상 리스트에 포함됩니다)
          </div>
        )}

        <p className="text-xs text-gray-400">
          * 운영 팁: 처리 시 메모를 남기면 추후 분쟁/재발 방지에 도움이 됩니다.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">데이터를 불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>표시할 신고가 없습니다.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((report) => {
              const r: any = report as any;
              const adminHref = buildAdminTargetHref(report);
              const isBusy = processingId === r.id;

              const typeLabel = String(r.targetType || r.type || "-").toUpperCase();
              const statusLabel = String(r.status || "-").toUpperCase();
              const reporterLabel = shortUid(r.reportedBy || r.reporterUid || r.reporterEmail);

              return (
                <li
                  id={`report-${r.id}`}
                  key={r.id}
                  className={`p-6 hover:bg-gray-50 transition ${highlightId === r.id ? "ring-2 ring-blue-400 bg-blue-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                          {typeLabel}
                        </span>

                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-100">
                          {statusLabel}
                        </span>

                        <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>

                        <span className="text-xs text-gray-400">신고자: {reporterLabel}</span>

                        {typeof r.priorityScore === "number" && (
                          <span className="text-xs text-gray-400">priority: {r.priorityScore}</span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-gray-900 mb-1">사유: {r.reason || "-"}</h3>

                      {r.description && <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{r.description}</p>}

                      {r.targetContent?.title && (
                        <p className="text-sm text-gray-800 mb-1">
                          <span className="font-semibold">대상 제목:</span> {r.targetContent.title}
                        </p>
                      )}

                      {r.targetContent?.content && (
                        <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                          <span className="font-semibold">대상 내용:</span> {r.targetContent.content}
                        </p>
                      )}

                      {r.targetContent?.image && (
                        <img
                          src={r.targetContent.image}
                          alt="target"
                          className="mt-2 w-40 h-28 object-cover rounded-lg border border-gray-200"
                        />
                      )}
                    </div>

                    <div className="flex flex-col gap-2 items-end min-w-[200px]">
                      <a
                        href={adminHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        title="관리자 편집 화면으로 이동"
                      >
                        <FaExternalLinkAlt />
                        관리자에서 대상 보기
                      </a>

                      <button
                        disabled={isBusy}
                        onClick={() => handleProcess(report, "delete")}
                        className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white
                          ${isBusy ? "bg-red-300" : "bg-red-600 hover:bg-red-700"}
                        `}
                      >
                        <FaTrash /> 삭제 처리
                      </button>

                      <button
                        disabled={isBusy}
                        onClick={() => handleProcess(report, "dismiss")}
                        className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                          ${isBusy ? "bg-gray-200 text-gray-500" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}
                        `}
                      >
                        <FaTimesCircle /> 반려
                      </button>

                      <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                        <FaRegStickyNote />
                        처리 시 메모 입력 권장
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

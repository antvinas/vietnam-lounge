// apps/web/src/features/admin/pages/AuditLogs.tsx
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaHistory, FaSearch, FaSyncAlt, FaRegCopy, FaDownload, FaFilter, FaTimes } from "react-icons/fa";
import { getAuditLogs, type AuditLogItem } from "@/features/admin/api/admin.api";

function safeDate(value: any): Date | null {
  try {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "number") return new Date(value);
    if (typeof value === "string") return new Date(value);
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

function shortText(s?: string | null, n = 32) {
  const t = String(s || "").trim();
  if (!t) return "-";
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function toCsvValue(v: any) {
  const s = v == null ? "" : typeof v === "string" ? v : JSON.stringify(v);
  const escaped = s.replaceAll('"', '""');
  return `"${escaped}"`;
}

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  const headers = ["createdAt", "action", "byEmail", "byUid", "targetType", "targetId", "changedFields", "data", "before", "after"];
  const lines = [headers.join(",")].concat(rows.map((r) => headers.map((h) => toCsvValue((r as any)[h])).join(",")));

  const blob = new Blob(["\ufeff", lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type ActionGroup = { key: string; label: string; prefixes: string[] };

const ACTION_GROUPS: ActionGroup[] = [
  { key: "reports", label: "신고", prefixes: ["reports."] },
  { key: "spots", label: "장소", prefixes: ["spots.", "adult_spots."] },
  { key: "events", label: "이벤트", prefixes: ["events.", "adult_events."] },
  { key: "users", label: "회원", prefixes: ["users."] },
  { key: "sponsors", label: "스폰서", prefixes: ["sponsors.", "ads."] },
  { key: "system", label: "시스템", prefixes: ["system."] },
  { key: "roles", label: "권한", prefixes: ["roles.", "auth."] },
];

function summarizeRow(row: any) {
  const cf = Array.isArray(row?.changedFields) ? row.changedFields.filter(Boolean) : [];
  if (cf.length) {
    const shown = cf.slice(0, 6).join(", ");
    const more = cf.length > 6 ? ` +${cf.length - 6}` : "";
    return `변경: ${shown}${more}`;
  }
  if (row?.targetType && row?.targetId) return `target: ${row.targetType}/${row.targetId}`;
  if (row?.data) return shortText(JSON.stringify(row.data), 120);
  return "-";
}

export default function AuditLogs() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQ = (searchParams.get("q") || searchParams.get("uid") || "").trim();

  const [days, setDays] = useState(30);
  const [limit, setLimit] = useState(200);
  const [q, setQ] = useState(initialQ);
  const [appliedQ, setAppliedQ] = useState(initialQ);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<AuditLogItem | null>(null);

  // URL(q/uid)로 들어오면 상태 동기화 (뒤로가기/링크 공유 대응)
  useEffect(() => {
    const next = (searchParams.get("q") || searchParams.get("uid") || "").trim();
    setAppliedQ(next);
    setQ((prev) => (prev === "" || prev === appliedQ ? next : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["admin", "auditLogs", days, limit, appliedQ],
    queryFn: () => getAuditLogs({ days, limit, q: appliedQ }),
    staleTime: 15_000,
  });

  const items = useMemo(() => (Array.isArray(data?.items) ? data!.items : []), [data]);

  const filtered = useMemo(() => {
    let rows = items;

    if (selectedGroups.size > 0) {
      const allowPrefixes = ACTION_GROUPS.filter((g) => selectedGroups.has(g.key)).flatMap((g) => g.prefixes);
      rows = rows.filter((r) => {
        const action = String((r as any).action || "");
        return allowPrefixes.some((p) => action.startsWith(p));
      });
    }

    const qq = q.trim().toLowerCase();
    if (qq) {
      rows = rows.filter((r) => {
        const rr: any = r as any;
        const hay = [
          String(rr.action || ""),
          String(rr.byEmail || ""),
          String(rr.byUid || ""),
          String(rr.targetType || ""),
          String(rr.targetId || ""),
          JSON.stringify(rr.changedFields || []),
          JSON.stringify(rr.data || {}),
          JSON.stringify(rr.before || {}),
          JSON.stringify(rr.after || {}),
        ]
          .join("\n")
          .toLowerCase();
        return hay.includes(qq);
      });
    }

    return rows;
  }, [items, q, selectedGroups]);

  const stats = useMemo(() => {
    const total = items.length;
    const shown = filtered.length;
    const last = (filtered as any[])[0]?.createdAt ? safeDate((filtered as any[])[0].createdAt) : null;
    return { total, shown, last };
  }, [items, filtered]);

  const toggleGroup = (key: string) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedGroups(new Set());
    setQ("");
    setAppliedQ("");
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete("q");
      p.delete("uid");
      return p;
    });
  };

  const applyServerSearch = () => {
    const qq = q.trim();
    setAppliedQ(qq);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (qq) p.set("q", qq);
      else p.delete("q");
      p.delete("uid");
      return p;
    });
  };

  const copyJson = async (value: any) => {
    try {
      await navigator.clipboard.writeText(typeof value === "string" ? value : JSON.stringify(value, null, 2));
      toast.success("복사 완료");
    } catch {
      toast.error("복사 실패 (브라우저 권한을 확인해주세요)");
    }
  };

  const handleExport = () => {
    const rows = (filtered as any[]).map((r: any) => ({
      createdAt: r.createdAt,
      action: r.action,
      byEmail: r.byEmail,
      byUid: r.byUid,
      targetType: r.targetType ?? "",
      targetId: r.targetId ?? "",
      changedFields: r.changedFields ?? "",
      data: r.data,
      before: r.before,
      after: r.after,
    }));
    downloadCsv(`audit-logs_last-${days}d_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto [color-scheme:light]">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaHistory className="text-indigo-600" /> 작업 이력 (Audit Logs)
          </h1>
          <p className="text-sm text-gray-500 mt-1">관리자 작업을 추적합니다. 분쟁/장애 대응 시 “누가, 언제, 무엇을” 했는지 근거로 남깁니다.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
          >
            <FaSyncAlt className={isFetching ? "animate-spin" : ""} /> 새로고침
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={(filtered as any[]).length === 0}
            title={(filtered as any[]).length === 0 ? "내보낼 데이터가 없습니다" : "CSV 내보내기"}
          >
            <FaDownload /> CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="[color-scheme:light] bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-700">
              <FaFilter className="text-gray-400" /> 기간
            </span>
            {[1, 7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-2 rounded-lg text-sm font-bold border transition
                  ${days === d ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}
                `}
              >
                최근 {d}일
              </button>
            ))}

            <div className="ml-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">Limit</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {[50, 100, 200, 500].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={clearFilters} className="text-sm font-bold text-gray-600 hover:text-gray-800 hover:underline">
            필터 초기화
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyServerSearch();
                  }
                }}
                placeholder="검색: action / 이메일 / uid / targetId / payload"
                className="w-full pl-10 pr-24 py-2 rounded-lg border border-gray-300 bg-white text-gray-900
                           placeholder:text-gray-400
                           outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="absolute right-2 top-1.5 flex gap-2">
                <button
                  onClick={applyServerSearch}
                  className="h-8 px-3 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                >
                  적용
                </button>
                <button
                  onClick={() => {
                    setQ("");
                    setAppliedQ("");
                    setSearchParams((prev) => {
                      const p = new URLSearchParams(prev);
                      p.delete("q");
                      p.delete("uid");
                      return p;
                    });
                  }}
                  className="h-8 px-3 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200"
                  title="검색어 지우기"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">* “적용”은 서버 조회(권한 기반) + 비용 절감을 위해 사용합니다.</p>
          </div>

          <div>
            <p className="text-xs text-gray-600 font-bold mb-2">액션 필터</p>
            <div className="flex flex-wrap gap-2">
              {ACTION_GROUPS.map((g) => {
                const active = selectedGroups.has(g.key);
                return (
                  <button
                    key={g.key}
                    onClick={() => toggleGroup(g.key)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition
                      ${active ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}
                    `}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 flex-wrap text-xs text-gray-600">
          <span className="font-bold">표시 건수:</span>
          <span>
            {stats.shown} / {stats.total}
          </span>
          {stats.last ? <span>최근 기록: {stats.last.toLocaleString()}</span> : null}
          {appliedQ ? (
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
              서버 검색: <span className="font-mono">{shortText(appliedQ, 28)}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Data */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">데이터를 불러오는 중...</div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="font-bold text-gray-800">불러오기 실패</p>
            <p className="text-sm text-gray-500 mt-2">{(error as any)?.message || "알 수 없는 오류"}</p>
            <p className="text-xs text-gray-400 mt-3">* 권한(관리자 claims), Functions 배포, 또는 /api rewrite 설정을 확인해 주세요.</p>
          </div>
        ) : (filtered as any[]).length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>표시할 작업이력이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-bold text-gray-600">
                  <th className="px-4 py-3 w-[190px]">시간</th>
                  <th className="px-4 py-3 w-[220px]">관리자</th>
                  <th className="px-4 py-3 w-[260px]">Action</th>
                  <th className="px-4 py-3 w-[260px]">Target</th>
                  <th className="px-4 py-3">요약</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(filtered as any[]).map((row: any) => (
                  <tr
                    key={`${row._source || "audit"}:${row.id}`}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelected(row)}
                  >
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-800">{shortText(row.byEmail, 28)}</div>
                      <div className="text-xs text-gray-500">{shortText(row.byUid, 18)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {row.action || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      <div>{row.targetType || "-"}</div>
                      <div className="font-mono break-all">{shortText(row.targetId, 28)}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{summarizeRow(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-[min(980px,95vw)] max-h-[85vh] overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-200">
            <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-gray-500">{formatDate((selected as any).createdAt)}</div>
                <div className="text-lg font-bold text-gray-800 mt-1">{(selected as any).action || "-"}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {(selected as any).byEmail || "-"} <span className="text-gray-400">({shortText((selected as any).byUid, 24)})</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  target: {(selected as any).targetType || "-"} / <span className="font-mono">{String((selected as any).targetId || "-")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyJson(selected)}
                  className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                  <FaRegCopy /> 전체 복사
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                  닫기
                </button>
              </div>
            </div>

            <div className="p-5 overflow-auto max-h-[calc(85vh-84px)] space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-extrabold text-gray-700 mb-2">before</div>
                  <pre className="text-[11px] overflow-auto max-h-[240px]">{JSON.stringify((selected as any).before ?? null, null, 2)}</pre>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-extrabold text-gray-700 mb-2">after</div>
                  <pre className="text-[11px] overflow-auto max-h-[240px]">{JSON.stringify((selected as any).after ?? null, null, 2)}</pre>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="text-xs font-extrabold text-gray-700 mb-2">raw</div>
                <pre className="text-[11px] overflow-auto max-h-[260px]">{JSON.stringify(selected as any, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

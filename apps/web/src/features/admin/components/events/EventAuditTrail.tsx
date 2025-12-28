// apps/web/src/features/admin/components/events/EventAuditTrail.tsx
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaChevronDown, FaChevronUp, FaRegCopy } from "react-icons/fa";
import toast from "react-hot-toast";

import { getEventAuditTrail, type EventAuditLogItem } from "@/features/admin/api/events/events.api";

type Props = {
  eventId: string;
  limit?: number;
  compact?: boolean; // 프리뷰 패널에서 5줄 요약용
  className?: string;
  title?: string;
};

type FilterKey = "all" | "save" | "publish" | "image";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "전체" },
  { key: "save", label: "저장" },
  { key: "publish", label: "발행" },
  { key: "image", label: "이미지" },
];

const FIELD_LABELS: Record<string, string> = {
  __create__: "생성",
  __delete__: "삭제",

  title: "제목",
  name: "제목",
  description: "설명",
  location: "장소",
  city: "도시",
  category: "카테고리",
  organizer: "주최자",

  date: "시작일",
  endDate: "종료일",

  visibility: "공개 상태",
  isPublic: "공개 여부",
  status: "발행 상태",

  imageUrl: "대표 이미지",
  image: "대표 이미지",
  gallery: "갤러리",
};

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

function short(s: any, n = 60) {
  const t = String(s ?? "").trim();
  if (!t) return "—";
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function actionLabel(action: string) {
  if (!action) return "-";
  if (action.endsWith(".create")) return "생성";
  if (action.endsWith(".update")) return "수정";
  if (action.endsWith(".delete")) return "삭제";
  return action;
}

function classifyKinds(r: EventAuditLogItem): Array<Exclude<FilterKey, "all">> {
  // 서버가 내려주면 그걸 우선 사용
  if (Array.isArray((r as any)?.kinds) && (r as any).kinds.length) {
    const ks = (r as any).kinds.map((x: any) => String(x));
    const normalized = ks
      .map((k: string) => (k === "save" || k === "publish" || k === "image" ? k : null))
      .filter(Boolean) as Array<Exclude<FilterKey, "all">>;
    if (normalized.length) return uniq(normalized);
  }

  const fields = new Set((r.changedFields || []).map((x) => String(x)));
  const out: Array<Exclude<FilterKey, "all">> = [];

  const publishFields = ["visibility", "isPublic", "status", "publishAt", "publishedAt", "scheduledAt"];
  const imageFields = ["imageUrl", "image", "gallery", "images", "cover", "coverImage"];

  if (publishFields.some((k) => fields.has(k))) out.push("publish");
  if (imageFields.some((k) => fields.has(k))) out.push("image");

  // create/update인데 위 분류가 없으면 일반 저장으로 취급
  if (!out.length && (r.action?.endsWith(".create") || r.action?.endsWith(".update"))) out.push("save");

  // publish+image 같이 섞일 수 있음
  return uniq(out);
}

function summarizeRow(r: EventAuditLogItem) {
  const base = actionLabel(r.action);

  const kinds = classifyKinds(r);
  const kindLabel =
    kinds.length === 0 ? "" : ` · ${kinds.map((k) => (k === "save" ? "저장" : k === "publish" ? "발행" : "이미지")).join(", ")}`;

  const fields = Array.isArray(r.changedFields) ? r.changedFields.filter(Boolean) : [];
  if (!fields.length) return `${base}${kindLabel}`;

  const shown = fields
    .filter((f) => !String(f).startsWith("__"))
    .slice(0, 6)
    .map((f) => FIELD_LABELS[String(f)] || String(f))
    .join(", ");
  const more = fields.length > 6 ? ` +${fields.length - 6}` : "";

  return `${base}${kindLabel}: ${shown || "변경"}${more}`;
}

function formatValue(v: any) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "예" : "아니오";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v.trim() ? v : "—";
  if (Array.isArray(v)) return v.length ? `[${v.length}] ${short(JSON.stringify(v), 80)}` : "[]";
  try {
    return short(JSON.stringify(v), 120);
  } catch {
    return String(v);
  }
}

function buildDiffRows(r: EventAuditLogItem) {
  const before = (r.before ?? {}) as Record<string, any>;
  const after = (r.after ?? {}) as Record<string, any>;
  const fields = (r.changedFields ?? []).map((x) => String(x)).filter(Boolean);

  // changedFields가 비어도 before/after가 있으면 키 기반으로 계산
  const keys =
    fields.length > 0 ? fields : uniq([...Object.keys(before || {}), ...Object.keys(after || {})]);

  return keys.map((key) => ({
    key,
    label: FIELD_LABELS[key] || key,
    before: formatValue((before as any)?.[key]),
    after: formatValue((after as any)?.[key]),
  }));
}

async function copyJson(v: any) {
  try {
    await navigator.clipboard.writeText(typeof v === "string" ? v : JSON.stringify(v, null, 2));
    toast.success("복사 완료");
  } catch {
    toast.error("복사 실패 (브라우저 권한 확인)");
  }
}

function isNotFoundError(err: any) {
  const msg = String(err?.message || "");
  return msg.includes("(404)") || msg.includes("404") || err?.status === 404;
}

export default function EventAuditTrail({
  eventId,
  limit = 50,
  compact = false,
  className = "",
  title = "변경 이력",
}: Props) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterKey>("all");

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ["admin", "eventAuditTrail", eventId, limit],
    queryFn: () => getEventAuditTrail(eventId, { limit }),
    staleTime: 15_000,
  });

  const items = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const filtered = useMemo(() => {
    const base = compact ? items.slice(0, 5) : items;

    if (filter === "all") return base;
    return base.filter((r) => classifyKinds(r).includes(filter));
  }, [items, compact, filter]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-gray-900">{title}</div>
          {!compact ? (
            <div className="text-xs text-gray-500 mt-0.5">
              누가/언제/무엇을 바꿨는지 타임라인으로 증빙합니다.
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
          >
            {isFetching ? "새로고침…" : "새로고침"}
          </button>
        </div>
      </div>

      {/* 필터 */}
      {!compact ? (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={[
                  "text-xs font-extrabold px-3 py-1.5 rounded-full border",
                  active
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                {f.label}
              </button>
            );
          })}
          <div className="text-xs text-gray-400 ml-1">
            {filter === "all" ? "전체 표시" : `“${FILTERS.find((x) => x.key === filter)?.label}”만 표시`}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-gray-500 rounded-xl border border-gray-200 bg-gray-50 p-4">
          불러오는 중...
        </div>
      ) : error ? (
        <div className="text-sm text-red-700 rounded-xl border border-red-200 bg-red-50 p-4">
          변경 이력을 불러오지 못했습니다.{" "}
          <span className="text-xs text-red-600">
            {(error as any)?.message ? `(${String((error as any).message)})` : ""}
          </span>

          {/* 404 디버그 가이드 */}
          {isNotFoundError(error) ? (
            <div className="mt-3 text-xs text-red-700 space-y-1">
              <div className="font-extrabold">404일 때 1분 점검</div>
              <div>1) Vite 프록시: <span className="font-mono">/api → functions(api)</span> 로 프록시가 살아있는지</div>
              <div>2) Functions 마운트: <span className="font-mono">/api/admin/events/:id/audit</span> 라우트가 index.ts에 등록됐는지</div>
              <div>3) 권한: 관리자 토큰(Authorization Bearer) 없이면 requireAdmin에서 막힐 수 있음</div>
              <div className="mt-1">
                빠른 확인: 브라우저에서 <span className="font-mono">/api/health</span> 가 200인지 먼저 체크
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-red-600">
              * Functions 배포/에뮬레이터 + 라우트 + 권한(토큰) 확인
            </div>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-gray-500 rounded-xl border border-gray-200 bg-gray-50 p-4">
          아직 변경 이력이 없습니다.
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          {/* 타임라인 */}
          <div className="relative px-3 py-2">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200" />

            <div className="divide-y divide-gray-100">
              {filtered.map((r) => {
                const isOpen = openIds.has(r.id);
                const kinds = classifyKinds(r);

                const diffRows = buildDiffRows(r);
                const changedBadges = (r.changedFields ?? [])
                  .map((x) => String(x))
                  .filter((x) => x && !x.startsWith("__"))
                  .slice(0, compact ? 3 : 12);

                return (
                  <div key={r.id} className="py-3 pl-9 pr-2 relative">
                    {/* dot */}
                    <div className="absolute left-4 top-6 w-4 h-4 rounded-full border-2 border-white bg-gray-900 shadow" />

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-gray-900">
                          {summarizeRow(r)}
                        </div>

                        <div className="mt-0.5 text-xs text-gray-500">
                          {formatDate(r.createdAt)}{" "}
                          {r.byEmail ? (
                            <>
                              · <span className="font-semibold">{r.byEmail}</span>
                            </>
                          ) : null}
                        </div>

                        {/* kind badges */}
                        {!compact ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {kinds.map((k) => (
                              <span
                                key={k}
                                className={[
                                  "text-[11px] font-extrabold px-2 py-1 rounded-full border",
                                  k === "publish"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : k === "image"
                                      ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                                      : "bg-gray-50 text-gray-700 border-gray-200",
                                ].join(" ")}
                              >
                                {k === "save" ? "저장" : k === "publish" ? "발행" : "이미지"}
                              </span>
                            ))}

                            {changedBadges.length ? (
                              <div className="flex flex-wrap items-center gap-1">
                                {changedBadges.map((f) => (
                                  <span
                                    key={f}
                                    className="text-[11px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                                  >
                                    {FIELD_LABELS[f] || f}
                                  </span>
                                ))}
                                {(r.changedFields?.length ?? 0) > changedBadges.length ? (
                                  <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                                    +{(r.changedFields?.length ?? 0) - changedBadges.length}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {!compact ? (
                          <div className="mt-2 text-[11px] text-gray-500">
                            target: {String(r.targetType || "-")} /{" "}
                            <span className="font-mono">{String(r.targetId || "-")}</span>
                          </div>
                        ) : null}
                      </div>

                      {!compact ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleOpen(r.id)}
                            className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
                          >
                            {isOpen ? (
                              <>
                                닫기 <FaChevronUp />
                              </>
                            ) : (
                              <>
                                상세 <FaChevronDown />
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => copyJson(r)}
                            className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100"
                            title="이 로그 전체 JSON 복사"
                          >
                            <FaRegCopy /> 복사
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {/* 상세 */}
                    {!compact && isOpen ? (
                      <div className="mt-3 grid grid-cols-1 gap-3">
                        <div className="rounded-xl border border-gray-200 bg-white p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-extrabold text-gray-800">변경 요약</div>
                            <button
                              type="button"
                              onClick={() => copyJson(diffRows)}
                              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100"
                            >
                              요약 복사
                            </button>
                          </div>

                          <div className="overflow-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-500">
                                  <th className="text-left font-extrabold py-2 pr-3">필드</th>
                                  <th className="text-left font-extrabold py-2 pr-3">이전</th>
                                  <th className="text-left font-extrabold py-2">이후</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {diffRows.map((row) => (
                                  <tr key={row.key} className="align-top">
                                    <td className="py-2 pr-3 font-bold text-gray-800 whitespace-nowrap">
                                      {row.label}
                                    </td>
                                    <td className="py-2 pr-3 text-gray-600">
                                      <span className="font-mono">{short(row.before, 140)}</span>
                                    </td>
                                    <td className="py-2 text-gray-900">
                                      <span className="font-mono">{short(row.after, 140)}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* raw: 서버가 data를 내려주면 보여주고, 없으면 before/after라도 */}
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                          <div className="text-xs font-extrabold text-gray-700 mb-2">raw data</div>
                          <pre className="text-[11px] overflow-auto max-h-[260px]">
                            {JSON.stringify((r as any).data ?? { before: r.before ?? null, after: r.after ?? null }, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {!compact ? (
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100 bg-white">
              Tip: “발행/저장/이미지 변경”만 필터링해서 운영 사고 원인 추적이 빨라져요.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

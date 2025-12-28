// apps/web/src/features/admin/pages/AdminSearch.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  searchAdmin,
  type AdminSearchResponse,
  type AdminSearchTab,
  type AdminSearchSort,
  type AdminSearchModeFilter,
  type AdminMode,
} from "@/features/admin/api/admin.api";

const TABS: { key: AdminSearchTab; label: string; desc: string }[] = [
  { key: "all", label: "전체", desc: "장소/이벤트/회원 통합" },
  { key: "spots", label: "장소", desc: "Spots / Adult Spots" },
  { key: "events", label: "이벤트", desc: "Events / Adult Events" },
  { key: "users", label: "회원", desc: "Users" },
];

function safeInt(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function highlight(text: string, q: string) {
  const s = String(text ?? "");
  const needle = String(q ?? "").trim();
  if (!s || !needle || needle.length < 2) return s;

  const lower = s.toLowerCase();
  const nLower = needle.toLowerCase();

  const out: React.ReactNode[] = [];
  let i = 0;

  while (true) {
    const idx = lower.indexOf(nLower, i);
    if (idx === -1) {
      out.push(s.slice(i));
      break;
    }
    if (idx > i) out.push(s.slice(i, idx));
    out.push(
      <mark key={`${idx}-${i}`} className="rounded px-1 bg-yellow-100 text-gray-900">
        {s.slice(idx, idx + needle.length)}
      </mark>
    );
    i = idx + needle.length;
  }

  return <>{out}</>;
}

function modeLabel(mode?: AdminMode) {
  if (mode === "nightlife") return "Nightlife";
  return "Explorer";
}

function buildSpotEditHref(id: string, mode?: AdminMode) {
  const q = mode ? `?mode=${encodeURIComponent(mode)}` : "";
  return `/admin/spots/${id}/edit${q}`;
}
function buildEventEditHref(id: string, mode?: AdminMode) {
  const q = mode ? `?mode=${encodeURIComponent(mode)}` : "";
  return `/admin/events/${id}/edit${q}`;
}
function buildUserHref(uid: string, qText: string) {
  const sp = new URLSearchParams();
  sp.set("focus", uid);
  if (qText) sp.set("q", qText);
  return `/admin/users?${sp.toString()}`;
}

export default function AdminSearch() {
  const [sp, setSp] = useSearchParams();

  const qText = (sp.get("q") ?? "").trim();
  const tab = (sp.get("tab") as AdminSearchTab) || "all";
  const sort = (sp.get("sort") as AdminSearchSort) || "relevance";
  const mode = (sp.get("mode") as AdminSearchModeFilter) || "all";
  const role = sp.get("role") ?? "all";
  const page = Math.max(1, safeInt(sp.get("page"), 1));
  const limit = Math.min(50, Math.max(1, safeInt(sp.get("limit"), tab === "all" ? 8 : 20)));

  const [data, setData] = useState<AdminSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyParams = (patch: Record<string, string | number | null | undefined>, replace = true) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "" || v === "all") next.delete(k);
      else next.set(k, String(v));
    });
    setSp(next, { replace });
  };

  useEffect(() => {
    let alive = true;

    if (!qText) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (qText.length < 2) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const t = window.setTimeout(async () => {
      try {
        const res = await searchAdmin({
          q: qText,
          tab,
          sort,
          mode,
          role,
          page,
          limit,
        });
        if (!alive) return;
        setData(res);
      } catch (e: any) {
        if (!alive) return;
        console.error(e);
        // 백엔드 엔드포인트 아직 없으면 여기로 떨어질 수 있음(다음 단계에서 붙임)
        setError(e?.message || "검색에 실패했습니다. (서버 검색 엔드포인트 확인 필요)");
        setData(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }, 250);

    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [qText, tab, sort, mode, role, page, limit]);

  const totals = data?.totals ?? { all: 0, spots: 0, events: 0, users: 0 };
  const items = data?.items ?? { spots: [], events: [], users: [] };

  const tabMeta = useMemo(() => TABS.find((t) => t.key === tab) ?? TABS[0], [tab]);

  const canShowModeFilter = tab === "all" || tab === "spots" || tab === "events";
  const canShowRoleFilter = tab === "all" || tab === "users";

  const tabTotal = tab === "spots" ? totals.spots : tab === "events" ? totals.events : tab === "users" ? totals.users : totals.all;
  const canPrev = page > 1;
  const canNext = tabTotal > page * limit;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">관리자 검색</h1>
            <p className="text-sm text-gray-500 mt-1">
              {tabMeta.label} · <span className="text-gray-600">{tabMeta.desc}</span>
            </p>
          </div>

          <div className="text-xs text-gray-400">
            운영용: 서버 검색 기반(대량 Firestore 조회 제거)
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  onClick={() => applyParams({ tab: t.key, page: 1 })}
                  className={[
                    "px-3 py-1.5 rounded-xl text-sm font-semibold border",
                    active
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">정렬</label>
              <select
                className="text-sm border border-gray-200 rounded-xl px-2 py-1 bg-white"
                value={sort}
                onChange={(e) => applyParams({ sort: e.target.value, page: 1 })}
              >
                <option value="relevance">관련도</option>
                <option value="recent">최신순</option>
              </select>

              {canShowModeFilter && (
                <>
                  <label className="text-xs text-gray-500 ml-2">모드</label>
                  <select
                    className="text-sm border border-gray-200 rounded-xl px-2 py-1 bg-white"
                    value={mode}
                    onChange={(e) => applyParams({ mode: e.target.value, page: 1 })}
                  >
                    <option value="all">전체</option>
                    <option value="explorer">Explorer</option>
                    <option value="nightlife">Nightlife</option>
                  </select>
                </>
              )}

              {canShowRoleFilter && (
                <>
                  <label className="text-xs text-gray-500 ml-2">권한</label>
                  <select
                    className="text-sm border border-gray-200 rounded-xl px-2 py-1 bg-white"
                    value={role}
                    onChange={(e) => applyParams({ role: e.target.value, page: 1 })}
                  >
                    <option value="all">전체</option>
                    <option value="superAdmin">superAdmin</option>
                    <option value="admin">admin</option>
                    <option value="member">member</option>
                  </select>
                </>
              )}

              <label className="text-xs text-gray-500 ml-2">Limit</label>
              <select
                className="text-sm border border-gray-200 rounded-xl px-2 py-1 bg-white"
                value={String(limit)}
                onChange={(e) => applyParams({ limit: e.target.value, page: 1 })}
              >
                <option value="8">8</option>
                <option value="12">12</option>
                <option value="20">20</option>
                <option value="30">30</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-700">
            키워드:{" "}
            <span className="font-mono text-gray-900">{qText || "(없음)"}</span>
            {qText && qText.length < 2 && (
              <span className="ml-2 text-xs text-gray-500">(2글자 이상 입력)</span>
            )}
          </div>

          {qText && qText.length >= 2 && (
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
                전체 {totals.all}
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
                장소 {totals.spots}
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
                이벤트 {totals.events}
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
                회원 {totals.users}
              </span>
            </div>
          )}
        </div>
      </div>

      {!qText && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-gray-600">
          상단 검색창에서 키워드를 입력해 주세요.
        </div>
      )}

      {qText && qText.length < 2 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-gray-600">
          운영 검색은 2글자 이상부터 동작합니다.
        </div>
      )}

      {qText && qText.length >= 2 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          {loading ? (
            <div className="text-sm text-gray-500">검색 중...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : !data ? (
            <div className="text-sm text-gray-500">검색 결과가 없습니다.</div>
          ) : tab === "all" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Spots */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">장소</h2>
                  <button
                    className="text-xs font-bold text-blue-600 hover:underline"
                    onClick={() => applyParams({ tab: "spots", page: 1 })}
                  >
                    더보기
                  </button>
                </div>

                {items.spots.length === 0 ? (
                  <div className="text-sm text-gray-500">일치하는 장소가 없습니다.</div>
                ) : (
                  <ul className="space-y-2">
                    {items.spots.map((s) => (
                      <li key={s.id} className="rounded-xl border border-gray-100 p-3 hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {highlight(s.name || "(이름 없음)", qText)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {highlight(s.category || "-", qText)} · {modeLabel(s.mode)}
                            </div>
                          </div>
                          <Link
                            to={buildSpotEditHref(s.id, s.mode)}
                            className="text-xs font-bold text-blue-600 hover:underline"
                          >
                            편집
                          </Link>
                        </div>
                        {s.address && <div className="text-xs text-gray-500 mt-2 line-clamp-1">{highlight(s.address, qText)}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Events */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">이벤트</h2>
                  <button
                    className="text-xs font-bold text-blue-600 hover:underline"
                    onClick={() => applyParams({ tab: "events", page: 1 })}
                  >
                    더보기
                  </button>
                </div>

                {items.events.length === 0 ? (
                  <div className="text-sm text-gray-500">일치하는 이벤트가 없습니다.</div>
                ) : (
                  <ul className="space-y-2">
                    {items.events.map((e) => (
                      <li key={e.id} className="rounded-xl border border-gray-100 p-3 hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {highlight(e.title || "(제목 없음)", qText)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {e.location ? highlight(e.location, qText) : "-"}
                              {e.date ? <span>{` · ${e.date}`}</span> : null}
                              <span className="ml-1">· {modeLabel(e.mode)}</span>
                            </div>
                          </div>
                          <Link
                            to={buildEventEditHref(e.id, e.mode)}
                            className="text-xs font-bold text-blue-600 hover:underline"
                          >
                            편집
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Users */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">회원</h2>
                  <button
                    className="text-xs font-bold text-blue-600 hover:underline"
                    onClick={() => applyParams({ tab: "users", page: 1 })}
                  >
                    더보기
                  </button>
                </div>

                {items.users.length === 0 ? (
                  <div className="text-sm text-gray-500">일치하는 회원이 없습니다.</div>
                ) : (
                  <ul className="space-y-2">
                    {items.users.map((u) => (
                      <li key={u.id} className="rounded-xl border border-gray-100 p-3 hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {highlight(u.displayName || u.email || "(이름/이메일 없음)", qText)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {u.email ? highlight(u.email, qText) : "-"} · {u.role || "member"}
                            </div>
                          </div>
                          <Link
                            to={buildUserHref(u.id, qText)}
                            className="text-xs font-bold text-blue-600 hover:underline"
                          >
                            보기
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tab mode list */}
              {tab === "spots" && (
                <section className="space-y-3">
                  <h2 className="font-bold text-gray-900">장소 결과 ({totals.spots})</h2>
                  {items.spots.length === 0 ? (
                    <div className="text-sm text-gray-500">일치하는 장소가 없습니다.</div>
                  ) : (
                    <ul className="space-y-2">
                      {items.spots.map((s) => (
                        <li key={s.id} className="rounded-xl border border-gray-100 p-3 hover:bg-gray-50">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-gray-900">{highlight(s.name || "(이름 없음)", qText)}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {highlight(s.category || "-", qText)} · {modeLabel(s.mode)}
                              </div>
                              {s.address && <div className="text-xs text-gray-500 mt-2">{highlight(s.address, qText)}</div>}
                            </div>
                            <Link
                              to={buildSpotEditHref(s.id, s.mode)}
                              className="text-xs font-bold text-blue-600 hover:underline"
                            >
                              편집
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {tab === "events" && (
                <section className="space-y-3">
                  <h2 className="font-bold text-gray-900">이벤트 결과 ({totals.events})</h2>
                  {items.events.length === 0 ? (
                    <div className="text-sm text-gray-500">일치하는 이벤트가 없습니다.</div>
                  ) : (
                    <ul className="space-y-2">
                      {items.events.map((e) => (
                        <li key={e.id} className="rounded-xl border border-gray-100 p-3 hover:bg-gray-50">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-gray-900">{highlight(e.title || "(제목 없음)", qText)}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {e.location ? highlight(e.location, qText) : "-"}
                                {e.date ? <span>{` · ${e.date}`}</span> : null}
                                <span className="ml-1">· {modeLabel(e.mode)}</span>
                              </div>
                            </div>
                            <Link
                              to={buildEventEditHref(e.id, e.mode)}
                              className="text-xs font-bold text-blue-600 hover:underline"
                            >
                              편집
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {tab === "users" && (
                <section className="space-y-3">
                  <h2 className="font-bold text-gray-900">회원 결과 ({totals.users})</h2>
                  {items.users.length === 0 ? (
                    <div className="text-sm text-gray-500">일치하는 회원이 없습니다.</div>
                  ) : (
                    <ul className="space-y-2">
                      {items.users.map((u) => (
                        <li key={u.id} className="rounded-xl border border-gray-100 p-3 hover:bg-gray-50">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {highlight(u.displayName || u.email || "(이름/이메일 없음)", qText)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {u.email ? highlight(u.email, qText) : "-"} · {u.role || "member"}
                                {u.status ? <span>{` · ${u.status}`}</span> : null}
                              </div>
                            </div>
                            <Link
                              to={buildUserHref(u.id, qText)}
                              className="text-xs font-bold text-blue-600 hover:underline"
                            >
                              보기
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-gray-500">
                  page {page} · limit {limit}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!canPrev}
                    onClick={() => applyParams({ page: page - 1 })}
                    className={[
                      "px-3 py-1.5 rounded-xl text-sm font-semibold border",
                      canPrev ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50" : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed",
                    ].join(" ")}
                  >
                    이전
                  </button>
                  <button
                    disabled={!canNext}
                    onClick={() => applyParams({ page: page + 1 })}
                    className={[
                      "px-3 py-1.5 rounded-xl text-sm font-semibold border",
                      canNext ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50" : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed",
                    ].join(" ")}
                  >
                    다음
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

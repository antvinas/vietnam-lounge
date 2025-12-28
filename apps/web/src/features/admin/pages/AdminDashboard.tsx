// apps/web/src/features/admin/pages/AdminDashboard.tsx
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  FaUsers,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaAd,
  FaServer,
  FaBroom,
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaSyncAlt,
} from "react-icons/fa";
import {
  getDashboardStats,
  fetchSystemHealth,
  requestCachePurge,
  getPendingReportCount,
  type SystemHealth,
} from "@/features/admin/api/admin.api";
import toast from "react-hot-toast";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import Modal from "@/components/common/Modal";

function formatTime(ts?: number | null) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return "-";
  }
}

function parseIsoToMs(iso?: string | null) {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

function computeUptimeLabel(uptime?: number | null) {
  const v = Number(uptime ?? 0);
  if (!Number.isFinite(v) || v <= 0) return "-";

  const seconds = v;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

type HealthGrade = "good" | "warn" | "bad";
function latencyGrade(latencyMs?: number | null): HealthGrade {
  const v = Number(latencyMs ?? 0);
  if (!Number.isFinite(v)) return "bad";
  if (v <= 200) return "good";
  if (v <= 800) return "warn";
  return "bad";
}

function toDateMaybe(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;

  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isFinite(t) ? new Date(t) : null;
  }
  if (typeof v === "number") return new Date(v);

  // Firestore Timestamp
  if (typeof v?.toDate === "function") {
    try {
      return v.toDate();
    } catch {
      return null;
    }
  }
  if (typeof v?.seconds === "number") {
    return new Date(v.seconds * 1000);
  }
  return null;
}

function formatShortDate(v: any) {
  const d = toDateMaybe(v);
  if (!d) return "-";
  return d.toLocaleString(undefined, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function AdminDashboard() {
  // 1) 기본 통계 (캐싱)
  const statsQuery = useQuery({
    queryKey: ["adminStats"],
    queryFn: getDashboardStats,
    staleTime: 1000 * 60 * 5,
  });

  // 2) 신고 Pending count (대시보드에서는 count만 표시: 404/500 스팸 방지)
  const pendingCountQuery = useQuery({
    queryKey: ["adminPendingReportsCount"],
    queryFn: getPendingReportCount,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: false,
  });

  // 3) 시스템 상태
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [lastHealthCheckedAt, setLastHealthCheckedAt] = useState<number | null>(null);
  const [lastHealthServerTs, setLastHealthServerTs] = useState<number | null>(null);

  const [isPurging, setIsPurging] = useState(false);

  // ✅ superAdmin 판정 단일화: Custom Claims 기반
  const { user } = useAuthStore();
  const canPurgeAll = user?.claims?.superAdmin === true;

  const [purgeScope, setPurgeScope] = useState<"spots" | "events" | "users" | "ads" | "reports" | "all">("spots");
  const [purgeReason, setPurgeReason] = useState("");

  // ✅ P0 안전장치: 2단계 확인 모달(사유 필수 + 확인 문구 입력)
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgeStep, setPurgeStep] = useState<1 | 2>(1);
  const [purgeConfirmText, setPurgeConfirmText] = useState("");

  // ✅ 권한 이슈(403 auth/not-an-admin) 때는 폴링이 계속 돌면서 콘솔이 도배될 수 있음
  const [notAdmin, setNotAdmin] = useState(false);
  const notAdminRef = useRef(false);
  const warnedRef = useRef(false);

  const loadHealth = async () => {
    if (isHealthLoading) return;
    setIsHealthLoading(true);

    try {
      const res = await fetchSystemHealth();
      setSystemHealth(res);
      setNotAdmin(false);
      notAdminRef.current = false;

      const serverMs = parseIsoToMs((res as any)?.timestamp ?? null);
      if (serverMs) setLastHealthServerTs(serverMs);
    } catch (e: any) {
      const status = e?.response?.status;
      const code = e?.response?.data?.code;

      // ✅ 관리자 권한이 아닌 경우(403) -> 폴링 중단
      if (status === 403 && code === "auth/not-an-admin") {
        setNotAdmin(true);
        notAdminRef.current = true;

        if (!warnedRef.current) {
          warnedRef.current = true;
          toast.error("관리자 권한이 없습니다. (auth/not-an-admin)\n권한 부여 후 새로고침하세요.");
        }
        return;
      }

      console.error("Health check failed", e);
      setSystemHealth({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: 0,
        dbLatency: 0,
        memory: { rss: 0, heapTotal: 0, heapUsed: 0 },
        recentErrors: [{ message: "health endpoint failed", at: new Date().toISOString() }],
      });
      setLastHealthServerTs(Date.now());
    } finally {
      setLastHealthCheckedAt(Date.now());
      setIsHealthLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const timer = setInterval(() => {
      if (notAdminRef.current) return;
      loadHealth();
    }, 1000 * 30);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPurgeModal = () => {
    if (notAdmin) {
      toast.error("관리자 권한이 없어서 실행할 수 없습니다.");
      return;
    }
    setPurgeStep(1);
    setPurgeConfirmText("");
    setPurgeModalOpen(true);
  };

  const closePurgeModal = () => {
    if (isPurging) return;
    setPurgeModalOpen(false);
  };

  const executePurge = async () => {
    const reason = purgeReason.trim();
    if (!reason) {
      toast.error("사유를 입력해 주세요.");
      return;
    }

    const requiredPhrase = purgeScope === "all" ? "DELETE ALL CACHE" : `PURGE ${purgeScope.toUpperCase()}`;
    if (purgeConfirmText.trim() !== requiredPhrase) {
      toast.error(`확인 문구가 일치하지 않습니다. "${requiredPhrase}" 를 정확히 입력해 주세요.`);
      return;
    }

    setIsPurging(true);
    const toastId = toast.loading("캐시 초기화 중...");

    try {
      await requestCachePurge({ scope: purgeScope, reason });
      toast.success("캐시가 성공적으로 초기화되었습니다.", { id: toastId });

      setPurgeModalOpen(false);
      setPurgeStep(1);
      setPurgeConfirmText("");

      // ✅ purge 후 Health도 갱신(Last updated도 같이 갱신됨)
      await loadHealth();
      // ✅ Pending count도 즉시 갱신
      await pendingCountQuery.refetch();
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : "";
      toast.error(msg ? `캐시 초기화 실패: ${msg}` : "캐시 초기화 실패", { id: toastId });
    } finally {
      setIsPurging(false);
    }
  };

  const stats = statsQuery.data;
  const pendingReports = pendingCountQuery.data ?? 0;

  const lastUpdatedAt = useMemo(() => {
    const candidates = [statsQuery.dataUpdatedAt || 0, pendingCountQuery.dataUpdatedAt || 0, lastHealthCheckedAt || 0].filter((n) => n > 0);
    if (candidates.length === 0) return null;
    return Math.max(...candidates);
  }, [statsQuery.dataUpdatedAt, pendingCountQuery.dataUpdatedAt, lastHealthCheckedAt]);

  // ✅ System Health 라벨/기준 통일
  const healthLatGrade = latencyGrade((systemHealth as any)?.dbLatency ?? null);
  const derivedHealthStatus: "healthy" | "unhealthy" = useMemo(() => {
    if ((systemHealth as any)?.status === "healthy") return "healthy";
    if ((systemHealth as any)?.status === "unhealthy") return "unhealthy";
    return healthLatGrade === "bad" ? "unhealthy" : "healthy";
  }, [(systemHealth as any)?.status, healthLatGrade]);

  const healthBadge = useMemo(() => {
    if (!systemHealth) return { label: "확인 중", cls: "bg-gray-100 text-gray-700", icon: null as any };
    if (derivedHealthStatus === "healthy") {
      return { label: "정상", cls: "bg-green-100 text-green-700", icon: <FaCheckCircle /> };
    }
    return { label: "점검 필요", cls: "bg-red-100 text-red-700", icon: <FaExclamationCircle /> };
  }, [systemHealth, derivedHealthStatus]);

  const latencyHelper = useMemo(() => {
    const tip = "기준: 0~200ms 정상 · 200~800ms 주의 · 800ms+ 점검 필요";
    if (!systemHealth) return { label: "-", sub: tip, grade: "warn" as HealthGrade, tip };
    const grade = latencyGrade((systemHealth as any).dbLatency);
    const sub =
      grade === "good"
        ? "현재 응답이 안정적입니다."
        : grade === "warn"
          ? "부하/네트워크 영향 가능성이 있습니다."
          : "지연이 큽니다. DB/Functions 상태를 점검하세요.";
    return { label: `${(systemHealth as any).dbLatency}ms`, sub, grade, tip };
  }, [systemHealth]);

  const statCards = [
    { label: "등록 장소", value: stats?.spotCount || 0, icon: <FaMapMarkerAlt />, color: "bg-blue-500", to: "/admin/spots" },
    { label: "회원", value: stats?.userCount || 0, icon: <FaUsers />, color: "bg-orange-500", to: "/admin/users" },
    { label: "이벤트", value: stats?.eventCount || 0, icon: <FaCalendarAlt />, color: "bg-purple-500", to: "/admin/events" },
    { label: "스폰서", value: stats?.sponsorCount || 0, icon: <FaAd />, color: "bg-green-500", to: "/admin/sponsors" },
  ];

  // ✅ ReportCenter가 읽는 쿼리(필터/포커스) 계약:
  // status, q, type, days, sort, focus
  const linkPending = "/admin/reports?status=pending";
  const linkRecent1d = "/admin/reports?status=pending&days=1&sort=newest";
  const linkSpam = "/admin/reports?status=pending&type=spam&sort=newest";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 [color-scheme:light]">
      {/* 헤더 */}
      <div className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">대시보드</h1>
          <p className="text-gray-500 mt-2">플랫폼 현황을 한눈에 확인하고 관리하세요.</p>
          <p className="text-[11px] text-gray-400 mt-2">자동 갱신: 시스템 상태 30초 · 미처리 신고(Count) 60초 · 통계 5분</p>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-400">Last updated</div>
          <div className="text-sm font-semibold text-gray-700">{lastUpdatedAt ? formatTime(lastUpdatedAt) : "-"}</div>
        </div>
      </div>

      {/* 상태/유틸 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 시스템 상태 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaServer className="text-gray-500" /> 시스템 상태
              </h2>
              <p className="text-sm text-gray-500 mt-1">Functions/DB/에러 로그를 요약 표시합니다.</p>
            </div>

            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${healthBadge.cls}`}>
              {healthBadge.icon}
              {healthBadge.label}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500">Uptime</div>
              <div className="text-lg font-extrabold text-gray-800 mt-1">{computeUptimeLabel((systemHealth as any)?.uptime ?? null)}</div>
              <div className="text-[11px] text-gray-400 mt-1">서버 기준: {lastHealthServerTs ? formatTime(lastHealthServerTs) : "-"}</div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500">DB Latency</div>
              <div className="text-lg font-extrabold text-gray-800 mt-1">{latencyHelper.label}</div>
              <div className="text-[11px] text-gray-500 mt-1">{latencyHelper.sub}</div>
              <div className="text-[11px] text-gray-400 mt-1">{latencyHelper.tip}</div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">최근 에러</div>
                <button
                  onClick={loadHealth}
                  disabled={isHealthLoading || notAdmin}
                  className="text-xs font-semibold px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-1">
                    <FaSyncAlt className={isHealthLoading ? "animate-spin" : ""} />
                    갱신
                  </span>
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {Array.isArray((systemHealth as any)?.recentErrors) && (systemHealth as any).recentErrors.length > 0 ? (
                  (systemHealth as any).recentErrors.slice(0, 2).map((e: any, idx: number) => (
                    <div key={idx} className="text-[12px] text-gray-700 rounded-lg bg-gray-50 border border-gray-100 p-2">
                      <div className="font-semibold">{e?.message || "error"}</div>
                      <div className="text-[11px] text-gray-400 mt-1">{e?.at ? String(e.at) : "-"}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">에러 로그가 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 캐시 초기화 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FaBroom className="text-gray-500" /> 캐시 초기화
          </h2>
          <p className="text-sm text-gray-500 mt-1">운영 중 데이터가 꼬일 때 부분 초기화로 복구합니다.</p>

          <div className="mt-4 space-y-3">
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1">초기화 범위</div>
              <select
                value={purgeScope}
                onChange={(e) => setPurgeScope(e.target.value as any)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                disabled={isPurging}
              >
                <option value="spots">Spots</option>
                <option value="events">Events</option>
                <option value="users">Users</option>
                <option value="ads">Ads</option>
                <option value="reports">Reports</option>
                <option value="all" disabled={!canPurgeAll}>
                  All (SuperAdmin)
                </option>
              </select>
              {!canPurgeAll && <p className="text-[11px] text-gray-500">* 권장: 문제 영역부터 초기화 → 마지막에 전체</p>}

              <div className="text-[12px] text-gray-500">
                <Link to="/admin/audit-logs" className="font-semibold text-blue-600 hover:underline">
                  작업 이력 보기 →
                </Link>
              </div>
            </div>

            <button
              disabled={isPurging || notAdmin}
              onClick={openPurgeModal}
              className="w-full rounded-xl bg-orange-500 text-white font-bold py-3 hover:bg-orange-600 disabled:opacity-50"
            >
              {isPurging ? "처리 중..." : "캐시 초기화 실행"}
            </button>
          </div>

          {/* 작업 큐 */}
          <div className="mt-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <FaExclamationTriangle className="text-gray-500" /> 작업 큐
            </h2>
            <p className="text-sm text-gray-500 mb-4">처리해야 할 항목을 빠르게 확인하세요.</p>

            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div>
                <div className="text-xs text-gray-500">미처리 신고</div>
                <div className="text-2xl font-extrabold text-gray-800">{pendingCountQuery.isLoading ? "…" : pendingReports}</div>
              </div>
              <Link to={linkPending} className="text-sm font-bold text-blue-600 hover:underline">
                신고 관리로 이동 →
              </Link>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={linkPending} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                미처리만
              </Link>
              <Link to={linkRecent1d} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                최근 24시간
              </Link>
              <Link to={linkSpam} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                스팸/광고(예시)
              </Link>
            </div>

            <div className="mt-4 text-[12px] text-gray-500 rounded-xl border border-gray-100 bg-gray-50 p-3">
              신고 상세 목록(Top 5)은 <span className="font-semibold">신고 관리</span> 화면에서 확인하세요.
            </div>
          </div>
        </div>
      </div>

      {/* 핵심 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((s) => (
          <Link key={s.label} to={s.to} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">{s.label}</div>
                <div className="text-3xl font-extrabold text-gray-800 mt-2">{s.value}</div>
              </div>
              <div className={`${s.color} text-white p-3 rounded-xl text-xl`}>{s.icon}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* P0: 캐시 초기화 2단계 확인 모달 */}
      <Modal
        isOpen={purgeModalOpen}
        onClose={closePurgeModal}
        title={purgeStep === 1 ? "캐시 초기화 확인" : "최종 확인"}
        overlayClosable={false}
        escClosable={!isPurging}
        footer={
          purgeStep === 1 ? (
            <div className="flex gap-2">
              <button
                onClick={closePurgeModal}
                className="rounded-xl px-4 py-2 text-sm font-semibold border border-gray-200 hover:bg-gray-50"
                disabled={isPurging}
              >
                취소
              </button>
              <button
                onClick={() => setPurgeStep(2)}
                className="rounded-xl px-4 py-2 text-sm font-bold bg-orange-500 text-white hover:bg-orange-600"
                disabled={isPurging}
              >
                다음
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setPurgeStep(1)}
                className="rounded-xl px-4 py-2 text-sm font-semibold border border-gray-200 hover:bg-gray-50"
                disabled={isPurging}
              >
                이전
              </button>
              <button
                onClick={executePurge}
                className="rounded-xl px-4 py-2 text-sm font-bold bg-red-600 text-white hover:bg-red-700"
                disabled={isPurging}
              >
                {isPurging ? "처리 중..." : "최종 실행"}
              </button>
            </div>
          )
        }
      >
        {purgeStep === 1 ? (
          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              선택한 범위(<span className="font-semibold">{purgeScope}</span>)의 캐시를 초기화합니다. 운영 중 데이터 꼬임/반영 지연 시 사용하세요.
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1">사유(필수)</div>
              <input
                value={purgeReason}
                onChange={(e) => setPurgeReason(e.target.value)}
                placeholder="예: 스팟 리스트 이미지 반영 안됨 / 신고 대시보드 갱신 필요"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                disabled={isPurging}
              />
            </div>

            <div className="text-[12px] text-gray-500">
              다음 단계에서 확인 문구를 입력해야 실행됩니다. (오실행 방지)
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              아래 확인 문구를 정확히 입력하세요.
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm font-mono">
              {purgeScope === "all" ? "DELETE ALL CACHE" : `PURGE ${purgeScope.toUpperCase()}`}
            </div>

            <input
              value={purgeConfirmText}
              onChange={(e) => setPurgeConfirmText(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono"
              disabled={isPurging}
            />

            <div className="text-[12px] text-gray-500">
              * 잘못 실행하면 운영 데이터가 꼬일 수 있습니다. 범위를 다시 확인하세요.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

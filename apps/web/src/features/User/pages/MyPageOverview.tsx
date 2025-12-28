import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  FaTicketAlt,
  FaHeart,
  FaPen,
  FaCrown,
  FaChevronRight,
  FaUserShield,
  FaCalendarAlt,
  FaMapMarkedAlt,
} from "react-icons/fa";

import Loading from "@/components/common/Loading";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { getMyProfile, getUserActivitySummary } from "../api/user.api";

const DEFAULT_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

type StatKind = "coupon" | "favorite" | "review";

const STAT_STYLE: Record<
  StatKind,
  { borderHover: string; iconWrap: string; iconText: string }
> = {
  coupon: {
    borderHover: "hover:border-purple-500",
    iconWrap: "bg-purple-50 dark:bg-purple-900/20",
    iconText: "text-purple-600",
  },
  favorite: {
    borderHover: "hover:border-pink-500",
    iconWrap: "bg-pink-50 dark:bg-pink-900/20",
    iconText: "text-pink-600",
  },
  review: {
    borderHover: "hover:border-emerald-500",
    iconWrap: "bg-emerald-50 dark:bg-emerald-900/20",
    iconText: "text-emerald-600",
  },
};

function parseAdminEmails(): Set<string> {
  const raw = String(import.meta.env.VITE_ADMIN_EMAILS || "").trim();
  const set = new Set<string>();
  if (!raw) return set;
  raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .forEach((x) => set.add(x));
  return set;
}

const MyPageOverview = () => {
  const { initialized, loading, user, refreshClaims } = useAuthStore();
  const authReady = initialized && !loading;

  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["myProfile"],
    queryFn: getMyProfile,
    enabled: authReady && !!user?.uid,
    retry: false,
  });

  const { data: summary } = useQuery({
    queryKey: ["userSummary"],
    queryFn: getUserActivitySummary,
    enabled: authReady && !!user?.uid,
    retry: false,
  });

  const claims: any = (user as any)?.claims || {};
  const isSuperAdmin = claims?.superAdmin === true;
  const isAdmin = claims?.admin === true || claims?.isAdmin === true || isSuperAdmin;

  const allowlistAdmin = useMemo(() => {
    const allow = parseAdminEmails();
    const email = String(user?.email || "").toLowerCase();
    return !!email && allow.has(email);
  }, [user?.email]);

  const counts = useMemo(() => {
    const coupon = Number((summary as any)?.couponCount ?? 0);
    const favorite = Number((summary as any)?.favoriteCount ?? 0);
    const review = Number((summary as any)?.reviewCount ?? 0);
    return { coupon, favorite, review, total: coupon + favorite + review };
  }, [summary]);

  const onRefresh = async () => {
    setMsg(null);
    setBusy(true);
    try {
      await refreshClaims();
      setMsg("✅ 권한 정보를 새로고침했습니다.");
    } catch (e: any) {
      setMsg(`❌ 새로고침 실패: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  if (!authReady) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return <div className="p-10 text-center text-gray-500">로그인이 필요합니다.</div>;
  }

  const nickname =
    (profile as any)?.nickname ||
    user.displayName ||
    (user.email ? user.email.split("@")[0] : "User");

  const email = user.email ?? (profile as any)?.email ?? "";
  const avatar =
    (profile as any)?.photoURL ||
    (profile as any)?.avatar ||
    (user as any)?.photoURL ||
    DEFAULT_AVATAR;

  const membership = (profile as any)?.membership || (profile as any)?.grade || "Explorer";
  const roleLabel = isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "User";

  return (
    <div className="space-y-8 pb-10">
      {/* 0) 운영 진단 메시지 */}
      {(allowlistAdmin && !isAdmin) && (
        <div className="p-4 rounded-2xl border border-yellow-200 bg-yellow-50 text-yellow-900">
          <div className="font-extrabold text-sm">⚠️ 관리자 이메일로 보이는데, 토큰 claims가 없습니다</div>
          <div className="text-xs mt-1 leading-relaxed">
            현재 계정은 allowlist(VITE_ADMIN_EMAILS)에는 포함되어 있지만,
            <b> Custom Claims(admin/superAdmin)</b>이 없어서 /admin은 막힙니다.
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={onRefresh}
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-black text-white text-sm hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "처리 중..." : "권한 새로고침"}
            </button>
            <Link
              to="/forbidden"
              className="px-4 py-2 rounded-xl border border-yellow-300 text-sm hover:bg-yellow-100"
            >
              Forbidden 페이지로
            </Link>
          </div>

          {msg && <div className="mt-3 text-xs opacity-90">{msg}</div>}
        </div>
      )}

      {/* 1) 프로필/권한 카드 */}
      <div
        className={`relative w-full h-60 rounded-2xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.01] ${
          isAdmin
            ? "bg-gradient-to-r from-gray-900 to-black border border-yellow-600"
            : "bg-gradient-to-r from-purple-900 to-indigo-900"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent" />

        <div className="absolute top-6 left-6 flex items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 backdrop-blur-md">
            <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {nickname}
              {isAdmin && <FaCrown className="text-yellow-400 text-lg" />}
            </h2>
            <p className="text-white/70 text-sm">{email}</p>
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6 z-10">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-white/60 text-xs tracking-widest mb-1">멤버십</p>
              <p className="text-xl font-bold text-white tracking-widest">{membership}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs tracking-widest mb-1">계정 권한</p>
              <p className="text-xl font-bold text-white tracking-widest">{roleLabel}</p>
            </div>
          </div>

          {(allowlistAdmin || isAdmin || import.meta.env.DEV) && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={onRefresh}
                disabled={busy}
                className="px-3 py-1.5 rounded-xl bg-white/15 text-white text-xs hover:bg-white/20 disabled:opacity-50"
              >
                {busy ? "처리 중..." : "권한 새로고침"}
              </button>
              <span className="text-xs text-white/70">
                claims: admin={String(claims?.admin === true)}, superAdmin={String(claims?.superAdmin === true)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2) 활동 요약 */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">내 활동</h3>

        <div className="grid grid-cols-3 gap-4">
          <StatItem kind="coupon" icon={<FaTicketAlt />} value={counts.coupon} label="쿠폰" />
          <StatItem kind="favorite" icon={<FaHeart />} value={counts.favorite} label="관심 장소" />
          <StatItem kind="review" icon={<FaPen />} value={counts.review} label="내 리뷰" />
        </div>

        {counts.total === 0 && (
          <div className="mt-3 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-bold text-gray-900 dark:text-white">아직 활동이 없어요</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                추천 장소를 둘러보고 관심 장소를 저장해 보세요.
              </div>
            </div>
            <Link
              to="/spots"
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800"
            >
              추천 장소 둘러보기
            </Link>
          </div>
        )}
      </div>

      {/* 3) 관리자 메뉴 */}
      {isAdmin && (
        <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FaUserShield className="text-green-400" /> 관리자 메뉴
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/admin"
              className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition flex justify-between items-center group"
            >
              <span>대시보드</span>
              <FaChevronRight className="text-white/50 group-hover:text-white" />
            </Link>

            <Link
              to="/admin/spots/new"
              className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition flex justify-between items-center group"
            >
              <span className="inline-flex items-center gap-2">
                <FaMapMarkedAlt /> 장소 등록
              </span>
              <FaChevronRight className="text-white/50 group-hover:text-white" />
            </Link>

            <Link
              to="/admin/events"
              className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition flex justify-between items-center group"
            >
              <span className="inline-flex items-center gap-2">
                <FaCalendarAlt /> 이벤트 관리
              </span>
              <FaChevronRight className="text-white/50 group-hover:text-white" />
            </Link>

            <Link
              to="/admin/spots"
              className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition flex justify-between items-center group"
            >
              <span>장소 관리</span>
              <FaChevronRight className="text-white/50 group-hover:text-white" />
            </Link>
          </div>

          <div className="mt-4 text-xs text-white/60">
            운영자 기능은 <span className="font-semibold">/admin</span>에서 통합 관리합니다.
          </div>
        </div>
      )}
    </div>
  );
};

const StatItem = ({
  kind,
  icon,
  value,
  label,
}: {
  kind: StatKind;
  icon: React.ReactNode;
  value: number;
  label: string;
}) => {
  const s = STAT_STYLE[kind];
  return (
    <div
      className={`rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition ${s.borderHover}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconWrap}`}>
        <span className={`${s.iconText}`}>{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-extrabold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
};

export default MyPageOverview;

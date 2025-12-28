import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { useAuthStore } from "@/features/auth/stores/auth.store";

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

export default function Forbidden() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshClaims } = useAuthStore();

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fromPath = (location.state as any)?.from?.pathname || "/admin";

  const claims: any = user?.claims || {};
  const isAdmin = claims?.superAdmin === true || claims?.admin === true || claims?.isAdmin === true;

  const canSeeBootstrap = useMemo(() => {
    const allow = parseAdminEmails();
    const email = String(user?.email || "").toLowerCase();
    return !!email && allow.has(email) && !isAdmin;
  }, [user?.email, isAdmin]);

  const onRefresh = async () => {
    setMsg(null);
    setBusy(true);
    try {
      await refreshClaims();
      setMsg("✅ 토큰/권한 정보를 새로고침했습니다. 다시 시도해보세요.");
    } catch (e: any) {
      setMsg(`❌ 새로고침 실패: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const onRetry = () => {
    navigate(fromPath, { replace: true });
  };

  // 초기 1회: 서버 allowlist(BOOTSTRAP_SUPERADMIN_EMAILS)까지 통과해야 성공
  const onBootstrapSuperAdmin = async () => {
    if (!user?.uid) {
      setMsg("❌ 로그인 상태가 아닙니다.");
      return;
    }

    setMsg(null);
    setBusy(true);
    try {
      const fn = httpsCallable(functions, "setRole");
      const res: any = await fn({
        uid: user.uid,
        email: user.email || undefined,
        role: "superadmin",
        reason: "bootstrap-superadmin",
      });

      const target = res?.data?.targetUid || user.uid;
      setMsg(`✅ 부트스트랩 성공: ${target} → superAdmin`);

      await refreshClaims();
      navigate("/admin", { replace: true });
    } catch (e: any) {
      setMsg(`❌ 부트스트랩 실패: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-10">
      <div className="w-full max-w-2xl rounded-2xl border bg-white dark:bg-gray-900 p-8 shadow-sm">
        <div className="text-lg font-semibold text-gray-900 dark:text-white">접근 권한이 없습니다</div>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          이 페이지는 관리자만 접근할 수 있어요.
          <br />
          <span className="font-semibold">Custom Claims(admin/superAdmin)</span>이 없으면 /admin은 절대 열리지 않습니다.
        </div>

        {msg && (
          <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100">
            {msg}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={onRefresh}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-black text-white text-sm hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "처리 중..." : "권한 새로고침"}
          </button>

          <button
            onClick={onRetry}
            disabled={busy}
            className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            다시 시도
          </button>

          <Link to="/mypage" className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
            마이페이지로
          </Link>

          <Link to="/" className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
            홈으로
          </Link>
        </div>

        {canSeeBootstrap && (
          <div className="mt-6 p-4 rounded-2xl border border-yellow-200 bg-yellow-50 text-yellow-900">
            <div className="font-bold text-sm">초기 1회: superAdmin 부트스트랩</div>
            <div className="text-xs mt-1 opacity-90">
              이 버튼은 <b>VITE_ADMIN_EMAILS</b>에 포함된 계정에서만 보입니다.
              <br />
              서버에서도 <b>BOOTSTRAP_SUPERADMIN_EMAILS</b> allowlist가 설정되어 있어야 실제로 성공합니다.
            </div>

            <button
              onClick={onBootstrapSuperAdmin}
              disabled={busy}
              className="mt-3 px-4 py-2 rounded-xl bg-yellow-900 text-white text-sm hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "처리 중..." : "내 계정 superAdmin 초기화"}
            </button>
          </div>
        )}

        <div className="mt-6">
          <div className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2">현재 토큰 Claims</div>
          <pre className="text-xs p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-auto">
{JSON.stringify(
  {
    email: user?.email ?? null,
    uid: user?.uid ?? null,
    admin: claims?.admin === true,
    superAdmin: claims?.superAdmin === true,
    isAdmin: claims?.isAdmin === true,
    role: claims?.role ?? null,
    raw: claims ?? {},
  },
  null,
  2
)}
          </pre>
        </div>
      </div>
    </div>
  );
}

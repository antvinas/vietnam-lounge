// apps/web/src/features/admin/pages/AdminRoleManager.tsx
import { useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";
import { useAuthStore } from "@/features/auth/stores/auth.store";

type RoleInput = "user" | "admin" | "superadmin";

export default function AdminRoleManager() {
  const { user } = useAuthStore();

  const isSuperAdmin = useMemo(() => {
    const c: any = user?.claims || {};
    return c?.superAdmin === true;
  }, [user]);

  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [role, setRoleState] = useState<RoleInput>("admin");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async () => {
    setMsg(null);

    const targetEmail = email.trim();
    const targetUid = uid.trim();

    if (!targetEmail && !targetUid) {
      setMsg("email 또는 uid 중 하나는 입력해야 합니다.");
      return;
    }

    setBusy(true);
    try {
      const fn = httpsCallable(functions, "setRole");
      const res: any = await fn({
        email: targetEmail || undefined,
        uid: targetUid || undefined,
        role,
      });

      const target = res?.data?.targetUid || "(unknown)";
      setMsg(`✅ 완료: ${target} → ${role}`);

      // 본인 권한 바꾼 경우 토큰 강제 갱신(화면/가드 즉시 반영)
      if (auth.currentUser?.uid && auth.currentUser.uid === target) {
        await auth.currentUser.getIdToken(true);
      }
    } catch (e: any) {
      setMsg(`❌ 실패: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-extrabold mb-2">관리자 권한 관리</h1>
        <p className="text-sm text-gray-600 mb-4">
          운영 표준: Firebase Custom Claims 기반으로 role/admin 권한을 관리합니다. (superAdmin만 변경 가능)
        </p>

        {!isSuperAdmin && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            현재 계정은 <b>superAdmin</b>이 아닙니다. 권한 변경은 불가합니다.
            <br />
            (초기 1회는 tools/setAdminClaims.mjs로 superAdmin 부여 후 사용하세요)
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-700">대상 Email (선택)</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@email.com"
              className="mt-1 w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              disabled={busy}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700">대상 UID (선택)</label>
            <input
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Firebase UID"
              className="mt-1 w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              disabled={busy}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700">권한(Role)</label>
            <select
              value={role}
              onChange={(e) => setRoleState(e.target.value as RoleInput)}
              className="mt-1 w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              disabled={busy}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
              <option value="superadmin">superadmin</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={onSubmit}
              disabled={!isSuperAdmin || busy}
              className="w-full h-10 rounded-xl bg-blue-600 text-white font-extrabold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "처리 중..." : "권한 변경 실행"}
            </button>
          </div>
        </div>

        {msg && (
          <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

// apps/web/src/features/admin/components/users/UserDrawer.tsx
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import type { UsersTableUser } from "@/features/admin/components/users/UsersTable";

type Props = {
  open: boolean;
  user: UsersTableUser | null;
  onClose: () => void;
  onRoleChange: (role: "admin" | "user") => void;
  onStatusChange: (status: "active" | "banned") => void;
  onDelete: () => void;
};

function safeDate(value: any): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && typeof value.seconds === "number") {
    const d = new Date(value.seconds * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function formatDate(value: any) {
  const d = safeDate(value);
  return d ? d.toLocaleString() : "-";
}

function providerLabel(providerId?: string | null) {
  const p = String(providerId || "").toLowerCase();
  if (!p) return "-";
  if (p.includes("google")) return "Google";
  if (p.includes("facebook")) return "Facebook";
  if (p.includes("apple")) return "Apple";
  if (p.includes("github")) return "GitHub";
  if (p === "password") return "Email/Password";
  return providerId || "-";
}

function Badge({
  tone = "gray",
  children,
}: {
  tone?: "gray" | "green" | "red" | "blue" | "black";
  children: React.ReactNode;
}) {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "red"
        ? "bg-red-50 text-red-700 border-red-200"
        : tone === "blue"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : tone === "black"
            ? "bg-black/5 text-gray-900 border-gray-300"
            : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-extrabold border ${cls}`}>
      {children}
    </span>
  );
}

async function copyToClipboard(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} 복사 완료`);
  } catch {
    toast.error("복사 실패 (브라우저 권한을 확인해주세요)");
  }
}

export default function UserDrawer({ open, user, onClose, onRoleChange, onStatusChange, onDelete }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const vm = useMemo(() => {
    const u: any = user || {};
    const role = String(u._role || u.role || "user");
    const status = String(u._status || u.status || "active");
    const isSuper = !!u._isSuperAdmin || role === "superAdmin";
    return {
      uid: String(u.id || ""),
      email: String(u.email || ""),
      name: String(u._displayName || u.nickname || u.displayName || "-"),
      role,
      status,
      isSuper,
      createdAt: u.createdAt ?? u._createdAtLabel,
      lastLoginAt: u.lastLoginAt,
      providerId: u.providerId,
      phoneNumber: u.phoneNumber,
      photoURL: u.photoURL,
      adminMemo: u.adminMemo,
    };
  }, [user]);

  if (!open) return null;

  const roleTone = vm.role === "superAdmin" ? "black" : vm.role === "admin" ? "blue" : "gray";
  const statusTone = vm.status === "banned" ? "red" : "green";

  const roleLabel =
    vm.role === "superAdmin" ? "슈퍼관리자" : vm.role === "admin" ? "관리자" : vm.role === "manager" ? "매니저" : "일반";
  const statusLabel = vm.status === "banned" ? "차단" : "활성";

  const canMutate = !!user && !vm.isSuper;

  return (
    <div className="fixed inset-0 z-40">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-gray-500">회원 상세</div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <div className="text-lg font-extrabold text-gray-900 truncate">{vm.name}</div>
              <Badge tone={statusTone as any}>{statusLabel}</Badge>
              <Badge tone={roleTone as any}>{roleLabel}</Badge>
            </div>
            <div className="text-sm text-gray-500 truncate">{vm.email || "-"}</div>

            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => vm.uid && copyToClipboard("UID", vm.uid)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800"
                disabled={!vm.uid}
                title="UID 복사"
              >
                UID 복사
              </button>

              <button
                onClick={() => vm.email && copyToClipboard("이메일", vm.email)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800"
                disabled={!vm.email}
                title="이메일 복사"
              >
                이메일 복사
              </button>

              <Link
                to={`/admin/audit-logs?q=${encodeURIComponent(vm.uid || "")}`}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white"
                title="해당 UID로 감사로그 필터링"
              >
                감사로그 보기
              </Link>
            </div>
          </div>

          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-auto">
          {/* Account */}
          <section className="rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-extrabold text-gray-800 mb-3">계정 정보</div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-gray-500">UID</div>
              <div className="col-span-2 font-mono text-gray-800 break-all">{vm.uid || "-"}</div>

              <div className="text-gray-500">Provider</div>
              <div className="col-span-2 text-gray-800">{providerLabel(vm.providerId)}</div>

              <div className="text-gray-500">가입일</div>
              <div className="col-span-2 text-gray-800">{user?._createdAtLabel || formatDate(vm.createdAt)}</div>

              <div className="text-gray-500">최근 로그인</div>
              <div className="col-span-2 text-gray-800">{formatDate(vm.lastLoginAt)}</div>

              <div className="text-gray-500">연락처</div>
              <div className="col-span-2 text-gray-800">{vm.phoneNumber || "-"}</div>
            </div>
          </section>

          {/* Ops */}
          <section className="rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-extrabold text-gray-800 mb-3">운영 메모</div>

            {vm.adminMemo ? (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-800 whitespace-pre-wrap">
                {String(vm.adminMemo)}
              </div>
            ) : (
              <div className="text-sm text-gray-500">저장된 운영 메모가 없습니다.</div>
            )}

            <p className="text-xs text-gray-400 mt-2">
              * 차단/해제/권한변경 시 “사유(메모)”를 남기면 이후 감사 대응이 쉬워집니다.
            </p>
          </section>

          {/* Actions */}
          <section className="rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-extrabold text-gray-800 mb-3">관리 작업</div>

            {user && vm.isSuper ? (
              <div className="text-sm text-gray-600">
                <span className="font-bold">슈퍼관리자</span> 계정은 이 화면에서 변경할 수 없습니다.
              </div>
            ) : null}

            <div className="flex flex-col gap-2 mt-2">
              {/* Status */}
              <button
                onClick={() => onStatusChange(vm.status === "banned" ? "active" : "banned")}
                disabled={!canMutate}
                className={[
                  "w-full px-3 py-2 rounded-lg text-sm font-extrabold border",
                  !canMutate ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "",
                  vm.status === "banned"
                    ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                    : "bg-red-50 text-red-700 hover:bg-red-100 border-red-200",
                ].join(" ")}
              >
                {vm.status === "banned" ? "차단 해제" : "차단"}
              </button>

              {/* Role */}
              <button
                onClick={() => onRoleChange(vm.role === "admin" ? "user" : "admin")}
                disabled={!canMutate}
                className={[
                  "w-full px-3 py-2 rounded-lg text-sm font-extrabold border",
                  !canMutate ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "",
                  vm.role === "admin"
                    ? "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200",
                ].join(" ")}
              >
                {vm.role === "admin" ? "관리자 해제" : "관리자 지정"}
              </button>

              {/* Delete */}
              <button
                onClick={onDelete}
                className="w-full px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-extrabold"
              >
                계정 삭제 (위험)
              </button>

              <p className="text-xs text-gray-500">
                삭제/권한변경/차단은 운영 사고로 이어질 수 있어요. 실 서비스에서는 “사유 입력 + 감사로그”를 강제하는 것을 권장합니다.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

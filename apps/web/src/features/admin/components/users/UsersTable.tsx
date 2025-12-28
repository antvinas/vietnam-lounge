// apps/web/src/features/admin/components/users/UsersTable.tsx
import { useEffect, useMemo, useRef } from "react";
import type { User } from "@/types/user";
import UserActionsMenu from "@/features/admin/components/users/UserActionsMenu";

export type UsersTableUser = User & {
  _displayName: string;
  _role: string;
  _status: string;
  _isSuperAdmin: boolean;
  _createdAtLabel: string;
};

export type HeaderCheckboxState = {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
};

type Props = {
  users: UsersTableUser[];
  focusId?: string;

  // ✅ ManageUsers(useRowSelection)에서 내려주는 헤더 체크박스 상태
  headerCheckbox?: HeaderCheckboxState;

  // ✅ selection 유틸
  isSelected: (id: string) => boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;

  // ✅ Row 행동
  onRowClick: (id: string) => void;

  // ✅ 하이리스크 액션은 “모달 요청”으로만
  onRequestRoleChange: (id: string) => void;
  onRequestStatusChange: (id: string, status: "active" | "banned") => void;
  onDelete: (id: string) => void;
};

function roleKorean(role: string) {
  if (role === "superAdmin") return "슈퍼관리자";
  if (role === "admin") return "관리자";
  return "일반";
}

function Badge({ tone, children }: { tone: "gray" | "green" | "red" | "black"; children: any }) {
  const cls =
    tone === "green"
      ? "bg-green-100 text-green-700"
      : tone === "red"
        ? "bg-red-100 text-red-700"
        : tone === "black"
          ? "bg-black/10 text-gray-900"
          : "bg-gray-100 text-gray-700";
  return <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-semibold ${cls}`}>{children}</span>;
}

export default function UsersTable({
  users,
  focusId,
  headerCheckbox,
  isSelected,
  onToggleSelect,
  onToggleSelectAll,
  onRowClick,
  onRequestRoleChange,
  onRequestStatusChange,
  onDelete,
}: Props) {
  // ✅ headerCheckbox가 undefined여도 터지지 않게 “기본값” 제공
  const header = headerCheckbox ?? {
    checked: false,
    indeterminate: false,
    disabled: users.length === 0,
  };

  // ✅ indeterminate는 반드시 effect에서(ref 존재 이후) 세팅
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = Boolean(header.indeterminate);
  }, [header.indeterminate]);

  const rows = useMemo(() => users ?? [], [users]);

  // ✅ 런타임 가드(콘솔 에러 폭발 방지)
  const safeIsSelected = (id: string) => (typeof isSelected === "function" ? isSelected(id) : false);
  const safeToggleSelect = (id: string) => {
    if (typeof onToggleSelect === "function") onToggleSelect(id);
  };
  const safeToggleSelectAll = () => {
    if (typeof onToggleSelectAll === "function") onToggleSelectAll();
  };
  const safeRowClick = (id: string) => {
    if (typeof onRowClick === "function") onRowClick(id);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
          <tr>
            <th className="px-4 py-4 font-semibold w-[44px]">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={header.checked}
                disabled={header.disabled}
                onChange={safeToggleSelectAll}
                aria-label="전체 선택"
                className="h-4 w-4 disabled:opacity-40"
              />
            </th>
            <th className="px-6 py-4 font-semibold">닉네임 / 이메일</th>
            <th className="px-6 py-4 font-semibold">가입일</th>
            <th className="px-6 py-4 font-semibold">권한</th>
            <th className="px-6 py-4 font-semibold">상태</th>
            <th className="px-6 py-4 font-semibold text-center w-[84px]">관리</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {rows.map((user) => {
            const isFocus = !!focusId && user.id === focusId;
            const checked = safeIsSelected(user.id);

            const roleRaw = String((user as any).role || user._role || "user");
            const roleLabel = roleKorean(user._isSuperAdmin ? "superAdmin" : roleRaw);

            // ✅ deleted 판정 강화: status === deleted OR deletedAt 존재
            const deletedAt = (user as any).deletedAt ?? (user as any).deleted_at ?? null;
            const statusRaw = String((user as any).status || user._status || (deletedAt ? "deleted" : "active"));
            const isDeleted = statusRaw === "deleted" || Boolean(deletedAt);

            // ✅ 선택 불가 대상(사고 방지): 슈퍼관리자 + 삭제된 계정
            const disableSelect = user._isSuperAdmin || isDeleted;

            return (
              <tr
                key={user.id}
                id={`user-row-${user.id}`}
                className={[
                  "hover:bg-gray-50 transition cursor-pointer",
                  isFocus ? "bg-yellow-50 ring-2 ring-yellow-200" : "",
                  checked ? "bg-blue-50/40" : "",
                  isDeleted ? "opacity-70" : "",
                ].join(" ")}
                onClick={() => safeRowClick(user.id)}
              >
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disableSelect}
                    onChange={() => safeToggleSelect(user.id)}
                    aria-label={`선택 ${user._displayName}`}
                    className="h-4 w-4 disabled:opacity-40"
                    title={
                      user._isSuperAdmin
                        ? "슈퍼관리자는 선택/벌크 대상에서 제외됩니다."
                        : isDeleted
                          ? "삭제된 계정은 선택/벌크 대상에서 제외됩니다."
                          : undefined
                    }
                  />
                </td>

                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{user._displayName}</div>
                  <div className="text-sm text-gray-500">{user.email || "-"}</div>
                  <div className="text-[11px] text-gray-400 font-mono mt-1">{user.id}</div>
                </td>

                <td className="px-6 py-4 text-sm text-gray-500">{user._createdAtLabel}</td>

                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  {user._isSuperAdmin ? <Badge tone="black">슈퍼관리자</Badge> : <Badge tone="gray">{roleLabel}</Badge>}
                </td>

                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  {isDeleted ? (
                    <Badge tone="gray">삭제</Badge>
                  ) : statusRaw === "banned" ? (
                    <Badge tone="red">차단</Badge>
                  ) : (
                    <Badge tone="green">활성</Badge>
                  )}
                </td>

                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                  {isDeleted ? (
                    // ✅ 삭제 계정은 액션 메뉴를 “원천 차단” (active로 잘못 처리되는 사고 방지)
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => safeRowClick(user.id)}
                        className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                        title="상세 보기"
                      >
                        보기
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(user.id)}
                        className="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50"
                        title="삭제(정리) 작업"
                      >
                        삭제
                      </button>
                    </div>
                  ) : (
                    <UserActionsMenu
                      userId={user.id}
                      isSuperAdmin={user._isSuperAdmin}
                      status={statusRaw === "banned" ? "banned" : "active"}
                      onOpen={() => safeRowClick(user.id)}
                      onRequestRoleChange={() => onRequestRoleChange(user.id)}
                      onActivate={() => onRequestStatusChange(user.id, "active")}
                      onBan={() => onRequestStatusChange(user.id, "banned")}
                      onDelete={() => onDelete(user.id)}
                    />
                  )}
                </td>
              </tr>
            );
          })}

          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                조건에 맞는 회원이 없습니다.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

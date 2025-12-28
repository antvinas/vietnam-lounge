// apps/web/src/features/admin/pages/ManageUsers.tsx
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import toast from "react-hot-toast";

import { safeDelete, safeGet, safePatch, normalizeText } from "@/features/admin/api/http";

import UsersTable, { type UsersTableUser } from "@/features/admin/components/users/UsersTable";
import BulkActionBar from "@/features/admin/components/users/BulkActionBar";
import UserDrawer from "@/features/admin/components/users/UserDrawer";

import { useRowSelection } from "@/features/admin/hooks/useRowSelection";

type Role = "superAdmin" | "admin" | "user";
type Status = "active" | "banned" | "deleted";

type ActionState =
  | null
  | {
      kind: "role";
      ids: string[];
      nextRole: "admin" | "user";
      reason: string;
    }
  | {
      kind: "status";
      ids: string[];
      nextStatus: "active" | "banned";
      reason: string;
    }
  | {
      kind: "delete";
      ids: string[];
      reason: string;
      hard: boolean;
      confirmText: string;
    };

function clampInt(value: string, min: number, max: number, fallback: number) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

function useDebouncedValue<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

function roleLabel(role: Role) {
  if (role === "superAdmin") return "슈퍼관리자";
  if (role === "admin") return "관리자";
  return "일반";
}

function statusLabel(status: Status) {
  if (status === "banned") return "차단";
  if (status === "deleted") return "삭제";
  return "활성";
}

function formatDate(v: any) {
  if (!v) return "-";
  try {
    const d = typeof v === "number" ? new Date(v) : new Date(String(v));
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  } catch {
    return "-";
  }
}

function ModalFrame({
  title,
  description,
  children,
  onClose,
  confirmLabel,
  confirmDanger,
  confirmDisabled,
  onConfirm,
  busy,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  confirmLabel: string;
  confirmDanger?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>
            {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
          </div>

          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="닫기"
            disabled={busy}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">{children}</div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-semibold"
            disabled={busy}
            type="button"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled || busy}
            className={[
              "px-4 py-2 rounded-lg text-sm font-extrabold",
              confirmDanger ? "bg-red-600 text-white hover:bg-red-700" : "bg-blue-600 text-white hover:bg-blue-700",
              confirmDisabled || busy ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
            type="button"
          >
            {busy ? "처리 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageUsers() {
  // ---------------------------
  // URL -> initial query state
  // ---------------------------
  const sp = new URLSearchParams(window.location.search);

  const initialQ = sp.get("q") || "";
  const initialRole = sp.get("role") || "all";
  const initialStatus = sp.get("status") || "all";
  const initialSort = sp.get("sort") || "createdAt";
  const initialDir = sp.get("dir") || "desc";
  const initialLimit = clampInt(sp.get("limit") || "50", 10, 200, 50);
  const initialCursor = sp.get("cursor");
  const initialFocus = sp.get("focus");

  // ---------------------------
  // query state
  // ---------------------------
  const [q, setQ] = useState(initialQ);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [sort, setSort] = useState(initialSort);
  const [dir, setDir] = useState(initialDir);
  const [limit, setLimit] = useState(initialLimit);

  // cursor paging
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [cursorStack, setCursorStack] = useState<string[]>([]);

  // focus/drawer
  const [focusId, setFocusId] = useState<string | null>(initialFocus);
  const [drawerUserId, setDrawerUserId] = useState<string | null>(initialFocus);

  const debouncedQ = useDebouncedValue(q, 250);

  // ---------------------------
  // data state
  // ---------------------------
  const [users, setUsers] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // action modal
  const [action, setAction] = useState<ActionState>(null);
  const [isMutating, setIsMutating] = useState(false);

  // ✅ fetch 중복/레이스 방지 (StrictMode/빠른 필터 변경 시 콘솔/토스트 중복 완화)
  const reqSeqRef = useRef(0);

  // ---------------------------
  // URL sync (운영툴 느낌: 새로고침/공유 가능)
  // ---------------------------
  useEffect(() => {
    const p = new URLSearchParams();

    if (q.trim()) p.set("q", q.trim());
    if (roleFilter !== "all") p.set("role", roleFilter);
    if (statusFilter !== "all") p.set("status", statusFilter);
    if (sort !== "createdAt") p.set("sort", sort);
    if (dir !== "desc") p.set("dir", dir);
    if (limit !== 50) p.set("limit", String(limit));

    if (cursor) p.set("cursor", cursor);
    if (focusId) p.set("focus", focusId);

    const url = `${window.location.pathname}?${p.toString()}`;
    window.history.replaceState(null, "", url);
  }, [q, roleFilter, statusFilter, sort, dir, limit, cursor, focusId]);

  // ---------------------------
  // normalize rows (table-friendly)
  // ---------------------------
  const normalizedUsers: UsersTableUser[] = useMemo(() => {
    return (users || []).map((u: any) => {
      const id = String(u?.id || u?.uid || "");
      const displayName = String(u?.nickname || u?.displayName || u?.name || u?.email || id || "Unknown").trim();

      const isSuperAdmin = Boolean(u?.roles?.superAdmin === true);
      const isAdmin = Boolean(u?.isAdmin === true || u?.roles?.admin === true);

      const role: Role = isSuperAdmin ? "superAdmin" : isAdmin ? "admin" : "user";
      const status: Status = (u?.status as Status) || "active";

      const createdAt = u?.createdAt || u?.created_at || u?.created || u?.createdTime;
      const createdAtLabel = formatDate(createdAt);

      return {
        ...(u as any),
        id,
        _displayName: displayName,
        _role: role,
        _status: status,
        _isSuperAdmin: role === "superAdmin",
        _createdAtLabel: createdAtLabel,
      } as UsersTableUser;
    });
  }, [users]);

  const isSuperAdminId = useCallback(
    (id: string) => {
      const u = normalizedUsers.find((x) => x.id === id);
      return !!u?._isSuperAdmin;
    },
    [normalizedUsers]
  );

  // ---------------------------
  // selection: visible rows 기준 + 슈퍼관리자 제외
  // ---------------------------
  const selectableVisibleIds = useMemo(
    () => normalizedUsers.filter((u) => !u._isSuperAdmin).map((u) => u.id),
    [normalizedUsers]
  );

  const {
    selectedIds,
    selectedCount,
    isSelected,
    toggle: toggleSelect,
    toggleVisibleAll: toggleSelectAll,
    clear: clearSelection,
    getHeaderCheckboxState,
  } = useRowSelection(selectableVisibleIds, { pruneOnVisibleChange: true });

  const locked = useMemo(() => selectedIds.some((id) => isSuperAdminId(id)), [selectedIds, isSuperAdminId]);

  // ---------------------------
  // fetch users (server query + cursor)
  // ---------------------------
  const fetchUsers = useCallback(async () => {
    const mySeq = ++reqSeqRef.current;

    setIsLoading(true);
    try {
      const params: any = {
        format: "cursor",
        limit,
        sort,
        dir,
      };

      const qq = normalizeText(debouncedQ);
      if (qq) params.q = qq;
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (cursor) params.cursor = cursor;

      const res = await safeGet<any>("admin/users", params);

      // ✅ stale response 무시
      if (mySeq !== reqSeqRef.current) return;

      // backend format=cursor => { items, nextCursor }
      const items = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
      const nc = Array.isArray(res) ? null : (res?.nextCursor ?? null);

      setUsers(items);
      setNextCursor(nc);
    } catch (e: any) {
      if (mySeq !== reqSeqRef.current) return;

      console.error(e);
      toast.error(e?.message || "회원 목록 조회 실패");
      setUsers([]);
      setNextCursor(null);
    } finally {
      if (mySeq !== reqSeqRef.current) return;
      setIsLoading(false);
    }
  }, [debouncedQ, roleFilter, statusFilter, sort, dir, limit, cursor]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // query 변경 시: 페이지 초기화 + 선택 해제
  useEffect(() => {
    setCursor(null);
    setCursorStack([]);
    clearSelection();
  }, [debouncedQ, roleFilter, statusFilter, sort, dir, limit, clearSelection]);

  // focus scroll
  useEffect(() => {
    if (!focusId) return;
    const el = document.getElementById(`user-row-${focusId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, normalizedUsers.length]);

  // drawer user
  const drawerUser = useMemo(() => {
    if (!drawerUserId) return null;
    return normalizedUsers.find((u) => u.id === drawerUserId) || null;
  }, [drawerUserId, normalizedUsers]);

  // ---------------------------
  // open/close drawer
  // ---------------------------
  const openDrawer = (id: string) => {
    setDrawerUserId(id);
    setFocusId(id);
  };

  const closeDrawer = () => {
    setDrawerUserId(null);
  };

  // ---------------------------
  // Action modal open helpers
  // ---------------------------
  const openRoleModal = (ids: string[], preset?: "admin" | "user") => {
    const targetIds = uniq(ids).filter(Boolean);
    if (!targetIds.length) return;

    if (targetIds.some((id) => isSuperAdminId(id))) {
      toast.error("슈퍼관리자는 권한 변경 대상에서 제외됩니다.");
      return;
    }

    let nextRole: "admin" | "user" = preset ?? "admin";
    if (!preset && targetIds.length === 1) {
      const u = normalizedUsers.find((x) => x.id === targetIds[0]);
      nextRole = u?._role === "admin" ? "user" : "admin";
    }

    setAction({ kind: "role", ids: targetIds, nextRole, reason: "" });
  };

  const openStatusModal = (ids: string[], nextStatus: "active" | "banned") => {
    const targetIds = uniq(ids).filter(Boolean);
    if (!targetIds.length) return;

    if (targetIds.some((id) => isSuperAdminId(id))) {
      toast.error("슈퍼관리자는 상태 변경 대상에서 제외됩니다.");
      return;
    }

    setAction({ kind: "status", ids: targetIds, nextStatus, reason: "" });
  };

  const openDeleteModal = (ids: string[]) => {
    const targetIds = uniq(ids).filter(Boolean);
    if (!targetIds.length) return;

    if (targetIds.some((id) => isSuperAdminId(id))) {
      toast.error("슈퍼관리자는 삭제 대상에서 제외됩니다.");
      return;
    }

    setAction({ kind: "delete", ids: targetIds, reason: "", hard: false, confirmText: "" });
  };

  // UsersTable에서 호출되는 요청들
  const requestRoleChange = (id: string) => openRoleModal([id]);
  const requestStatusChange = (id: string, next: "active" | "banned") => openStatusModal([id], next);
  const requestDelete = (id: string) => openDeleteModal([id]);

  // ---------------------------
  // backend mutations
  // ---------------------------
  const applyRoleChange = async (ids: string[], nextRole: "admin" | "user", reason: string) => {
    await Promise.all(
      ids.map((uid) =>
        safePatch<{ ok: true }>(`admin/users/${uid}/role`, {
          admin: nextRole === "admin",
          reason,
        })
      )
    );

    // optimistic patch
    setUsers((prev: any[]) =>
      prev.map((u: any) => {
        const id = String(u?.id || u?.uid || "");
        if (!ids.includes(id)) return u;

        const roles = u.roles || {};
        return {
          ...u,
          isAdmin: nextRole === "admin",
          roles: { ...roles, admin: nextRole === "admin", superAdmin: false },
          role: nextRole,
        };
      })
    );
  };

  const applyStatusChange = async (ids: string[], nextStatus: "active" | "banned", reason: string) => {
    await Promise.all(
      ids.map((uid) =>
        safePatch<{ ok: true }>(`admin/users/${uid}/status`, {
          active: nextStatus === "active",
          memo: reason,
          reason,
        })
      )
    );

    setUsers((prev: any[]) =>
      prev.map((u: any) => {
        const id = String(u?.id || u?.uid || "");
        if (!ids.includes(id)) return u;
        return {
          ...u,
          status: nextStatus,
          adminMemo: reason || null,
        };
      })
    );
  };

  const applyDelete = async (ids: string[], reason: string, hard: boolean) => {
    await Promise.all(ids.map((uid) => safeDelete(`admin/users/${uid}`, { reason, hard })));

    // soft delete면 status=deleted가 되어서 기본 list(all)에서 사라질 수 있음(backend가 숨김)
    setUsers((prev: any[]) => prev.filter((u: any) => !ids.includes(String(u?.id || u?.uid || ""))));

    if (drawerUserId && ids.includes(drawerUserId)) {
      closeDrawer();
      setFocusId(null);
    }

    clearSelection();
  };

  const confirmAction = async () => {
    if (!action) return;

    const ids = uniq(action.ids);
    if (!ids.length) return;

    const reason = action.reason.trim();

    // validation
    if (action.kind === "role" || action.kind === "status") {
      if (!reason) {
        toast.error("사유를 입력해주세요. (감사로그/운영 기준)");
        return;
      }
    }
    if (action.kind === "delete") {
      if (!reason) {
        toast.error("삭제 사유를 입력해주세요.");
        return;
      }
      if (action.confirmText !== "DELETE") {
        toast.error('삭제 확인을 위해 "DELETE" 를 입력해주세요.');
        return;
      }
    }

    try {
      setIsMutating(true);

      if (action.kind === "role") {
        await applyRoleChange(ids, action.nextRole, reason);
        toast.success("권한이 변경되었습니다.");
      } else if (action.kind === "status") {
        await applyStatusChange(ids, action.nextStatus, reason);
        toast.success(action.nextStatus === "banned" ? "유저가 차단되었습니다." : "유저가 활성화되었습니다.");
      } else if (action.kind === "delete") {
        await applyDelete(ids, reason, action.hard);
        toast.success(action.hard ? "유저가 영구 삭제되었습니다." : "유저가 삭제(소프트) 처리되었습니다.");
      }

      setAction(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "요청 처리 실패 (권한/네트워크 확인)");
    } finally {
      setIsMutating(false);
    }
  };

  // ---------------------------
  // CSV export
  // ---------------------------
  const exportCsv = (onlySelected: boolean) => {
    const selectedSet = new Set(selectedIds);

    const rows = normalizedUsers.filter((u) => (onlySelected ? selectedSet.has(u.id) : true));
    if (!rows.length) {
      toast.error("내보낼 데이터가 없습니다.");
      return;
    }

    const header = ["uid", "email", "displayName", "role", "status", "createdAt"];
    const escape = (v: any) => {
      const s = String(v ?? "");
      if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const body = rows.map((u) =>
      [u.id, u.email || "", u._displayName || "", u._role || "", u._status || "", u._createdAtLabel || ""]
        .map(escape)
        .join(",")
    );

    const csv = [header.join(","), ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = onlySelected ? "users_selected.csv" : "users_page.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast.success(onlySelected ? "선택 회원 CSV를 내보냈습니다." : "현재 페이지 CSV를 내보냈습니다.");
  };

  // ---------------------------
  // paging controls
  // ---------------------------
  const goNext = () => {
    if (!nextCursor) return;
    setCursorStack((prev) => [...prev, cursor ?? ""]);
    setCursor(nextCursor);
  };

  const goPrev = () => {
    if (!cursorStack.length) return;
    const last = cursorStack[cursorStack.length - 1];
    setCursorStack((prev) => prev.slice(0, -1));
    setCursor(last ? last : null);
  };

  // ---------------------------
  // render
  // ---------------------------
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-4">
      <h1 className="sr-only">회원 관리</h1>

      {/* Top controls */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          {focusId ? (
            <p className="text-xs text-gray-500">
              포커스: <span className="font-mono">{focusId}</span>
            </p>
          ) : null}
          <p className="text-xs text-gray-400 mt-1">권한/차단/삭제는 “사유 입력 + 확인”으로만 처리됩니다. (운영툴 표준)</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400" aria-hidden="true">
              ⌕
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="검색 (닉네임/이메일)"
              className="w-72 pl-9 pr-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 outline-none text-sm"
          >
            <option value="all">권한: 전체</option>
            <option value="superAdmin">슈퍼관리자</option>
            <option value="admin">관리자</option>
            <option value="user">일반회원</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 outline-none text-sm"
          >
            <option value="all">상태: 전체</option>
            <option value="active">{statusLabel("active")}</option>
            <option value="banned">{statusLabel("banned")}</option>
            <option value="deleted">{statusLabel("deleted")}</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 outline-none text-sm"
            title="정렬"
          >
            <option value="createdAt">정렬: 가입일</option>
            <option value="updatedAt">정렬: 최근 업데이트</option>
            <option value="emailLower">정렬: 이메일</option>
            <option value="nicknameLower">정렬: 닉네임</option>
          </select>

          <select
            value={dir}
            onChange={(e) => setDir(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 outline-none text-sm"
            title="정렬 방향"
          >
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>

          <select
            value={String(limit)}
            onChange={(e) => setLimit(clampInt(e.target.value, 10, 200, 50))}
            className="px-3 py-2 rounded-lg border border-gray-300 outline-none text-sm"
            title="페이지 당 개수"
          >
            <option value="20">20개</option>
            <option value="50">50개</option>
            <option value="100">100개</option>
            <option value="200">200개</option>
          </select>

          <button
            onClick={() => exportCsv(false)}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
            type="button"
          >
            CSV(페이지)
          </button>

          <button
            onClick={() => exportCsv(true)}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
            disabled={selectedCount === 0}
            title={selectedCount === 0 ? "선택된 회원이 없습니다." : "선택 회원 CSV 내보내기"}
            type="button"
          >
            CSV(선택)
          </button>

          <button
            onClick={() => {
              setCursor(null);
              setCursorStack([]);
              fetchUsers();
            }}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
            type="button"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* Paging */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={goPrev}
          disabled={cursorStack.length === 0 || isLoading}
          className={[
            "px-3 py-2 rounded-lg border text-sm font-semibold",
            cursorStack.length === 0 || isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50",
          ].join(" ")}
          type="button"
        >
          이전
        </button>

        <button
          onClick={goNext}
          disabled={!nextCursor || isLoading}
          className={[
            "px-3 py-2 rounded-lg border text-sm font-semibold",
            !nextCursor || isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50",
          ].join(" ")}
          type="button"
        >
          다음
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-500">로딩 중...</div>
        ) : (
          <UsersTable
            users={normalizedUsers}
            focusId={focusId || undefined}
            headerCheckbox={getHeaderCheckboxState()}
            isSelected={isSelected}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onRowClick={openDrawer}
            onRequestRoleChange={requestRoleChange}
            onRequestStatusChange={requestStatusChange}
            onDelete={requestDelete}
          />
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedCount > 0 ? (
        <BulkActionBar
          selectedCount={selectedCount}
          locked={locked}
          onClear={clearSelection}
          onExportCsv={() => exportCsv(true)}
          onRequestActivate={() => openStatusModal(selectedIds, "active")}
          onRequestBan={() => openStatusModal(selectedIds, "banned")}
          onRequestRoleAdmin={() => openRoleModal(selectedIds, "admin")}
          onRequestRoleUser={() => openRoleModal(selectedIds, "user")}
          onDelete={() => openDeleteModal(selectedIds)}
        />
      ) : null}

      {/* Drawer */}
      <UserDrawer
        open={!!drawerUserId && !!drawerUser}
        user={drawerUser}
        onClose={() => {
          closeDrawer();
          // drawer 닫아도 포커스 유지하고 싶으면 아래 줄 주석 처리
          // setFocusId(null);
        }}
        onRoleChange={(r) => drawerUserId && openRoleModal([drawerUserId], r)}
        onStatusChange={(s) => drawerUserId && openStatusModal([drawerUserId], s)}
        onDelete={() => drawerUserId && openDeleteModal([drawerUserId])}
      />

      {/* Action Modal */}
      {action?.kind === "role" ? (
        <ModalFrame
          title="권한 변경"
          description={`대상 ${action.ids.length}명 · 사유 입력은 필수입니다.`}
          onClose={() => {
            if (!isMutating) setAction(null);
          }}
          confirmLabel="변경 확정"
          confirmDisabled={!action.reason.trim()}
          onConfirm={confirmAction}
          busy={isMutating}
        >
          <div className="rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm text-gray-700">
            <div className="font-semibold">변경 내용</div>
            <div className="mt-2 flex items-center gap-2">
              <span>권한을</span>
              <select
                value={action.nextRole}
                onChange={(e) => setAction({ ...action, nextRole: e.target.value as "admin" | "user" })}
                className="px-2 py-1 rounded border border-gray-300 bg-white text-sm font-bold"
                disabled={isMutating}
              >
                <option value="user">{roleLabel("user")}</option>
                <option value="admin">{roleLabel("admin")}</option>
              </select>
              <span>로 변경</span>
            </div>
          </div>

          <label className="block mt-4 text-sm font-semibold text-gray-800">사유 (필수)</label>
          <textarea
            className="mt-2 w-full h-28 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            placeholder="예: 운영자 권한 부여 (업무 담당자 변경)"
            value={action.reason}
            onChange={(e) => setAction({ ...action, reason: e.target.value })}
            disabled={isMutating}
          />
        </ModalFrame>
      ) : null}

      {action?.kind === "status" ? (
        <ModalFrame
          title={action.nextStatus === "banned" ? "회원 차단" : "회원 활성화"}
          description={`대상 ${action.ids.length}명 · 상태를 "${statusLabel(action.nextStatus)}"로 변경합니다.`}
          onClose={() => {
            if (!isMutating) setAction(null);
          }}
          confirmLabel={action.nextStatus === "banned" ? "차단 확정" : "활성화 확정"}
          confirmDanger={action.nextStatus === "banned"}
          confirmDisabled={!action.reason.trim()}
          onConfirm={confirmAction}
          busy={isMutating}
        >
          <div
            className={[
              "rounded-lg border p-3 text-sm",
              action.nextStatus === "banned"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-green-200 bg-green-50 text-green-800",
            ].join(" ")}
          >
            <div className="font-semibold">변경 내용</div>
            <div className="mt-1">
              상태를 <span className="font-extrabold">{statusLabel(action.nextStatus)}</span>로 변경합니다.
            </div>
          </div>

          <label className="block mt-4 text-sm font-semibold text-gray-800">사유 (필수)</label>
          <textarea
            className={[
              "mt-2 w-full h-28 p-3 border rounded-lg outline-none text-sm resize-none",
              action.nextStatus === "banned"
                ? "border-red-300 focus:ring-2 focus:ring-red-500"
                : "border-green-300 focus:ring-2 focus:ring-green-500",
            ].join(" ")}
            placeholder={action.nextStatus === "banned" ? "예: 신고 누적 / 욕설 / 스팸" : "예: 오탐 해제 / 제재 기간 종료"}
            value={action.reason}
            onChange={(e) => setAction({ ...action, reason: e.target.value })}
            disabled={isMutating}
          />
        </ModalFrame>
      ) : null}

      {action?.kind === "delete" ? (
        <ModalFrame
          title="회원 삭제"
          description={`대상 ${action.ids.length}명 · 기본은 “소프트 삭제(권장)” 입니다.`}
          onClose={() => {
            if (!isMutating) setAction(null);
          }}
          confirmLabel={action.hard ? "하드 삭제(매우 위험)" : "삭제(소프트) 확정"}
          confirmDanger={true}
          confirmDisabled={!action.reason.trim() || action.confirmText !== "DELETE"}
          onConfirm={confirmAction}
          busy={isMutating}
        >
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <div className="font-extrabold">주의</div>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>삭제는 운영 사고 리스크가 큰 고위험 액션입니다.</li>
              <li>기본은 소프트 삭제(로그인 차단 + 목록에서 숨김)로 처리합니다.</li>
            </ul>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              id="hard-delete"
              type="checkbox"
              checked={action.hard}
              onChange={(e) => setAction({ ...action, hard: e.target.checked })}
              disabled={isMutating}
            />
            <label htmlFor="hard-delete" className="text-sm text-gray-800">
              하드 삭제(계정/문서 영구 삭제) — 정말 필요한 경우만
            </label>
          </div>

          <label className="block mt-4 text-sm font-semibold text-gray-800">삭제 사유 (필수)</label>
          <textarea
            className="mt-2 w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm resize-none"
            placeholder="예: 탈퇴 요청 / 악성 계정 / 법적 요청"
            value={action.reason}
            onChange={(e) => setAction({ ...action, reason: e.target.value })}
            disabled={isMutating}
          />

          <label className="block mt-4 text-sm font-semibold text-gray-800">확인 입력</label>
          <input
            className="mt-2 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm font-mono"
            placeholder='삭제하려면 "DELETE" 입력'
            value={action.confirmText}
            onChange={(e) => setAction({ ...action, confirmText: e.target.value })}
            disabled={isMutating}
          />
        </ModalFrame>
      ) : null}
    </div>
  );
}

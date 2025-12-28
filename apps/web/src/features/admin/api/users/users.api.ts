// apps/web/src/features/admin/api/users/users.api.ts

import type { User } from "@/types/user";
import { safeDelete, safeGetCursor, safePatch } from "../http";

/**
 * ✅ Admin Users API
 * Backend: /api/admin/users (firebase/functions/src/api/admin/users.router.ts)
 */

export type UsersQueryStatus = "all" | "active" | "banned" | "deleted";
export type UsersQueryRole = "all" | "user" | "admin" | "superAdmin";
export type UsersQuerySort = "createdAt" | "updatedAt" | "emailLower" | "nicknameLower";
export type UsersQueryDir = "asc" | "desc";
export type UsersQueryFormat = "array" | "cursor";

export type GetUsersParams = {
  q?: string;
  status?: UsersQueryStatus;
  role?: UsersQueryRole;
  sort?: UsersQuerySort;
  dir?: UsersQueryDir;
  limit?: number;
  cursor?: string | null;
  format?: UsersQueryFormat; // array(default) | cursor
  includeDeleted?: boolean;
};

export type GetUsersResult = {
  items: User[];
  nextCursor: string | null;
};

/**
 * ✅ getUsers(params)
 * - 항상 { items, nextCursor } 로 반환 (UI에서 다루기 쉬움)
 * - format=cursor면 body에 nextCursor가 오고,
 *   format=array여도 header(x-next-cursor)로 nextCursor를 읽어준다.
 */
export async function getUsers(params?: GetUsersParams): Promise<GetUsersResult> {
  const res = await safeGetCursor<User>("admin/users", params);
  return { items: res.items, nextCursor: res.nextCursor };
}

export async function updateUserRole(uid: string, role: "admin" | "user", reason?: string) {
  if (!uid) throw new Error("uid is required");
  return await safePatch<{ ok: true }>(`admin/users/${uid}/role`, {
    admin: role === "admin",
    ...(reason ? { reason } : {}),
  });
}

export async function updateUserStatus(uid: string, status: "active" | "banned", memoOrReason?: string) {
  if (!uid) throw new Error("uid is required");
  return await safePatch<{ ok: true }>(`admin/users/${uid}/status`, {
    active: status === "active",
    ...(memoOrReason ? { memo: memoOrReason, reason: memoOrReason } : {}),
  });
}

/**
 * ✅ deleteUser
 * - users.router.ts는 query로 hard/reason을 받음
 * - safeDelete는 plain object를 params로 처리하므로 그대로 넘기면 됨
 */
export async function deleteUser(uid: string, opts?: { hard?: boolean; reason?: string }) {
  if (!uid) throw new Error("uid is required");
  const hard = Boolean(opts?.hard);
  const reason = (opts?.reason || "").trim();
  return await safeDelete<{ ok: true }>(`admin/users/${uid}`, {
    ...(hard ? { hard: "true" } : {}),
    ...(reason ? { reason } : {}),
  });
}

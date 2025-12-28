// apps/web/src/features/admin/api/events/events.api.ts
//
// ✅ 운영툴 정석
// - 관리자 Write(등록/수정/삭제/복구)는 **서버 단일 경로**(Functions/API)로만 처리
// - Firestore 클라이언트 직접 write / fallback 금지 (감사로그/검증/권한 우회 사고 방지)
// - Read(조회)는 서버 우선 + (정책상 허용 시) Firestore read-only fallback

import type { AdminEventData, AdminMode } from "../types";
import { clampInt, safeDelete, safeGet, safePost, safePut } from "../http";

import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";

// -------------------------------
// Types
// -------------------------------

export interface EventAuditLogItem {
  id: string;
  action: string;
  targetId: string;
  actorUid?: string;
  actorEmail?: string;
  ip?: string;
  userAgent?: string;
  before?: any;
  after?: any;
  createdAt?: any;
}

export interface EventAuditTrailResponse {
  items: EventAuditLogItem[];
  nextCursor: string | null;
}

// -------------------------------
// Helpers
// -------------------------------

const colForMode = (mode: AdminMode) => (mode === "nightlife" ? "adult_events" : "events");
const normalizeMode = (m: any): AdminMode => (m === "nightlife" ? "nightlife" : "explorer");

const normalizeEventDateToYmd = (d?: any): string => {
  const date = d ? new Date(d) : new Date();
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

function normalizeEventForClient(input: any): AdminEventData {
  const mode = normalizeMode(input?.mode);
  const title = String(input?.title ?? "").trim();
  const date = normalizeEventDateToYmd(input?.date);

  const status = input?.status != null ? String(input.status) : undefined;
  const visibility = input?.visibility != null ? String(input.visibility) : undefined;

  const tags = Array.isArray(input?.tags) ? input.tags.map((t: any) => String(t)).filter(Boolean) : [];

  return {
    id: input?.id ? String(input.id) : undefined,
    mode,
    title,
    date,
    ...(input?.startDate != null ? { startDate: String(input.startDate) } : {}),
    ...(input?.endDate != null ? { endDate: String(input.endDate) } : {}),
    ...(input?.startTime != null ? { startTime: String(input.startTime) } : {}),
    ...(input?.endTime != null ? { endTime: String(input.endTime) } : {}),
    ...(input?.location != null ? { location: String(input.location) } : {}),
    ...(input?.address != null ? { address: String(input.address) } : {}),
    ...(input?.description != null ? { description: String(input.description) } : {}),
    ...(input?.coverImage != null ? { coverImage: String(input.coverImage) } : {}),
    ...(typeof input?.isPublic === "boolean" ? { isPublic: input.isPublic } : {}),
    ...(typeof input?.isSponsored === "boolean" ? { isSponsored: input.isSponsored } : {}),
    ...(status ? { status } : {}),
    ...(visibility ? { visibility } : {}),
    ...(tags.length ? { tags } : {}),
    ...(input?.createdAt != null ? { createdAt: input.createdAt } : {}),
    ...(input?.updatedAt != null ? { updatedAt: input.updatedAt } : {}),
    ...(input?.deletedAt != null ? { deletedAt: input.deletedAt } : {}),
    ...(input?.deletedBy != null ? { deletedBy: input.deletedBy } : {}),
  } as AdminEventData;
}

function normalizeEventCreateForServer(input: any) {
  const mode = normalizeMode(input?.mode);
  const title = String(input?.title ?? "").trim();
  const date = normalizeEventDateToYmd(input?.date);

  return {
    mode,
    title,
    date,
    ...(input?.startDate != null ? { startDate: String(input.startDate) } : {}),
    ...(input?.endDate != null ? { endDate: String(input.endDate) } : {}),
    ...(input?.startTime != null ? { startTime: String(input.startTime) } : {}),
    ...(input?.endTime != null ? { endTime: String(input.endTime) } : {}),
    ...(input?.location != null ? { location: String(input.location) } : {}),
    ...(input?.address != null ? { address: String(input.address) } : {}),
    ...(input?.description != null ? { description: String(input.description) } : {}),
    ...(input?.coverImage != null ? { coverImage: String(input.coverImage) } : {}),
    ...(typeof input?.isPublic === "boolean" ? { isPublic: input.isPublic } : {}),
    ...(typeof input?.isSponsored === "boolean" ? { isSponsored: input.isSponsored } : {}),
    ...(input?.status != null ? { status: String(input.status) } : {}),
    ...(input?.visibility != null ? { visibility: String(input.visibility) } : {}),
    ...(Array.isArray(input?.tags) ? { tags: input.tags.map((t: any) => String(t)).filter(Boolean) } : {}),
  };
}

function normalizeEventPatchForServer(patch: Partial<AdminEventData>) {
  // ✅ 부분 업데이트 전용: undefined는 보내지 않음(데이터 덮어쓰기 사고 방지)
  const out: any = {};
  for (const [k, v] of Object.entries(patch ?? {})) {
    if (v === undefined) continue;
    if (k === "id") continue;
    if (k === "mode") out.mode = normalizeMode(v);
    else if (k === "title") out.title = String(v ?? "").trim();
    else if (k === "date") out.date = normalizeEventDateToYmd(v);
    else out[k] = v;
  }
  return out;
}

const isDeleted = (e: any) => {
  const st = String(e?.status ?? "").toLowerCase();
  return st === "deleted" || Boolean(e?.deletedAt);
};

// -------------------------------
// API
// -------------------------------

export const getEventAuditTrail = async (
  eventId: string,
  opts?: { limit?: number; cursor?: string | null }
): Promise<EventAuditTrailResponse> => {
  const limit = clampInt(opts?.limit, 10, 200, 50);
  const cursor = typeof opts?.cursor === "string" ? opts.cursor : null;

  const raw: any = await safeGet(`admin/events/${eventId}/audit`, {
    limit,
    ...(cursor ? { cursor } : {}),
  });

  const items = Array.isArray(raw?.items) ? raw.items : [];
  return {
    items: items.map((x: any) => ({
      id: String(x?.id ?? ""),
      action: String(x?.action ?? ""),
      targetId: String(x?.targetId ?? eventId),
      ...(x?.actorUid ? { actorUid: String(x.actorUid) } : {}),
      ...(x?.actorEmail ? { actorEmail: String(x.actorEmail) } : {}),
      ...(x?.ip ? { ip: String(x.ip) } : {}),
      ...(x?.userAgent ? { userAgent: String(x.userAgent) } : {}),
      ...(x?.before != null ? { before: x.before } : {}),
      ...(x?.after != null ? { after: x.after } : {}),
      ...(x?.createdAt != null ? { createdAt: x.createdAt } : {}),
    })),
    nextCursor: raw?.nextCursor == null ? null : String(raw.nextCursor),
  };
};

export const getEvents = async (opts?: { includeDeleted?: boolean }): Promise<AdminEventData[]> => {
  try {
    const raw: any = await safeGet("admin/events", {
      ...(opts?.includeDeleted ? { includeDeleted: 1 } : {}),
    });

    const rawItems = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : [];
    return rawItems.map((x: any) => normalizeEventForClient(x));
  } catch (e) {
    console.warn("[admin.api] GET admin/events failed, fallback to Firestore read-only:", e);
  }

  const fetchFrom = async (colName: string, mode: AdminMode) => {
    const snap = await getDocs(query(collection(db, colName), orderBy("createdAt", "desc")));
    return snap.docs.map((d: any) => normalizeEventForClient({ id: d.id, mode, ...d.data() }));
  };

  const [a, b] = await Promise.allSettled([
    fetchFrom("events", "explorer"),
    fetchFrom("adult_events", "nightlife"),
  ]);

  const all = [
    ...(a.status === "fulfilled" ? a.value : []),
    ...(b.status === "fulfilled" ? b.value : []),
  ];

  return opts?.includeDeleted ? all : all.filter((x) => !isDeleted(x));
};

export const getEventById = async (id: string, modeHint?: AdminMode): Promise<AdminEventData | null> => {
  const tryServer = async (mode?: AdminMode) => safeGet<any>(`admin/events/${id}`, mode ? { mode } : undefined);

  try {
    const raw = modeHint ? await tryServer(modeHint) : await tryServer();
    return raw ? normalizeEventForClient(raw) : null;
  } catch {
    if (!modeHint) {
      try { return normalizeEventForClient(await tryServer("explorer")); } catch {}
      try { return normalizeEventForClient(await tryServer("nightlife")); } catch {}
    }
  }

  if (modeHint) {
    const snap = await getDoc(doc(db, colForMode(modeHint), id));
    return snap.exists() ? normalizeEventForClient({ id, mode: modeHint, ...snap.data() }) : null;
  }

  const [ex, nl] = await Promise.allSettled([getDoc(doc(db, "events", id)), getDoc(doc(db, "adult_events", id))]);
  if (ex.status === "fulfilled" && ex.value.exists()) return normalizeEventForClient({ id, mode: "explorer", ...ex.value.data() });
  if (nl.status === "fulfilled" && nl.value.exists()) return normalizeEventForClient({ id, mode: "nightlife", ...nl.value.data() });
  return null;
};

export const addEvent = async (input: AdminEventData): Promise<{ id: string }> => {
  const payload = normalizeEventCreateForServer(input);
  const raw: any = await safePost("admin/events", payload);
  const id = String(raw?.id ?? raw?.eventId ?? raw?.data?.id ?? "").trim();
  if (!id) throw new Error("Server did not return id");
  return { id };
};

export const updateEvent = async (id: string, patch: Partial<AdminEventData>): Promise<{ ok: true }> => {
  const payload = normalizeEventPatchForServer(patch);
  await safePut(`admin/events/${id}`, payload);
  return { ok: true };
};

// ✅ Soft delete (휴지통 이동)
export const deleteEvent = async (id: string, opts?: { mode?: AdminMode }): Promise<{ ok: true }> => {
  await safeDelete(`admin/events/${id}`, { ...(opts?.mode ? { mode: opts.mode } : {}) });
  return { ok: true };
};

// ✅ Soft delete 복구
export const restoreEvent = async (id: string, opts?: { mode?: AdminMode }): Promise<{ ok: true }> => {
  await safePost(`admin/events/${id}/restore`, { ...(opts?.mode ? { mode: opts.mode } : {}) });
  return { ok: true };
};

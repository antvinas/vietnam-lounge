// firebase/functions/src/api/admin/shared.ts
import * as express from "express";
import * as admin from "firebase-admin";

export const db = admin.firestore();

// -------------------------------
// Helpers (shared)
// -------------------------------
export async function countQuery(q: FirebaseFirestore.Query) {
  try {
    const anyQ: any = q as any;
    if (typeof anyQ.count === "function") {
      const aggSnap = await anyQ.count().get();
      const data = aggSnap.data?.();
      if (data && typeof data.count === "number") return data.count;
    }
  } catch {
    // ignore -> fallback
  }
  const snap = await q.get();
  return snap.size;
}

export async function countCollection(name: string) {
  return await countQuery(db.collection(name));
}

export function getUserFromReq(req: express.Request) {
  return (req as any).user || (req as any).auth || null;
}

export function isSuperAdmin(req: express.Request) {
  const u = getUserFromReq(req);
  const claims = u?.claims || u || {};
  if (claims?.superAdmin === true) return true;

  // 이메일 allowlist도 쓰고 싶으면 env로 확장 가능
  const email = String(u?.email || "").toLowerCase();
  const raw = String(process.env.SUPER_ADMIN_EMAILS || "").trim();
  if (!raw) return false;
  const allow = new Set(raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
  return allow.has(email);
}

export type AuditTargetType = "event" | "spot" | "report" | "system" | "unknown";

export type AuditLogWrite = {
  action: string;

  // ✅ 권장: 이벤트/스팟 등 대상 식별 (조회/인덱싱/심사용)
  targetType?: AuditTargetType;
  targetId?: string;

  // ✅ 권장: 변경 추적 (심사/CS/운영에 강함)
  changedFields?: string[];
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;

  // 기존 호환: data는 그대로 둠(프론트/기존 검색에서 사용)
  data?: Record<string, any>;
};

function normalizeTargetType(v: any): AuditTargetType {
  const s = String(v || "").toLowerCase();
  if (s === "event") return "event";
  if (s === "spot") return "spot";
  if (s === "report") return "report";
  if (s === "system") return "system";
  return "unknown";
}

/**
 * ✅ 기존 시그니처 유지: writeAuditLog(req, action, data)
 * - data에 { targetType, targetId, changedFields, before, after }가 있으면 top-level로 승격 저장
 * - 없으면 action prefix로 기본 추론(예: events.* -> targetType=event, targetId=data.id)
 */
export async function writeAuditLog(req: express.Request, action: string, data: Record<string, any>) {
  try {
    const u = getUserFromReq(req);

    const inferredTargetType: AuditTargetType =
      String(action || "").startsWith("events.")
        ? "event"
        : String(action || "").startsWith("spots.")
          ? "spot"
          : String(action || "").startsWith("reports.")
            ? "report"
            : String(action || "").startsWith("system.")
              ? "system"
              : "unknown";

    const targetType: AuditTargetType = normalizeTargetType(data?.targetType || inferredTargetType);
    const targetId: string | null =
      (data?.targetId ? String(data.targetId) : null) || (data?.id ? String(data.id) : null) || null;

    const changedFields: string[] | null = Array.isArray(data?.changedFields)
      ? data.changedFields.map((x: any) => String(x)).filter(Boolean)
      : null;

    const before = data?.before ?? null;
    const after = data?.after ?? null;

    const {
      targetType: _tt,
      targetId: _tid,
      changedFields: _cf,
      before: _b,
      after: _a,
      ...rest
    } = (data || {}) as any;

    await db.collection("admin_audit_logs").add({
      action,
      targetType,
      targetId,
      changedFields,
      before,
      after,
      data: rest,

      // ✅ 운영추적 메타
      reqPath: (req as any).originalUrl || req.url || null,
      reqMethod: req.method || null,
      reqIp: (req.headers["x-forwarded-for"] as string) || (req as any).ip || null,
      userAgent: String(req.headers["user-agent"] || "") || null,

      byUid: u?.uid || null,
      byEmail: u?.email || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch {
    // audit 실패는 메인 동작 막지 않음
  }
}

/**
 * ✅ 공용: admin_audit_logs 조회(인덱스 없을 때도 fallback 동작)
 */
export async function queryAuditLogs(params: { targetType?: AuditTargetType; targetId?: string; limit?: number }) {
  const lim = Math.max(1, Math.min(500, Number(params.limit || 50)));
  const targetType = params.targetType ? normalizeTargetType(params.targetType) : null;
  const targetId = params.targetId ? String(params.targetId) : null;

  const col = db.collection("admin_audit_logs");

  if (targetType && targetId) {
    try {
      const snap = await col
        .where("targetType", "==", targetType)
        .where("targetId", "==", targetId)
        .orderBy("createdAt", "desc")
        .limit(lim)
        .get();
      return snap;
    } catch {
      // index 부족 등 -> fallback
    }
  }

  const fallbackRead = Math.max(lim, 300);
  const snap = await col.orderBy("createdAt", "desc").limit(fallbackRead).get();
  return snap;
}

export function isoToday() {
  return new Date().toISOString().split("T")[0];
}

export function collectionForMode(mode: "explorer" | "nightlife", kind: "spots" | "events") {
  if (kind === "spots") return mode === "nightlife" ? "adult_spots" : "spots";
  return mode === "nightlife" ? "adult_events" : "events";
}

export function toMillis(v: any): number | null {
  if (!v) return null;
  try {
    if (typeof v.toMillis === "function") return v.toMillis();
    if (typeof v.toDate === "function") return v.toDate().getTime();
    if (typeof v.seconds === "number") return v.seconds * 1000;
    if (typeof v._seconds === "number") return v._seconds * 1000;
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d.getTime();
    }
  } catch {
    // ignore
  }
  return null;
}

export function normalizeText(s: string) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(s: string) {
  const n = normalizeText(s);
  if (!n) return [];
  const parts = n.split(" ").map((x) => x.trim()).filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    if (p.length < 2) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
    if (out.length >= 10) break;
  }
  return out;
}

export function buildSearchTokens(fields: Array<any>, max = 50) {
  const joined = fields
    .map((v) => (v == null ? "" : String(v)))
    .filter(Boolean)
    .join(" ");
  const n = normalizeText(joined);
  if (!n) return [];
  const parts = n.split(" ").map((x) => x.trim()).filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    if (p.length < 2) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
    if (out.length >= max) break;
  }
  return out;
}

export function scoreForRelevance(hay: string, q: string, tokens: string[]) {
  const h = normalizeText(hay);
  const nq = normalizeText(q);
  if (!h || !nq) return 0;

  let score = 0;

  if (h === nq) score += 120;
  if (h.startsWith(nq)) score += 90;
  if (h.includes(nq)) score += 60;

  for (const t of tokens) {
    if (h.includes(t)) score += 10;
  }
  return score;
}

export async function readRecent(colName: string, max = 300) {
  const col = db.collection(colName);
  try {
    return await col.orderBy("updatedAt", "desc").limit(max).get();
  } catch {
    try {
      return await col.orderBy("createdAt", "desc").limit(max).get();
    } catch {
      return await col.limit(max).get();
    }
  }
}

export async function trySearchByTokens(colName: string, tokens: string[], max = 200) {
  if (!tokens.length) return null;

  const col = db.collection(colName);

  try {
    const q = col.where("searchTokens", "array-contains-any", tokens.slice(0, 10)).limit(max);
    const snap = await q.get();
    return snap;
  } catch {
    return null;
  }
}

export function extractUserRole(u: any): string {
  const roles = u?.roles || {};
  if (roles?.superAdmin === true || u?.superAdmin === true) return "superAdmin";
  if (roles?.admin === true || u?.isAdmin === true || u?.admin === true || u?.role === "admin") return "admin";
  return String(u?.role || "member");
}

export function extractUserStatus(u: any): string {
  const s = String(u?.status || "");
  if (!s) return "active";
  return s;
}

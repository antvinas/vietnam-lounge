// back_src/src/api/admin/events.router.ts
import * as express from "express";
import * as admin from "firebase-admin";
import { z } from "zod";

import { validate } from "../../middlewares/validate";
import { requireAdmin } from "../../middlewares/requireAdmin";

import { db, buildSearchTokens, collectionForMode, writeAuditLog } from "./shared";

const router = express.Router();

// ✅ 이 라우터는 index.ts에서 /admin/events 로 마운트됨
router.use(requireAdmin);

// ---------------------------------------------
// Validation
// ---------------------------------------------
const EventUpsertSchema = z
  .object({
    mode: z.enum(["explorer", "nightlife"]),
    title: z.string().min(1),
    date: z.string().min(8),
  })
  .passthrough();

const EventPatchSchema = z
  .object({
    mode: z.enum(["explorer", "nightlife"]).optional(),
    title: z.string().min(1).optional(),
    date: z.string().min(8).optional(),
  })
  .passthrough();

const AuditQuerySchema = z
  .object({
    limit: z.coerce.number().min(1).max(200).optional(),
  })
  .passthrough();

// ---------------------------------------------
// Helpers
// ---------------------------------------------
function parseBool(v: any): boolean {
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y" || s === "on";
}

function isDeletedDoc(d: any): boolean {
  const ls = String(d?.lifecycleStatus || "").toLowerCase();
  const s = String(d?.status || "").toLowerCase();
  return ls === "deleted" || s === "deleted" || Boolean(d?.deletedAt) || Boolean(d?.deletedBy);
}

function toIso(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (v?.toDate) return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return null;
}

function pickEventAuditFields(x: any) {
  return {
    mode: x.mode ?? undefined,

    title: x.title ?? x.name ?? undefined,
    description: x.description ?? undefined,
    location: x.location ?? undefined,
    city: x.city ?? undefined,
    category: x.category ?? undefined,
    organizer: x.organizer ?? undefined,

    date: x.date ?? undefined,
    endDate: x.endDate ?? undefined,

    visibility: x.visibility ?? undefined,
    isPublic: typeof x.isPublic === "boolean" ? x.isPublic : undefined,
    status: x.status ?? undefined,

    publishAt: x.publishAt ?? undefined,

    imageUrl: x.imageUrl ?? x.image ?? undefined,
    gallery: Array.isArray(x.gallery) ? x.gallery : undefined,

    // ✅ Soft delete
    lifecycleStatus: x.lifecycleStatus ?? undefined,
    deletedAt: x.deletedAt ?? undefined,
    deletedBy: x.deletedBy ?? undefined,
  };
}

function diffChangedFields(before: Record<string, any>, after: Record<string, any>) {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const changed: string[] = [];
  for (const k of keys) {
    const b = (before as any)?.[k];
    const a = (after as any)?.[k];
    const bs = typeof b === "string" ? b : JSON.stringify(b);
    const as = typeof a === "string" ? a : JSON.stringify(a);
    if (bs !== as) changed.push(k);
  }
  return changed;
}

function sanitizeWriteBody(body: any) {
  const b = { ...(body || {}) };
  // 서버 관리 필드/위험 필드 제거
  delete b.id;
  delete b.createdAt;
  delete b.updatedAt;
  delete b.movedAt;
  delete b.deletedAt;
  delete b.deletedBy;
  delete b.deletedByUid;
  delete b.deletedByEmail;
  delete b.searchTokens;

  // ✅ Soft delete 상태는 서버만 변경
  delete b.lifecycleStatus;
  return b;
}

async function findEventDocById(id: string, modeHint?: "explorer" | "nightlife") {
  const tries: Array<{ col: string; mode: "explorer" | "nightlife" }> = modeHint
    ? [{ col: collectionForMode(modeHint, "events"), mode: modeHint }]
    : [
        { col: "events", mode: "explorer" },
        { col: "adult_events", mode: "nightlife" },
      ];

  for (const t of tries) {
    const ref = db.collection(t.col).doc(id);
    const snap = await ref.get();
    if (snap.exists) {
      return { ref, snap, mode: t.mode, col: t.col };
    }
  }
  return null;
}

function getActor(req: express.Request) {
  const u: any = (req as any).user || null;
  const uid = u?.uid ? String(u.uid) : null;
  const email = u?.email ? String(u.email) : null;
  return { uid, email };
}

// ---------------------------------------------
// Routes
// ---------------------------------------------

/**
 * GET /admin/events?mode=all|explorer|nightlife&limit=200&includeDeleted=0|1&onlyDeleted=0|1
 */
router.get("/", async (req, res) => {
  try {
    const mode = String(req.query.mode || "all") as "all" | "explorer" | "nightlife";
    const lim = Math.max(1, Math.min(300, Number(req.query.limit || 200)));

    const includeDeleted = parseBool(req.query.includeDeleted);
    const onlyDeleted = parseBool(req.query.onlyDeleted) || parseBool(req.query.trash);

    const predicate = (row: any) => {
      const del = isDeletedDoc(row);
      if (onlyDeleted) return del;
      if (includeDeleted) return true;
      return !del;
    };

    const read = async (col: string, defaultMode: "explorer" | "nightlife") => {
      // ✅ deleted 기본 제외면 over-fetch 해서 lim 맞춰줌
      const want = includeDeleted || onlyDeleted ? lim : Math.min(800, lim * 3);

      let snap: FirebaseFirestore.QuerySnapshot;
      try {
        snap = await db.collection(col).orderBy("createdAt", "desc").limit(want).get();
      } catch {
        try {
          snap = await db.collection(col).orderBy("updatedAt", "desc").limit(want).get();
        } catch {
          snap = await db.collection(col).limit(want).get();
        }
      }

      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        mode: ((d.data() as any)?.mode ?? defaultMode) as any,
      }));

      return rows.filter(predicate).slice(0, lim);
    };

    if (mode === "explorer") return res.status(200).send(await read("events", "explorer"));
    if (mode === "nightlife") return res.status(200).send(await read("adult_events", "nightlife"));

    const [a, b] = await Promise.all([read("events", "explorer"), read("adult_events", "nightlife")]);
    return res.status(200).send([...a, ...b]);
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to fetch events" });
  }
});

/**
 * GET /admin/events/:id/audit?limit=50
 */
router.get("/:id/audit", validate(AuditQuerySchema, "query"), async (req, res) => {
  try {
    const { id } = req.params;
    const lim = Math.max(1, Math.min(200, Number((req.query as any).limit || 50)));

    const matchesEvent = (row: any) => {
      if (String(row?.targetType || "").toLowerCase() === "event" && String(row?.targetId || "") === String(id)) {
        return true;
      }
      const legacy = row?.data ?? row?.data?.data ?? null;
      if (String(legacy?.targetType || "").toLowerCase() === "event" && String(legacy?.targetId || "") === String(id)) {
        return true;
      }
      if (String(row?.action || "").startsWith("events.") && String(legacy?.id || row?.targetId || "") === String(id)) {
        return true;
      }
      return false;
    };

    const normalize = (d: FirebaseFirestore.QueryDocumentSnapshot) => {
      const row = d.data() as any;
      const legacy = row?.data ?? row?.data?.data ?? null;

      return {
        id: d.id,
        action: String(row.action || ""),
        createdAt: toIso(row.createdAt),
        byUid: row.byUid ?? null,
        byEmail: row.byEmail ?? null,

        targetType: row.targetType ?? legacy?.targetType ?? null,
        targetId: row.targetId ?? legacy?.targetId ?? null,
        changedFields: Array.isArray(row.changedFields)
          ? row.changedFields
          : Array.isArray(legacy?.changedFields)
            ? legacy.changedFields
            : null,
        before: row.before ?? legacy?.before ?? null,
        after: row.after ?? legacy?.after ?? null,
      };
    };

    const tryQuery = async (colName: string) => {
      try {
        return await db
          .collection(colName)
          .where("targetType", "==", "event")
          .where("targetId", "==", id)
          .orderBy("createdAt", "desc")
          .limit(lim)
          .get();
      } catch {
        return null;
      }
    };

    let snap = await tryQuery("admin_audit_logs");

    if (!snap) {
      const fallbackRead = Math.max(lim, 300);
      const fb = await db.collection("admin_audit_logs").orderBy("createdAt", "desc").limit(fallbackRead).get();
      const docs = fb.docs.filter((d) => matchesEvent(d.data()));
      return res.status(200).send(docs.slice(0, lim).map(normalize));
    }

    if (snap.empty) {
      const legacySnap = await tryQuery("admin_audit");
      if (legacySnap && !legacySnap.empty) {
        return res.status(200).send(legacySnap.docs.slice(0, lim).map(normalize));
      }

      const fallbackRead = Math.max(lim, 300);
      const fb = await db.collection("admin_audit_logs").orderBy("createdAt", "desc").limit(fallbackRead).get();
      const docs = fb.docs.filter((d) => matchesEvent(d.data()));
      return res.status(200).send(docs.slice(0, lim).map(normalize));
    }

    return res.status(200).send(snap.docs.slice(0, lim).map(normalize));
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to fetch event audit trail" });
  }
});

/**
 * GET /admin/events/:id?mode=explorer|nightlife&includeDeleted=0|1
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const modeHint = (req.query.mode ? String(req.query.mode) : "") as "explorer" | "nightlife" | "";
    const includeDeleted = parseBool(req.query.includeDeleted);

    const found = await findEventDocById(id, modeHint || undefined);
    if (!found) return res.status(404).send({ error: "Event not found" });

    const data = found.snap.data() || {};
    if (!includeDeleted && isDeletedDoc(data)) {
      return res.status(404).send({ error: "Event not found" });
    }

    return res.status(200).send({ id: found.snap.id, ...(data as any), mode: (data as any).mode ?? found.mode });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to fetch event" });
  }
});

/**
 * POST /admin/events
 */
router.post("/", validate(EventUpsertSchema, "body"), async (req, res) => {
  try {
    const bodyRaw = req.body as any;
    const body = sanitizeWriteBody(bodyRaw);

    const mode = body.mode as "explorer" | "nightlife";
    const col = db.collection(collectionForMode(mode, "events"));
    const now = admin.firestore.FieldValue.serverTimestamp();

    const title = String(body.title || "").trim();
    const payload = {
      ...body,
      title,
      name: title,
      date: String(body.date || "").trim(),

      // ✅ Soft delete default
      lifecycleStatus: "active",

      updatedAt: now,
      createdAt: now,
      searchTokens: buildSearchTokens([title, body.location, body.city, body.category, body.organizer]),
    };

    const docRef = await col.add(payload);

    const afterAudit = pickEventAuditFields(payload);
    await writeAuditLog(req, "events.create", {
      targetType: "event",
      targetId: docRef.id,
      changedFields: Object.keys(afterAudit),
      before: null,
      after: afterAudit,
      id: docRef.id,
      mode,
    });

    return res.status(200).send({ id: docRef.id });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to create event" });
  }
});

/**
 * 내부 공용: PATCH handler
 */
async function handlePatch(req: express.Request, res: express.Response) {
  try {
    const { id } = req.params;
    const bodyRaw = req.body as any;
    const body = sanitizeWriteBody(bodyRaw);

    const requestedMode = (body.mode || req.query.mode || "explorer") as "explorer" | "nightlife";

    // 1) 먼저 requestedMode에서 찾고, 없으면 반대 컬렉션에서 찾기
    const found = await findEventDocById(id, requestedMode);
    const found2 = found ? found : await findEventDocById(id, requestedMode === "explorer" ? "nightlife" : "explorer");
    if (!found2) return res.status(404).send({ error: "Event not found" });

    const before = found2.snap.data() || {};
    const beforeMode: "explorer" | "nightlife" = ((before as any).mode ?? found2.mode) as any;

    // ✅ 삭제된 항목은 수정 금지(복구 후 수정)
    if (isDeletedDoc(before)) {
      return res.status(409).send({ error: "Event is deleted. Restore first.", code: "resource/deleted" });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    const title =
      body.title != null ? String(body.title || "").trim() : String((before as any).title ?? (before as any).name ?? "").trim();

    const patch: any = {
      ...body,
      ...(body.title != null ? { title, name: title } : {}),
      ...(body.title != null
        ? {
            searchTokens: buildSearchTokens([
              title,
              body.location ?? (before as any).location,
              body.city ?? (before as any).city,
              body.category ?? (before as any).category,
              body.organizer ?? (before as any).organizer,
            ]),
          }
        : {}),
      updatedAt: now,
    };

    // ✅ mode 변경 요청이면 move 지원
    const toMode: "explorer" | "nightlife" = (body.mode || beforeMode) as any;

    if (toMode !== beforeMode) {
      const toColName = collectionForMode(toMode, "events");
      const fromColName = collectionForMode(beforeMode, "events");
      const fromRef = db.collection(fromColName).doc(id);
      const toRef = db.collection(toColName).doc(id);

      const batch = db.batch();
      batch.set(
        toRef,
        {
          ...before,
          ...patch,
          mode: toMode,
          movedAt: now,
        },
        { merge: true }
      );
      // move는 “삭제 사고”랑 다르니 물리 delete 허용(엔티티는 toRef에 존재)
      batch.delete(fromRef);
      await batch.commit();

      const beforeAudit = pickEventAuditFields({ ...before, mode: beforeMode });
      const afterAudit = pickEventAuditFields({ ...before, ...patch, mode: toMode });

      await writeAuditLog(req, "events.update", {
        targetType: "event",
        targetId: id,
        changedFields: diffChangedFields(beforeAudit, afterAudit),
        before: beforeAudit,
        after: afterAudit,
        id,
        mode: toMode,
        moved: true,
        fromMode: beforeMode,
        toMode,
      });

      return res.status(200).send({ ok: true, moved: true, fromMode: beforeMode, toMode });
    }

    // 일반 업데이트
    await found2.ref.set(patch, { merge: true });

    const beforeAudit = pickEventAuditFields(before);
    const afterAudit = pickEventAuditFields({ ...before, ...patch, mode: beforeMode });
    const changedFields = diffChangedFields(beforeAudit, afterAudit);

    await writeAuditLog(req, "events.update", {
      targetType: "event",
      targetId: id,
      changedFields,
      before: beforeAudit,
      after: afterAudit,
      id,
      mode: beforeMode,
    });

    return res.status(200).send({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to update event" });
  }
}

/**
 * ✅ PUT /admin/events/:id (프론트가 PUT을 사용하므로 별칭 제공)
 */
router.put("/:id", validate(EventPatchSchema, "body"), async (req, res) => {
  return handlePatch(req, res);
});

/**
 * PATCH /admin/events/:id
 */
router.patch("/:id", validate(EventPatchSchema, "body"), async (req, res) => {
  return handlePatch(req, res);
});

/**
 * ✅ POST /admin/events/:id/restore
 * - 휴지통 복구
 */
router.post("/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;
    const modeHint = (req.query.mode ? String(req.query.mode) : "") as "explorer" | "nightlife" | "";

    const found = await findEventDocById(id, (modeHint as any) || undefined);
    const found2 = found ? found : await findEventDocById(id, modeHint === "explorer" ? "nightlife" : "explorer");
    if (!found2) return res.status(404).send({ error: "Event not found" });

    const before = found2.snap.data() || {};
    const beforeMode: "explorer" | "nightlife" = ((before as any).mode ?? found2.mode) as any;

    if (!isDeletedDoc(before)) {
      return res.status(200).send({ ok: true, restored: false, mode: beforeMode });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const patch: any = {
      lifecycleStatus: "active",
      updatedAt: now,
      deletedAt: admin.firestore.FieldValue.delete(),
      deletedBy: admin.firestore.FieldValue.delete(),
      deletedByUid: admin.firestore.FieldValue.delete(),
      deletedByEmail: admin.firestore.FieldValue.delete(),
    };

    await found2.ref.set(patch, { merge: true });

    const beforeAudit = pickEventAuditFields(before);
    const afterAudit = pickEventAuditFields({ ...before, lifecycleStatus: "active", deletedAt: null, deletedBy: null });

    await writeAuditLog(req, "events.restore", {
      targetType: "event",
      targetId: id,
      changedFields: diffChangedFields(beforeAudit, afterAudit),
      before: beforeAudit,
      after: afterAudit,
      id,
      mode: beforeMode,
    });

    return res.status(200).send({ ok: true, restored: true, mode: beforeMode });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to restore event" });
  }
});

/**
 * ✅ DELETE /admin/events/:id  -> Soft Delete
 * - 물리 삭제 금지
 * - mode 힌트 틀려도 양쪽 컬렉션에서 찾아 처리
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const modeHint = (req.query.mode ? String(req.query.mode) : "") as "explorer" | "nightlife" | "";

    const found = await findEventDocById(id, (modeHint as any) || undefined);
    const found2 = found ? found : await findEventDocById(id, modeHint === "explorer" ? "nightlife" : "explorer");
    if (!found2) return res.status(404).send({ error: "Event not found" });

    const before = found2.snap.data() || {};
    const beforeMode: "explorer" | "nightlife" = ((before as any).mode ?? found2.mode) as any;

    // idempotent
    if (isDeletedDoc(before)) {
      return res.status(200).send({ ok: true, softDeleted: false, mode: beforeMode });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const { uid, email } = getActor(req);

    const patch: any = {
      lifecycleStatus: "deleted",
      deletedAt: now,
      deletedBy: { uid, email },
      deletedByUid: uid,
      deletedByEmail: email,
      updatedAt: now,
    };

    await found2.ref.set(patch, { merge: true });

    const beforeAudit = pickEventAuditFields(before);
    const afterAudit = pickEventAuditFields({
      ...before,
      lifecycleStatus: "deleted",
      deletedAt: new Date().toISOString(),
      deletedBy: { uid, email },
    });

    await writeAuditLog(req, "events.delete", {
      targetType: "event",
      targetId: id,
      changedFields: diffChangedFields(beforeAudit, afterAudit),
      before: beforeAudit,
      after: afterAudit,
      id,
      mode: beforeMode,
      softDelete: true,
    });

    return res.status(200).send({ ok: true, mode: beforeMode, softDelete: true });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to delete event" });
  }
});

export default router;

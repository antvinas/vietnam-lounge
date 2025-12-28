// firebase/functions/src/api/admin/users.router.ts
import * as express from "express";
import * as admin from "firebase-admin";
import { z } from "zod";
import { validate } from "../../middlewares/validate";
import { db, isSuperAdmin, writeAuditLog } from "./shared";

const router = express.Router();

/**
 * Query params (optional)
 * - q: string (prefix search: email or nickname/displayName)
 * - status: all | active | banned | deleted
 * - role: all | user | admin | superAdmin
 * - sort: createdAt | updatedAt | emailLower | nicknameLower
 * - dir: asc | desc
 * - limit: 1..200 (default 50)
 * - cursor: base64(json: { v: any, id: string })
 * - format: array | cursor   (default array)
 * - includeDeleted: true/false (default false)
 */

const ListUsersQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["all", "active", "banned", "deleted"]).optional(),
  role: z.enum(["all", "user", "admin", "superAdmin"]).optional(),
  sort: z.enum(["createdAt", "updatedAt", "emailLower", "nicknameLower"]).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional(),
  format: z.enum(["array", "cursor"]).optional(),
  includeDeleted: z.preprocess((v) => {
    if (v === "true" || v === true) return true;
    if (v === "false" || v === false) return false;
    return undefined;
  }, z.boolean().optional()),
});

type CursorToken = { v: any; id: string };

function encodeCursor(token: CursorToken): string {
  return Buffer.from(JSON.stringify(token), "utf8").toString("base64");
}

function decodeCursor(raw?: string): CursorToken | null {
  if (!raw) return null;
  try {
    const json = Buffer.from(String(raw), "base64").toString("utf8");
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.id !== "string") return null;
    return { v: (parsed as any).v, id: parsed.id };
  } catch {
    return null;
  }
}

function getActor(req: express.Request): { uid?: string; email?: string } {
  const u: any = (req as any).user;
  return { uid: u?.uid, email: u?.email };
}

function getReqMeta(req: express.Request): { ip?: string; userAgent?: string } {
  const xfwd = req.headers["x-forwarded-for"];
  const ip = Array.isArray(xfwd) ? xfwd[0] : typeof xfwd === "string" ? xfwd.split(",")[0].trim() : req.ip;
  const userAgent = String(req.headers["user-agent"] || "");
  return { ip, userAgent };
}

function toTimestampMaybe(v: any): any {
  // cursor value type fix (Timestamp / ISO string)
  if (!v) return v;
  // already Timestamp
  if (typeof v?.toDate === "function") return v;
  if (v instanceof Date) return admin.firestore.Timestamp.fromDate(v);
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return admin.firestore.Timestamp.fromDate(d);
  }
  return v;
}

router.get("/", async (req, res) => {
  const parsed = ListUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).send({ error: "Invalid query", detail: parsed.error.flatten() });
  }

  const {
    q,
    status = "all",
    role = "all",
    sort = "createdAt",
    dir = "desc",
    limit = 50,
    cursor,
    format = "array",
    includeDeleted = false,
  } = parsed.data;

  const cursorToken = decodeCursor(cursor);

  try {
    let query: FirebaseFirestore.Query = db.collection("users");

    // status filter
    if (status !== "all") {
      query = query.where("status", "==", status);
    }

    // role filter (Firestore-friendly first, then in-memory refinement)
    if (role === "superAdmin") {
      query = query.where("roles.superAdmin", "==", true);
    } else if (role === "admin") {
      query = query.where("isAdmin", "==", true);
    }

    // Search (prefix). Firestore cannot OR across multiple fields, so we choose best field.
    // - If q contains "@": email prefix
    // - else: nickname/displayName prefix
    let effectiveSortField: "createdAt" | "updatedAt" | "emailLower" | "nicknameLower" = sort;
    let effectiveDir: "asc" | "desc" = dir;

    if (q && q.length > 0) {
      if (q.includes("@")) {
        effectiveSortField = "emailLower";
      } else {
        effectiveSortField = "nicknameLower";
      }
      // prefix search works best in ASC
      effectiveDir = "asc";
    }

    // orderBy + stable tie-breaker
    query = query.orderBy(effectiveSortField, effectiveDir);
    query = query.orderBy(admin.firestore.FieldPath.documentId(), effectiveDir);

    // prefix window
    if (q && q.length > 0) {
      const qq = q.toLowerCase();
      // startAt/endAt require orderBy on the same field
      query = query.startAt(qq).endAt(qq + "\uf8ff");
    }

    // cursor
    if (cursorToken) {
      query = query.startAfter(toTimestampMaybe(cursorToken.v), cursorToken.id);
    }

    // pull more than limit when we need in-memory refinement (role=user, includeDeleted=false)
    const overScan = role === "user" || (!includeDeleted && status === "all") ? Math.min(200, limit) : 0;
    const snap = await query.limit(limit + overScan).get();

    let users = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    // in-memory refinement
    if (!includeDeleted && status === "all") {
      users = users.filter((u) => u.status !== "deleted");
    }
    if (role === "admin") {
      // exclude superAdmin if UI asked "admin" only
      users = users.filter((u) => !(u?.roles?.superAdmin === true));
    }
    if (role === "user") {
      users = users.filter((u) => !(u?.isAdmin === true) && !(u?.roles?.admin === true) && !(u?.roles?.superAdmin === true));
    }

    users = users.slice(0, limit);

    // next cursor
    let nextCursor: string | null = null;
    if (snap.docs.length > 0 && users.length > 0) {
      const lastDoc = snap.docs[Math.min(users.length, snap.docs.length) - 1];
      const lastData: any = lastDoc.data();
      const v = lastData?.[effectiveSortField] ?? null;
      nextCursor = encodeCursor({ v, id: lastDoc.id });
      // Backward-compatible: return array but also provide cursor via header.
      res.setHeader("x-next-cursor", nextCursor);
    }

    if (format === "cursor") {
      return res.status(200).send({ items: users, nextCursor });
    }
    return res.status(200).send(users);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Failed to fetch users" });
  }
});

const PatchUserRoleSchema = z.object({
  admin: z.boolean(),
  superAdmin: z.boolean().optional(),
  reason: z.string().max(500).optional(), // backward compatible
});

router.patch("/:uid/role", validate(PatchUserRoleSchema), async (req, res) => {
  if (!isSuperAdmin(req)) return res.status(403).send({ error: "Only super admin can change roles" });

  const { uid } = req.params;
  const { admin: isAdmin, superAdmin, reason } = req.body as { admin: boolean; superAdmin?: boolean; reason?: string };

  const actor = getActor(req);
  if (actor.uid && actor.uid === uid && isAdmin && superAdmin === false) {
    // prevent self-demotion from superAdmin via accidental click
    return res.status(400).send({ error: "Cannot remove your own superAdmin privileges." });
  }

  try {
    const record = await admin.auth().getUser(uid);
    const existingClaims = (record.customClaims || {}) as Record<string, any>;
    const before = {
      claims: { ...existingClaims },
    };

    const next = { ...existingClaims };

    if (!isAdmin) {
      delete next.admin;
      delete next.superAdmin;
    } else {
      next.admin = true;
      if (typeof superAdmin === "boolean") {
        if (superAdmin) next.superAdmin = true;
        else delete next.superAdmin;
      }
    }

    await admin.auth().setCustomUserClaims(uid, next);

    const after = {
      claims: { ...next },
    };

    await db.collection("users").doc(uid).set(
      {
        isAdmin: Boolean(next.admin),
        roles: { admin: Boolean(next.admin), superAdmin: Boolean(next.superAdmin) },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const meta = getReqMeta(req);
    await writeAuditLog(req, "users.role.patch", {
      targetType: "user",
      targetId: uid,
      reason: reason ?? null,
      before,
      after,
      changedFields: ["claims.admin", "claims.superAdmin", "roles.admin", "roles.superAdmin"],
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      data: { uid, nextClaims: next },
    });

    return res.status(200).send({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to update user role" });
  }
});

const PatchUserStatusSchema = z.object({
  active: z.boolean(),
  memo: z.string().max(500).optional(), // existing UI uses memo
  reason: z.string().max(500).optional(), // optional future field
});

router.patch("/:uid/status", validate(PatchUserStatusSchema), async (req, res) => {
  const { uid } = req.params;
  const { active, memo, reason } = req.body as { active: boolean; memo?: string; reason?: string };

  try {
    // target protection: banning/deleting superAdmin must be done by superAdmin
    const record = await admin.auth().getUser(uid);
    const targetClaims = (record.customClaims || {}) as Record<string, any>;
    const targetIsSuperAdmin = targetClaims.superAdmin === true;

    if (targetIsSuperAdmin && !isSuperAdmin(req)) {
      return res.status(403).send({ error: "Only super admin can modify super admin status" });
    }

    const finalReason = (reason ?? memo ?? "").trim();
    if (!active && !finalReason) {
      return res.status(400).send({ error: "memo(reason) is required when banning a user" });
    }

    // before state (best-effort)
    const beforeDoc = await db.collection("users").doc(uid).get().catch(() => null);
    const beforeData = beforeDoc?.exists ? (beforeDoc.data() as any) : null;
    const before = {
      status: beforeData?.status ?? null,
      adminMemo: beforeData?.adminMemo ?? null,
      bannedAt: beforeData?.bannedAt ?? null,
      disabled: record.disabled ?? null,
    };

    await admin.auth().updateUser(uid, { disabled: !active });

    await db.collection("users").doc(uid).set(
      {
        status: active ? "active" : "banned",
        adminMemo: finalReason || null,
        bannedAt: active ? null : admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const after = {
      status: active ? "active" : "banned",
      adminMemo: finalReason || null,
      disabled: !active,
    };

    const meta = getReqMeta(req);
    await writeAuditLog(req, "users.status.patch", {
      targetType: "user",
      targetId: uid,
      reason: finalReason || null,
      before,
      after,
      changedFields: ["status", "adminMemo", "bannedAt", "auth.disabled"],
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      data: { uid, active, memo: finalReason || null },
    });

    return res.status(200).send({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to update user status" });
  }
});

router.delete("/:uid", async (req, res) => {
  // superAdmin only
  if (!isSuperAdmin(req)) return res.status(403).send({ error: "Only super admin can delete users" });

  const { uid } = req.params;
  const hard = String(req.query.hard || "false") === "true";
  const reason = String(req.query.reason || "").trim();

  try {
    const record = await admin.auth().getUser(uid);
    const existingClaims = (record.customClaims || {}) as Record<string, any>;
    const before = {
      status: null as any,
      authDisabled: record.disabled ?? null,
      claims: { ...existingClaims },
    };

    // Default: SAFE delete (soft delete) -> hide from list, disable login
    if (!hard) {
      await admin.auth().updateUser(uid, { disabled: true });

      await db.collection("users").doc(uid).set(
        {
          status: "deleted",
          deletedAt: admin.firestore.FieldValue.serverTimestamp(),
          deletedReason: reason || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      const after = { status: "deleted", authDisabled: true };

      const meta = getReqMeta(req);
      await writeAuditLog(req, "users.delete.soft", {
        targetType: "user",
        targetId: uid,
        reason: reason || null,
        before,
        after,
        changedFields: ["status", "deletedAt", "deletedReason", "auth.disabled"],
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        data: { uid, hard: false },
      });

      return res.status(200).send({ ok: true, mode: "soft" });
    }

    // Hard delete (dangerous): remove doc + auth user
    await db.collection("users").doc(uid).delete().catch(() => null);
    await admin.auth().deleteUser(uid);

    const meta = getReqMeta(req);
    await writeAuditLog(req, "users.delete.hard", {
      targetType: "user",
      targetId: uid,
      reason: reason || null,
      before,
      after: { deleted: true },
      changedFields: ["users.doc.delete", "auth.user.delete"],
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      data: { uid, hard: true },
    });

    return res.status(200).send({ ok: true, mode: "hard" });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to delete users" });
  }
});

export default router;

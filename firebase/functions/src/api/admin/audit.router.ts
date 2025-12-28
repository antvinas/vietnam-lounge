// firebase/functions/src/api/admin/audit.router.ts
import * as express from "express";
import * as admin from "firebase-admin";
import { db } from "./shared";

const router = express.Router();

/**
 * GET /admin/audit-logs
 * Query
 * - days=30 (1..180)
 * - limit=200 (1..1000)
 * - cursor=base64({ v: createdAt(ISO|string|Timestamp), id })
 * - targetType=user|event|spot|... (equality)
 * - targetId=... (equality)
 * - actor=... (contains: email or uid)  (post-filter)
 * - actionPrefix=users. / reports. ...  (post-filter)
 * - q=... full text over action/by/before/after/data (post-filter)
 * - format=array|cursor (default array)
 */

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

const toIso = (v: any): string | null => {
  if (!v) return null;
  try {
    if (typeof v.toDate === "function") return v.toDate().toISOString();
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "string") return v;
  } catch {
    // ignore
  }
  return null;
};

function toTimestampMaybe(v: any): any {
  if (!v) return v;
  if (typeof v?.toDate === "function") return v; // Timestamp already
  if (v instanceof Date) return admin.firestore.Timestamp.fromDate(v);
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return admin.firestore.Timestamp.fromDate(d);
  }
  return v;
}

router.get("/", async (req, res) => {
  try {
    const days = Math.max(1, Math.min(180, Number(req.query.days || 30)));
    const lim = Math.max(1, Math.min(1000, Number(req.query.limit || 200)));
    const qText = String(req.query.q || "").trim().toLowerCase();
    const actionPrefix = String(req.query.actionPrefix || "").trim();
    const actor = String(req.query.actor || "").trim().toLowerCase();
    const targetType = String(req.query.targetType || "").trim();
    const targetId = String(req.query.targetId || "").trim();
    const format = (String(req.query.format || "array") === "cursor" ? "cursor" : "array") as "cursor" | "array";

    const cursorToken = decodeCursor(String(req.query.cursor || "") || undefined);

    const start = new Date();
    start.setDate(start.getDate() - days);
    const startTs = admin.firestore.Timestamp.fromDate(start);

    const readFrom = async (colName: string) => {
      let q: FirebaseFirestore.Query = db.collection(colName);

      // Most useful server-side filters first (equality)
      if (targetType) q = q.where("targetType", "==", targetType);
      if (targetId) q = q.where("targetId", "==", targetId);

      // date range
      try {
        q = q.where("createdAt", ">=", startTs);
      } catch {
        // ignore, fallback later
      }

      // order + stable tie-breaker
      q = q.orderBy("createdAt", "desc").orderBy(admin.firestore.FieldPath.documentId(), "desc");

      if (cursorToken) {
        q = q.startAfter(toTimestampMaybe(cursorToken.v), cursorToken.id);
      }

      try {
        return await q.limit(lim).get();
      } catch {
        // fallback if missing index/field mismatch
        return await db.collection(colName).orderBy("createdAt", "desc").limit(Math.max(lim, 300)).get();
      }
    };

    let snap = await readFrom("admin_audit_logs");
    if (snap.empty) {
      // legacy collection fallback
      snap = await readFrom("admin_audit");
    }

    let logs = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        action: String(data.action || ""),
        targetType: data.targetType ?? null,
        targetId: data.targetId ?? null,
        reason: data.reason ?? null,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
        changedFields: Array.isArray(data.changedFields) ? data.changedFields : null,
        before: data.before ?? null,
        after: data.after ?? null,
        byUid: data.byUid ?? null,
        byEmail: data.byEmail ?? null,
        createdAt: toIso(data.createdAt),
        data: data.data ?? null,
      };
    });

    // post-filters (contains / prefix)
    if (actionPrefix) logs = logs.filter((l) => String(l.action || "").startsWith(actionPrefix));
    if (actor) {
      logs = logs.filter(
        (l) => String(l.byEmail || "").toLowerCase().includes(actor) || String(l.byUid || "").toLowerCase().includes(actor)
      );
    }
    if (qText) {
      logs = logs.filter((l) => {
        const a = String(l.action || "").toLowerCase();
        const e = String(l.byEmail || "").toLowerCase();
        const u = String(l.byUid || "").toLowerCase();
        const d0 = JSON.stringify(l.data || {}).toLowerCase();
        const bf = JSON.stringify(l.before || {}).toLowerCase();
        const af = JSON.stringify(l.after || {}).toLowerCase();
        const r = String(l.reason || "").toLowerCase();
        return a.includes(qText) || e.includes(qText) || u.includes(qText) || r.includes(qText) || d0.includes(qText) || bf.includes(qText) || af.includes(qText);
      });
    }

    // hard cutoff (days)
    const cutoff = start.getTime();
    logs = logs.filter((l) => {
      const t = l.createdAt ? new Date(l.createdAt).getTime() : 0;
      return t >= cutoff;
    });

    logs = logs.slice(0, lim);

    // next cursor (based on last doc from snap - best effort)
    let nextCursor: string | null = null;
    if (snap.docs.length > 0 && logs.length > 0) {
      const lastDoc = snap.docs[Math.min(logs.length, snap.docs.length) - 1];
      const lastData: any = lastDoc.data();
      const v = lastData?.createdAt ?? null;
      nextCursor = encodeCursor({ v, id: lastDoc.id });
      res.setHeader("x-next-cursor", nextCursor);
    }

    if (format === "cursor") {
      return res.status(200).send({ items: logs, nextCursor });
    }
    return res.status(200).send(logs);
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to fetch audit logs" });
  }
});

export default router;

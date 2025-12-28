// firebase/functions/src/api/admin/system.router.ts
import * as express from "express";
import * as admin from "firebase-admin";
import { z } from "zod";
import { validate } from "../../middlewares/validate";
import { db, getUserFromReq, isSuperAdmin, writeAuditLog } from "./shared";

const router = express.Router();

// (System Health) (기존 유지)
// ==========================================
router.get("/health", async (_req, res) => {
  try {
    const start = Date.now();
    await db.collection("users").limit(1).get();
    const dbLatency = Date.now() - start;

    const mu = process.memoryUsage();
    const health = {
      status: dbLatency > 800 ? "unhealthy" : "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      dbLatency,
      memory: {
        rss: Math.round(mu.rss / 1024 / 1024),
        heapTotal: Math.round(mu.heapTotal / 1024 / 1024),
        heapUsed: Math.round(mu.heapUsed / 1024 / 1024),
      },
      recentErrors: [],
    };

    return res.status(200).send(health);
  } catch (e) {
    console.error(e);
    return res.status(200).send({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      dbLatency: 0,
      memory: { rss: 0, heapTotal: 0, heapUsed: 0 },
      recentErrors: [{ message: "health check failed", at: new Date().toISOString() }],
    });
  }
});

const CachePurgeSchema = z.object({
  scope: z.enum(["spots", "events", "users", "ads", "reports", "all"]).default("spots"),
  reason: z.string().max(200).optional(),
});

router.post("/cache/purge", validate(CachePurgeSchema), async (req, res) => {
  try {
    const { scope, reason } = req.body as { scope: string; reason?: string };

    if (scope === "all" && !isSuperAdmin(req)) {
      return res.status(403).send({ error: "Only super admin can purge all cache" });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const docRef = db.collection("system_metadata").doc("cache_version");

    const updates: Record<string, any> = {
      updatedAt: now,
      [`versions.${scope}`]: now,
      lastPurge: {
        scope,
        at: now,
        byUid: getUserFromReq(req)?.uid || null,
        byEmail: getUserFromReq(req)?.email || null,
        reason: reason || null,
      },
    };

    if (scope === "all") {
      updates["versions.spots"] = now;
      updates["versions.events"] = now;
      updates["versions.users"] = now;
      updates["versions.ads"] = now;
      updates["versions.reports"] = now;
    }

    await docRef.set(updates, { merge: true });
    await writeAuditLog(req, "system.cache.purge", { scope, reason: reason || null });

    return res.status(200).send({ ok: true, scope, at: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Failed to purge cache" });
  }
});

export default router;

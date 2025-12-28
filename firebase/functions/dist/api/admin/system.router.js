"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// firebase/functions/src/api/admin/system.router.ts
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
const validate_1 = require("../../middlewares/validate");
const shared_1 = require("./shared");
const router = express.Router();
// (System Health) (기존 유지)
// ==========================================
router.get("/health", async (_req, res) => {
    try {
        const start = Date.now();
        await shared_1.db.collection("users").limit(1).get();
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
    }
    catch (e) {
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
const CachePurgeSchema = zod_1.z.object({
    scope: zod_1.z.enum(["spots", "events", "users", "ads", "reports", "all"]).default("spots"),
    reason: zod_1.z.string().max(200).optional(),
});
router.post("/cache/purge", (0, validate_1.validate)(CachePurgeSchema), async (req, res) => {
    var _a, _b;
    try {
        const { scope, reason } = req.body;
        if (scope === "all" && !(0, shared_1.isSuperAdmin)(req)) {
            return res.status(403).send({ error: "Only super admin can purge all cache" });
        }
        const now = admin.firestore.FieldValue.serverTimestamp();
        const docRef = shared_1.db.collection("system_metadata").doc("cache_version");
        const updates = {
            updatedAt: now,
            [`versions.${scope}`]: now,
            lastPurge: {
                scope,
                at: now,
                byUid: ((_a = (0, shared_1.getUserFromReq)(req)) === null || _a === void 0 ? void 0 : _a.uid) || null,
                byEmail: ((_b = (0, shared_1.getUserFromReq)(req)) === null || _b === void 0 ? void 0 : _b.email) || null,
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
        await (0, shared_1.writeAuditLog)(req, "system.cache.purge", { scope, reason: reason || null });
        return res.status(200).send({ ok: true, scope, at: new Date().toISOString() });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error: "Failed to purge cache" });
    }
});
exports.default = router;
//# sourceMappingURL=system.router.js.map
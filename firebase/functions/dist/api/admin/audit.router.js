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
// firebase/functions/src/api/admin/audit.router.ts
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const shared_1 = require("./shared");
const router = express.Router();
// GET /admin/audit-logs?days=30&limit=200&q=...&actionPrefix=reports.&actor=email@...
// ==========================================
router.get("/", async (req, res) => {
    try {
        const days = Math.max(1, Math.min(180, Number(req.query.days || 30)));
        const lim = Math.max(1, Math.min(1000, Number(req.query.limit || 200)));
        const qText = String(req.query.q || "").trim().toLowerCase();
        const actionPrefix = String(req.query.actionPrefix || "").trim();
        const actor = String(req.query.actor || "").trim().toLowerCase();
        const start = new Date();
        start.setDate(start.getDate() - days);
        const startTs = admin.firestore.Timestamp.fromDate(start);
        const toIso = (v) => {
            if (!v)
                return null;
            try {
                if (typeof v.toDate === "function")
                    return v.toDate().toISOString();
                if (v instanceof Date)
                    return v.toISOString();
                if (typeof v === "string")
                    return v;
            }
            catch (_a) {
                // ignore
            }
            return null;
        };
        const readFrom = async (colName) => {
            try {
                return await shared_1.db
                    .collection(colName)
                    .where("createdAt", ">=", startTs)
                    .orderBy("createdAt", "desc")
                    .limit(lim)
                    .get();
            }
            catch (_a) {
                // 인덱스/필드 불일치 fallback
                return await shared_1.db.collection(colName).orderBy("createdAt", "desc").limit(Math.max(lim, 300)).get();
            }
        };
        let snap = await readFrom("admin_audit_logs");
        if (snap.empty) {
            // 레거시 컬렉션명 호환
            const legacy = await readFrom("admin_audit");
            snap = legacy;
        }
        let logs = snap.docs.map((d) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const data = d.data();
            return {
                id: d.id,
                action: String(data.action || ""),
                targetType: (_a = data.targetType) !== null && _a !== void 0 ? _a : null,
                targetId: (_b = data.targetId) !== null && _b !== void 0 ? _b : null,
                changedFields: Array.isArray(data.changedFields) ? data.changedFields : null,
                before: (_c = data.before) !== null && _c !== void 0 ? _c : null,
                after: (_d = data.after) !== null && _d !== void 0 ? _d : null,
                byUid: (_e = data.byUid) !== null && _e !== void 0 ? _e : null,
                byEmail: (_f = data.byEmail) !== null && _f !== void 0 ? _f : null,
                createdAt: toIso(data.createdAt),
                data: (_g = data.data) !== null && _g !== void 0 ? _g : null,
            };
        });
        if (actionPrefix)
            logs = logs.filter((l) => String(l.action || "").startsWith(actionPrefix));
        if (actor) {
            logs = logs.filter((l) => String(l.byEmail || "").toLowerCase().includes(actor) ||
                String(l.byUid || "").toLowerCase().includes(actor));
        }
        if (qText) {
            logs = logs.filter((l) => {
                const a = String(l.action || "").toLowerCase();
                const e = String(l.byEmail || "").toLowerCase();
                const u = String(l.byUid || "").toLowerCase();
                const d = JSON.stringify(l.data || {}).toLowerCase();
                const bf = JSON.stringify(l.before || {}).toLowerCase();
                const af = JSON.stringify(l.after || {}).toLowerCase();
                return a.includes(qText) || e.includes(qText) || u.includes(qText) || d.includes(qText) || bf.includes(qText) || af.includes(qText);
            });
        }
        const cutoff = start.getTime();
        logs = logs.filter((l) => {
            const t = l.createdAt ? new Date(l.createdAt).getTime() : 0;
            return t >= cutoff;
        });
        return res.status(200).send(logs.slice(0, lim));
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to fetch audit logs" });
    }
});
exports.default = router;
//# sourceMappingURL=audit.router.js.map
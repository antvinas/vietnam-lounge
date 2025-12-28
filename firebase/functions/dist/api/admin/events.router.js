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
// firebase/functions/src/api/admin/events.router.ts
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
const validate_1 = require("../../middlewares/validate");
const requireAdmin_1 = require("../../middlewares/requireAdmin");
const shared_1 = require("./shared");
const router = express.Router();
// ✅ 이 라우터는 index.ts에서 /admin/events 로 직접 마운트되기 때문에
// 여기서 admin 보호를 걸어주는 게 안전함 (운영 사고 방지)
router.use(requireAdmin_1.requireAdmin);
// ---------------------------------------------
// Validation
// ---------------------------------------------
const EventUpsertSchema = zod_1.z
    .object({
    mode: zod_1.z.enum(["explorer", "nightlife"]),
    title: zod_1.z.string().min(1),
    date: zod_1.z.string().min(8),
})
    .passthrough();
const AuditQuerySchema = zod_1.z
    .object({
    limit: zod_1.z.coerce.number().min(1).max(200).optional(),
})
    .passthrough();
// ---------------------------------------------
// Helpers
// ---------------------------------------------
function toIso(v) {
    if (!v)
        return null;
    if (typeof v === "string")
        return v;
    if (v === null || v === void 0 ? void 0 : v.toDate)
        return v.toDate().toISOString();
    if (v instanceof Date)
        return v.toISOString();
    return null;
}
function pickEventAuditFields(x) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    return {
        mode: (_a = x.mode) !== null && _a !== void 0 ? _a : undefined,
        title: (_c = (_b = x.title) !== null && _b !== void 0 ? _b : x.name) !== null && _c !== void 0 ? _c : undefined,
        description: (_d = x.description) !== null && _d !== void 0 ? _d : undefined,
        location: (_e = x.location) !== null && _e !== void 0 ? _e : undefined,
        city: (_f = x.city) !== null && _f !== void 0 ? _f : undefined,
        category: (_g = x.category) !== null && _g !== void 0 ? _g : undefined,
        organizer: (_h = x.organizer) !== null && _h !== void 0 ? _h : undefined,
        date: (_j = x.date) !== null && _j !== void 0 ? _j : undefined,
        endDate: (_k = x.endDate) !== null && _k !== void 0 ? _k : undefined,
        visibility: (_l = x.visibility) !== null && _l !== void 0 ? _l : undefined,
        isPublic: typeof x.isPublic === "boolean" ? x.isPublic : undefined,
        status: (_m = x.status) !== null && _m !== void 0 ? _m : undefined,
        // ✅ Step3: 예약 발행/발행 상태 관련 필드도 변경이력에 남김
        publishAt: (_o = x.publishAt) !== null && _o !== void 0 ? _o : undefined,
        imageUrl: (_q = (_p = x.imageUrl) !== null && _p !== void 0 ? _p : x.image) !== null && _q !== void 0 ? _q : undefined,
        gallery: Array.isArray(x.gallery) ? x.gallery : undefined,
    };
}
function diffChangedFields(before, after) {
    const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
    const changed = [];
    for (const k of keys) {
        const b = before === null || before === void 0 ? void 0 : before[k];
        const a = after === null || after === void 0 ? void 0 : after[k];
        const bs = typeof b === "string" ? b : JSON.stringify(b);
        const as = typeof a === "string" ? a : JSON.stringify(a);
        if (bs !== as)
            changed.push(k);
    }
    return changed;
}
// ---------------------------------------------
// Routes
// ---------------------------------------------
/**
 * GET /admin/events?mode=all|explorer|nightlife&limit=200
 */
router.get("/", async (req, res) => {
    try {
        const mode = String(req.query.mode || "all");
        const lim = Math.max(1, Math.min(300, Number(req.query.limit || 200)));
        const read = async (col, defaultMode) => {
            let snap;
            try {
                snap = await shared_1.db.collection(col).orderBy("createdAt", "desc").limit(lim).get();
            }
            catch (_a) {
                try {
                    snap = await shared_1.db.collection(col).orderBy("updatedAt", "desc").limit(lim).get();
                }
                catch (_b) {
                    snap = await shared_1.db.collection(col).limit(lim).get();
                }
            }
            return snap.docs.map((d) => {
                var _a, _b;
                return (Object.assign(Object.assign({ id: d.id }, d.data()), { mode: ((_b = (_a = d.data()) === null || _a === void 0 ? void 0 : _a.mode) !== null && _b !== void 0 ? _b : defaultMode) }));
            });
        };
        if (mode === "explorer")
            return res.status(200).send(await read("events", "explorer"));
        if (mode === "nightlife")
            return res.status(200).send(await read("adult_events", "nightlife"));
        const [a, b] = await Promise.all([read("events", "explorer"), read("adult_events", "nightlife")]);
        return res.status(200).send([...a, ...b]);
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to fetch events" });
    }
});
/**
 * ✅ GET /admin/events/:id/audit?limit=50
 * - writeAuditLog는 admin_audit_logs 컬렉션에 targetType/targetId를 **top-level**로 저장합니다.
 * - 레거시 로그에서 data.targetType/targetId 형태로 들어온 경우도 fallback으로 호환합니다.
 */
router.get("/:id/audit", (0, validate_1.validate)(AuditQuerySchema, "query"), async (req, res) => {
    try {
        const { id } = req.params;
        const lim = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
        const matchesEvent = (row) => {
            var _a, _b, _c;
            // ✅ 최신 스키마: top-level
            if (String((row === null || row === void 0 ? void 0 : row.targetType) || "").toLowerCase() === "event" && String((row === null || row === void 0 ? void 0 : row.targetId) || "") === String(id)) {
                return true;
            }
            // ✅ 레거시 스키마: row.data.targetType / row.data.targetId
            const legacy = (_c = (_a = row === null || row === void 0 ? void 0 : row.data) !== null && _a !== void 0 ? _a : (_b = row === null || row === void 0 ? void 0 : row.data) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : null;
            if (String((legacy === null || legacy === void 0 ? void 0 : legacy.targetType) || "").toLowerCase() === "event" && String((legacy === null || legacy === void 0 ? void 0 : legacy.targetId) || "") === String(id)) {
                return true;
            }
            // ✅ 최후 fallback: action에 id가 포함된 경우(구조 깨진 로그 대비)
            if (String((row === null || row === void 0 ? void 0 : row.action) || "").startsWith("events.") && String((legacy === null || legacy === void 0 ? void 0 : legacy.id) || (row === null || row === void 0 ? void 0 : row.targetId) || "") === String(id)) {
                return true;
            }
            return false;
        };
        const normalize = (d) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            const row = d.data();
            const legacy = (_c = (_a = row === null || row === void 0 ? void 0 : row.data) !== null && _a !== void 0 ? _a : (_b = row === null || row === void 0 ? void 0 : row.data) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : null;
            return {
                id: d.id,
                action: String(row.action || ""),
                createdAt: toIso(row.createdAt),
                byUid: (_d = row.byUid) !== null && _d !== void 0 ? _d : null,
                byEmail: (_e = row.byEmail) !== null && _e !== void 0 ? _e : null,
                targetType: (_g = (_f = row.targetType) !== null && _f !== void 0 ? _f : legacy === null || legacy === void 0 ? void 0 : legacy.targetType) !== null && _g !== void 0 ? _g : null,
                targetId: (_j = (_h = row.targetId) !== null && _h !== void 0 ? _h : legacy === null || legacy === void 0 ? void 0 : legacy.targetId) !== null && _j !== void 0 ? _j : null,
                changedFields: Array.isArray(row.changedFields)
                    ? row.changedFields
                    : Array.isArray(legacy === null || legacy === void 0 ? void 0 : legacy.changedFields)
                        ? legacy.changedFields
                        : null,
                before: (_l = (_k = row.before) !== null && _k !== void 0 ? _k : legacy === null || legacy === void 0 ? void 0 : legacy.before) !== null && _l !== void 0 ? _l : null,
                after: (_o = (_m = row.after) !== null && _m !== void 0 ? _m : legacy === null || legacy === void 0 ? void 0 : legacy.after) !== null && _o !== void 0 ? _o : null,
            };
        };
        const tryQuery = async (colName) => {
            try {
                return await shared_1.db
                    .collection(colName)
                    .where("targetType", "==", "event")
                    .where("targetId", "==", id)
                    .orderBy("createdAt", "desc")
                    .limit(lim)
                    .get();
            }
            catch (_a) {
                return null;
            }
        };
        let snap = await tryQuery("admin_audit_logs");
        // ✅ where/index가 없거나 스키마가 달라 실패하는 경우: 최근 N개 스캔
        if (!snap) {
            const fallbackRead = Math.max(lim, 300);
            const fb = await shared_1.db.collection("admin_audit_logs").orderBy("createdAt", "desc").limit(fallbackRead).get();
            const docs = fb.docs.filter((d) => matchesEvent(d.data()));
            return res.status(200).send(docs.slice(0, lim).map(normalize));
        }
        // ✅ 새 컬렉션이 비어있거나 레거시만 있는 경우: admin_audit도 시도
        if (snap.empty) {
            const legacySnap = await tryQuery("admin_audit");
            if (legacySnap && !legacySnap.empty) {
                return res.status(200).send(legacySnap.docs.slice(0, lim).map(normalize));
            }
            // legacySnap도 null/empty면 최근 스캔 fallback
            const fallbackRead = Math.max(lim, 300);
            const fb = await shared_1.db.collection("admin_audit_logs").orderBy("createdAt", "desc").limit(fallbackRead).get();
            const docs = fb.docs.filter((d) => matchesEvent(d.data()));
            return res.status(200).send(docs.slice(0, lim).map(normalize));
        }
        return res.status(200).send(snap.docs.slice(0, lim).map(normalize));
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to fetch event audit trail" });
    }
});
/**
 * GET /admin/events/:id?mode=explorer|nightlife (optional hint)
 */
router.get("/:id", async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const modeHint = (req.query.mode ? String(req.query.mode) : "");
        const tryCols = modeHint
            ? [{ col: (0, shared_1.collectionForMode)(modeHint, "events"), mode: modeHint }]
            : [
                { col: "events", mode: "explorer" },
                { col: "adult_events", mode: "nightlife" },
            ];
        for (const c of tryCols) {
            const docSnap = await shared_1.db.collection(c.col).doc(id).get();
            if (docSnap.exists) {
                const data = docSnap.data() || {};
                return res.status(200).send(Object.assign(Object.assign({ id: docSnap.id }, data), { mode: (_a = data.mode) !== null && _a !== void 0 ? _a : c.mode }));
            }
        }
        return res.status(404).send({ error: "Event not found" });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to fetch event" });
    }
});
/**
 * POST /admin/events
 */
router.post("/", (0, validate_1.validate)(EventUpsertSchema, "body"), async (req, res) => {
    try {
        const body = req.body;
        const mode = body.mode;
        const col = shared_1.db.collection((0, shared_1.collectionForMode)(mode, "events"));
        const now = admin.firestore.FieldValue.serverTimestamp();
        const payload = Object.assign(Object.assign({}, body), { title: String(body.title || "").trim(), name: String(body.title || "").trim(), date: String(body.date || "").trim(), updatedAt: now, createdAt: now, searchTokens: (0, shared_1.buildSearchTokens)([body.title]) });
        const docRef = await col.add(payload);
        // audit
        await (0, shared_1.writeAuditLog)(req, "events.create", {
            targetType: "event",
            targetId: docRef.id,
            changedFields: Object.keys(pickEventAuditFields(payload)),
            before: null,
            after: pickEventAuditFields(payload),
            id: docRef.id,
            mode,
        });
        return res.status(200).send({ id: docRef.id });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to create event" });
    }
});
/**
 * PATCH /admin/events/:id
 */
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const mode = (body.mode || req.query.mode || "explorer");
        const colName = (0, shared_1.collectionForMode)(mode, "events");
        const ref = shared_1.db.collection(colName).doc(id);
        const beforeSnap = await ref.get();
        if (!beforeSnap.exists)
            return res.status(404).send({ error: "Event not found" });
        const before = beforeSnap.data() || {};
        const now = admin.firestore.FieldValue.serverTimestamp();
        const after = Object.assign(Object.assign(Object.assign({}, before), body), { title: body.title != null ? String(body.title || "").trim() : before.title, name: body.title != null ? String(body.title || "").trim() : before.name, updatedAt: now, searchTokens: body.title != null ? (0, shared_1.buildSearchTokens)([body.title]) : before.searchTokens });
        await ref.set(after, { merge: true });
        const beforeAudit = pickEventAuditFields(before);
        const afterAudit = pickEventAuditFields(after);
        const changedFields = diffChangedFields(beforeAudit, afterAudit);
        await (0, shared_1.writeAuditLog)(req, "events.update", {
            targetType: "event",
            targetId: id,
            changedFields,
            before: beforeAudit,
            after: afterAudit,
            id,
            mode,
        });
        return res.status(200).send({ ok: true });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to update event" });
    }
});
/**
 * DELETE /admin/events/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const mode = (req.query.mode || "explorer");
        const colName = (0, shared_1.collectionForMode)(mode, "events");
        const ref = shared_1.db.collection(colName).doc(id);
        const beforeSnap = await ref.get();
        if (!beforeSnap.exists)
            return res.status(404).send({ error: "Event not found" });
        const before = beforeSnap.data() || {};
        await ref.delete();
        await (0, shared_1.writeAuditLog)(req, "events.delete", {
            targetType: "event",
            targetId: id,
            changedFields: Object.keys(pickEventAuditFields(before)),
            before: pickEventAuditFields(before),
            after: null,
            id,
            mode,
        });
        return res.status(200).send({ ok: true });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to delete event" });
    }
});
exports.default = router;
//# sourceMappingURL=events.router.js.map
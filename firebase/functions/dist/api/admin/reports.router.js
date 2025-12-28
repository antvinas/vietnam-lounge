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
// firebase/functions/src/api/admin/reports.router.ts
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
const validate_1 = require("../../middlewares/validate");
const shared_1 = require("./shared");
const router = express.Router();
// GET /admin/reports/count?status=pending|resolved|rejected|all
// -------------------------------
router.get("/count", async (req, res) => {
    try {
        const status = String(req.query.status || "pending");
        const q = status === "all" ? shared_1.db.collection("reports") : shared_1.db.collection("reports").where("status", "==", status);
        const count = await (0, shared_1.countQuery)(q);
        return res.status(200).send({ count });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to fetch reports count" });
    }
});
// -------------------------------
// 1-1) Reports Queue (운영용 Top N)
// GET /admin/reports/queue?limit=5
// 반환: { countPending, top: [...] }
// -------------------------------
router.get("/queue", async (req, res) => {
    try {
        const lim = Math.max(1, Math.min(20, Number(req.query.limit || 5)));
        const pendingQ = shared_1.db.collection("reports").where("status", "==", "pending");
        // ✅ 운영 안정: 인덱스/필드 불일치 시에도 "최소한의 결과"는 주기
        let topSnap;
        try {
            topSnap = await pendingQ.orderBy("createdAt", "desc").limit(lim).get();
        }
        catch (_a) {
            try {
                topSnap = await pendingQ.orderBy("updatedAt", "desc").limit(lim).get();
            }
            catch (_b) {
                topSnap = await pendingQ.limit(lim).get();
            }
        }
        const countPending = await (0, shared_1.countQuery)(pendingQ);
        const top = topSnap.docs.map((d) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            const data = d.data();
            const reporterUid = (_b = (_a = data.reporterUid) !== null && _a !== void 0 ? _a : data.reportedBy) !== null && _b !== void 0 ? _b : null;
            return {
                id: d.id,
                type: (_d = (_c = data.type) !== null && _c !== void 0 ? _c : data.targetType) !== null && _d !== void 0 ? _d : "report",
                createdAt: (_f = (_e = (0, shared_1.toMillis)(data.createdAt)) !== null && _e !== void 0 ? _e : data.createdAt) !== null && _f !== void 0 ? _f : null,
                updatedAt: (_h = (_g = (0, shared_1.toMillis)(data.updatedAt)) !== null && _g !== void 0 ? _g : data.updatedAt) !== null && _h !== void 0 ? _h : null,
                targetType: (_j = data.targetType) !== null && _j !== void 0 ? _j : null,
                targetId: (_k = data.targetId) !== null && _k !== void 0 ? _k : null,
                reason: (_l = data.reason) !== null && _l !== void 0 ? _l : null,
                description: (_m = data.description) !== null && _m !== void 0 ? _m : null,
                // 호환 필드
                reporterUid,
                reporterEmail: (_o = data.reporterEmail) !== null && _o !== void 0 ? _o : null,
                reportedBy: (_q = (_p = data.reportedBy) !== null && _p !== void 0 ? _p : reporterUid) !== null && _q !== void 0 ? _q : null,
                priorityScore: typeof data.priorityScore === "number" ? data.priorityScore : null,
            };
        });
        return res.status(200).send({ countPending, top });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to fetch reports queue" });
    }
});
// (Report Center)
// ==========================================
router.get("/", async (req, res) => {
    try {
        const status = String(req.query.status || "pending"); // pending|resolved|rejected|all
        const lim = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
        let q = shared_1.db.collection("reports");
        if (status !== "all")
            q = q.where("status", "==", status);
        // ✅ createdAt 없어서 500 나는 케이스 방지: createdAt -> updatedAt -> no orderBy
        let snapshot;
        try {
            snapshot = await q.orderBy("createdAt", "desc").limit(lim).get();
        }
        catch (_a) {
            try {
                snapshot = await q.orderBy("updatedAt", "desc").limit(lim).get();
            }
            catch (_b) {
                snapshot = await q.limit(lim).get();
            }
        }
        const reports = snapshot.docs.map((d) => (Object.assign({ id: d.id }, d.data())));
        return res.status(200).send(reports);
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error: "Failed to fetch reports" });
    }
});
const ProcessReportSchema = zod_1.z.object({
    action: zod_1.z.enum(["delete", "dismiss", "resolve", "reject"]),
    note: zod_1.z.string().max(500).optional(),
    resolutionNote: zod_1.z.string().max(500).optional(),
});
async function resolveReportTargetRefs(report) {
    const refs = [];
    // 1) 명시적 path 지원: "spots/<id>"
    const targetPath = typeof report.targetPath === "string" ? report.targetPath.trim() : "";
    if (targetPath.includes("/")) {
        const [col, id] = targetPath.split("/");
        if (col && id)
            refs.push(shared_1.db.collection(col).doc(id));
    }
    // 2) targetCollection + targetId
    if (report.targetCollection && report.targetId) {
        refs.push(shared_1.db.collection(String(report.targetCollection)).doc(String(report.targetId)));
    }
    const t = String(report.targetType || "").toLowerCase();
    const tid = String(report.targetId || report.contentId || report.spotId || report.eventId || "").trim();
    if (!tid)
        return refs;
    // 3) type 기반 fallback
    if (t.includes("spot")) {
        refs.push(shared_1.db.collection("spots").doc(tid));
        refs.push(shared_1.db.collection("adult_spots").doc(tid));
    }
    else if (t.includes("event")) {
        refs.push(shared_1.db.collection("events").doc(tid));
        refs.push(shared_1.db.collection("adult_events").doc(tid));
    }
    else if (t.includes("review")) {
        refs.push(shared_1.db.collection("reviews").doc(tid));
    }
    else if (t.includes("user")) {
        refs.push(shared_1.db.collection("users").doc(tid));
    }
    return refs;
}
// ✅ (신규) body 기반 처리: POST /admin/reports/process
const ProcessReportBodySchema = zod_1.z.object({
    reportId: zod_1.z.string().min(1),
    action: zod_1.z.enum(["delete", "dismiss", "resolve", "reject"]),
    note: zod_1.z.string().max(500).optional(),
    resolutionNote: zod_1.z.string().max(500).optional(),
});
function normalizeProcessAction(action) {
    const a = String(action || "").toLowerCase();
    if (a === "delete" || a === "resolve")
        return "delete";
    if (a === "dismiss" || a === "reject")
        return "dismiss";
    throw new Error("Invalid action");
}
async function runProcessReport(req, reportId, action, note) {
    const u = (0, shared_1.getUserFromReq)(req);
    await shared_1.db.runTransaction(async (t) => {
        const reportRef = shared_1.db.collection("reports").doc(reportId);
        const reportDoc = await t.get(reportRef);
        if (!reportDoc.exists)
            throw new Error("Report not found");
        const report = reportDoc.data() || {};
        const now = admin.firestore.FieldValue.serverTimestamp();
        // delete 액션이면 “가능한 범위”에서 target 삭제 시도
        let deletedTarget = false;
        if (action === "delete") {
            const refs = await resolveReportTargetRefs(report);
            for (const r of refs) {
                const targetSnap = await t.get(r);
                if (targetSnap.exists) {
                    t.delete(r);
                    deletedTarget = true;
                    break;
                }
            }
        }
        const finalStatus = action === "delete" ? "resolved" : "rejected";
        t.update(reportRef, {
            status: finalStatus,
            // 운영 추적 필드(신규/권장)
            resolverUid: (u === null || u === void 0 ? void 0 : u.uid) || null,
            resolverEmail: (u === null || u === void 0 ? void 0 : u.email) || null,
            resolutionNote: note || null,
            // 레거시/호환 필드
            adminAction: action,
            adminNote: note || null,
            processedAt: now,
            processedByUid: (u === null || u === void 0 ? void 0 : u.uid) || null,
            processedByEmail: (u === null || u === void 0 ? void 0 : u.email) || null,
            deletedTarget: action === "delete" ? deletedTarget : null,
            updatedAt: now,
        });
    });
    await (0, shared_1.writeAuditLog)(req, "reports.process", { id: reportId, action, note: note || null });
}
router.post("/process", (0, validate_1.validate)(ProcessReportBodySchema), async (req, res) => {
    var _a, _b;
    try {
        const { reportId } = req.body;
        const action = normalizeProcessAction(req.body.action);
        const note = String((_b = (_a = req.body.note) !== null && _a !== void 0 ? _a : req.body.resolutionNote) !== null && _b !== void 0 ? _b : "").trim() || undefined;
        await runProcessReport(req, reportId, action, note);
        return res.status(200).send({ ok: true });
    }
    catch (e) {
        const msg = String((e === null || e === void 0 ? void 0 : e.message) || "");
        if (msg.toLowerCase().includes("invalid action"))
            return res.status(400).send({ error: "Invalid action" });
        if (msg.toLowerCase().includes("not found"))
            return res.status(404).send({ error: "Report not found" });
        console.error(e);
        return res.status(500).send({ error: "Failed to process report" });
    }
});
// 기존 라우트 유지 (id 기반): POST /admin/reports/:id/process
router.post("/:id/process", (0, validate_1.validate)(ProcessReportSchema), async (req, res) => {
    var _a, _b;
    try {
        const { id } = req.params;
        const action = normalizeProcessAction(req.body.action);
        const note = String((_b = (_a = req.body.note) !== null && _a !== void 0 ? _a : req.body.resolutionNote) !== null && _b !== void 0 ? _b : "").trim() || undefined;
        await runProcessReport(req, id, action, note);
        return res.status(200).send({ ok: true });
    }
    catch (e) {
        const msg = String((e === null || e === void 0 ? void 0 : e.message) || "");
        if (msg.toLowerCase().includes("invalid action"))
            return res.status(400).send({ error: "Invalid action" });
        if (msg.toLowerCase().includes("not found"))
            return res.status(404).send({ error: "Report not found" });
        console.error(e);
        return res.status(500).send({ error: "Failed to process report" });
    }
});
exports.default = router;
//# sourceMappingURL=reports.router.js.map
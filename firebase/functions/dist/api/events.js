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
exports.eventsRouter = void 0;
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const requireAdmin_1 = require("../middlewares/requireAdmin");
const router = express.Router();
const db = admin.firestore();
const getCollection = (segment) => (segment === "adult" ? db.collection("adult_events") : db.collection("events"));
function ymdToday() {
    return new Date().toISOString().slice(0, 10);
}
function isAdminByClaims(decoded) {
    if (!decoded)
        return false;
    const u = decoded;
    return u.superAdmin === true || u.admin === true || u.isAdmin === true;
}
function isPublicEventData(data) {
    // ✅ Step 3.5: '진짜 비공개'를 위해 공개 조건을 서버에서도 한 번 더 적용
    // - visibility: "public" | "private"
    // - isPublic: boolean (legacy)
    // - status는 운영(UI) 개념이고, 보안은 visibility/isPublic로 통일
    const vis = data === null || data === void 0 ? void 0 : data.visibility;
    const isPub = data === null || data === void 0 ? void 0 : data.isPublic;
    const st = data === null || data === void 0 ? void 0 : data.status;
    const legacy = vis == null && isPub == null && st == null;
    return vis === "public" || isPub === true || legacy;
}
async function tryDecodeToken(req) {
    var _a;
    const idToken = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split("Bearer ")[1];
    if (!idToken)
        return null;
    try {
        return await admin.auth().verifyIdToken(idToken);
    }
    catch (_b) {
        return null;
    }
}
// GET /events/:segment/upcoming
// - P4 스키마(YYYY-MM-DD) 기준으로 동작
router.get("/:segment/upcoming", async (req, res) => {
    const { segment } = req.params;
    try {
        const today = ymdToday();
        const decoded = await tryDecodeToken(req);
        const isAdmin = isAdminByClaims(decoded);
        // ✅ 멀티데이 이벤트 대응: endDate >= today
        const snap = await getCollection(segment)
            .where("endDate", ">=", today)
            .orderBy("endDate", "asc")
            .limit(10)
            .get();
        const upcoming = snap.docs
            .map((d) => (Object.assign({ id: d.id }, d.data())))
            .filter((x) => isAdmin || isPublicEventData(x));
        return res.status(200).send(upcoming);
    }
    catch (error) {
        return res.status(500).send({ error: `Failed to fetch upcoming ${segment} events.` });
    }
});
// GET /events/:segment/:id
router.get("/:segment/:id", async (req, res) => {
    const { segment, id } = req.params;
    try {
        const decoded = await tryDecodeToken(req);
        const isAdmin = isAdminByClaims(decoded);
        const doc = await getCollection(segment).doc(id).get();
        if (!doc.exists)
            return res.status(404).send({ error: "Event not found" });
        const data = doc.data();
        if (!isAdmin && !isPublicEventData(data)) {
            // 존재 여부 노출 최소화
            return res.status(404).send({ error: "Event not found" });
        }
        return res.status(200).send(Object.assign({ id: doc.id }, data));
    }
    catch (error) {
        return res.status(500).send({ error: `Failed to fetch ${segment} event` });
    }
});
// GET /events/:segment
router.get("/:segment", async (req, res) => {
    const { segment } = req.params;
    try {
        const decoded = await tryDecodeToken(req);
        const isAdmin = isAdminByClaims(decoded);
        const snap = await getCollection(segment).get();
        const events = snap.docs
            .map((d) => (Object.assign({ id: d.id }, d.data())))
            .filter((x) => isAdmin || isPublicEventData(x));
        return res.status(200).send(events);
    }
    catch (error) {
        return res.status(500).send({ error: `Failed to fetch ${segment} events.` });
    }
});
// POST /events/:segment  ✅ admin only
router.post("/:segment", requireAdmin_1.requireAdmin, async (req, res) => {
    const { segment } = req.params;
    try {
        const body = req.body || {};
        // 최소 정합
        const date = typeof body.date === "string" && body.date ? body.date : ymdToday();
        const endDate = typeof body.endDate === "string" && body.endDate ? body.endDate : date;
        const desiredVisibility = String(body.visibility || "").trim();
        const desiredIsPublic = typeof body.isPublic === "boolean" ? body.isPublic : undefined;
        const normalizedVisibility = desiredVisibility === "public" || desiredVisibility === "private"
            ? desiredVisibility
            : desiredIsPublic === false
                ? "private"
                : "public";
        const normalizedStatus = typeof body.status === "string" && body.status
            ? body.status
            : normalizedVisibility === "public"
                ? "active"
                : "draft";
        const payload = Object.assign(Object.assign({}, body), { date,
            endDate, visibility: normalizedVisibility, isPublic: normalizedVisibility === "public", status: normalizedStatus, updatedAt: admin.firestore.FieldValue.serverTimestamp(), createdAt: admin.firestore.FieldValue.serverTimestamp() });
        const ref = await getCollection(segment).add(payload);
        return res.status(201).send(Object.assign({ id: ref.id }, payload));
    }
    catch (error) {
        return res.status(500).send({ error: `Failed to create ${segment} event` });
    }
});
// DELETE /events/:segment/:id ✅ admin only
router.delete("/:segment/:id", requireAdmin_1.requireAdmin, async (req, res) => {
    const { segment, id } = req.params;
    try {
        await getCollection(segment).doc(id).delete();
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).send({ error: `Failed to delete ${segment} event` });
    }
});
exports.eventsRouter = router;
//# sourceMappingURL=events.js.map
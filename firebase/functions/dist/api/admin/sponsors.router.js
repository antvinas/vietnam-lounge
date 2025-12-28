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
// firebase/functions/src/api/admin/sponsors.router.ts
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
const validate_1 = require("../../middlewares/validate");
const shared_1 = require("./shared");
const router = express.Router();
// ==========================================
router.get("/requests", async (req, res) => {
    try {
        const status = String(req.query.status || "all").trim().toLowerCase(); // pending|approved|expired|all
        const lim = 200;
        const sortLocal = (arr) => arr.sort((a, b) => {
            var _a, _b, _c, _d;
            const ta = (_b = (_a = (0, shared_1.toMillis)(a.createdAt)) !== null && _a !== void 0 ? _a : (0, shared_1.toMillis)(a.updatedAt)) !== null && _b !== void 0 ? _b : 0;
            const tb = (_d = (_c = (0, shared_1.toMillis)(b.createdAt)) !== null && _c !== void 0 ? _c : (0, shared_1.toMillis)(b.updatedAt)) !== null && _d !== void 0 ? _d : 0;
            return tb - ta;
        });
        // ✅ 인덱스/필드 불일치로 500 나는 케이스 방지
        // - where(status==X) + orderBy(createdAt) 는 composite index가 없으면 실패할 수 있음
        // - 실패 시: 넉넉히 읽어서 서버에서 필터/정렬
        const fetchAll = async () => {
            try {
                return await shared_1.db.collection("sponsorRequests").orderBy("createdAt", "desc").limit(lim).get();
            }
            catch (_a) {
                try {
                    return await shared_1.db.collection("sponsorRequests").orderBy("updatedAt", "desc").limit(lim).get();
                }
                catch (_b) {
                    return await shared_1.db.collection("sponsorRequests").limit(lim).get();
                }
            }
        };
        if (status === "all") {
            const snap = await fetchAll();
            const list = snap.docs.map((d) => (Object.assign({ id: d.id }, d.data())));
            sortLocal(list);
            return res.status(200).send(list);
        }
        // status 필터 시도(성공하면 가장 효율적)
        try {
            const snap = await shared_1.db.collection("sponsorRequests").where("status", "==", status).orderBy("createdAt", "desc").limit(lim).get();
            return res.status(200).send(snap.docs.map((d) => (Object.assign({ id: d.id }, d.data()))));
        }
        catch (_a) {
            // fallback: 전체 읽어서 필터
            const snap = await fetchAll();
            let list = snap.docs.map((d) => (Object.assign({ id: d.id }, d.data())));
            list = list.filter((x) => String(x.status || "").toLowerCase() === status);
            sortLocal(list);
            return res.status(200).send(list.slice(0, lim));
        }
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to fetch sponsor requests" });
    }
});
const ApproveSponsorSchema = zod_1.z.object({
    untilDate: zod_1.z.string().min(8), // YYYY-MM-DD
});
router.post("/requests/:id/approve", (0, validate_1.validate)(ApproveSponsorSchema), async (req, res) => {
    var _a, _b;
    try {
        const { id } = req.params;
        const { untilDate } = req.body;
        const ref = shared_1.db.collection("sponsorRequests").doc(id);
        const snap = await ref.get();
        if (!snap.exists)
            return res.status(404).send({ error: "Request not found" });
        const data = snap.data() || {};
        const now = admin.firestore.FieldValue.serverTimestamp();
        await ref.set({
            status: "approved",
            sponsorUntil: untilDate,
            approvedAt: now,
            approvedByUid: ((_a = (0, shared_1.getUserFromReq)(req)) === null || _a === void 0 ? void 0 : _a.uid) || null,
            approvedByEmail: ((_b = (0, shared_1.getUserFromReq)(req)) === null || _b === void 0 ? void 0 : _b.email) || null,
            updatedAt: now,
        }, { merge: true });
        const spotId = String(data.spotId || "").trim();
        if (spotId) {
            const patch = {
                isSponsored: true,
                sponsorLevel: data.sponsorLevel || "banner",
                sponsorExpiry: untilDate,
                sponsorRequestId: id,
                updatedAt: now,
            };
            const candidates = [shared_1.db.collection("spots").doc(spotId), shared_1.db.collection("adult_spots").doc(spotId)];
            for (const r of candidates) {
                const s = await r.get();
                if (s.exists) {
                    await r.set(patch, { merge: true });
                    break;
                }
            }
        }
        await (0, shared_1.writeAuditLog)(req, "sponsors.request.approve", { id, untilDate, spotId: spotId || null });
        return res.status(200).send({ ok: true });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to approve sponsor request" });
    }
});
router.post("/requests/:id/expire", async (req, res) => {
    var _a, _b;
    try {
        const { id } = req.params;
        const ref = shared_1.db.collection("sponsorRequests").doc(id);
        const snap = await ref.get();
        if (!snap.exists)
            return res.status(404).send({ error: "Request not found" });
        const data = snap.data() || {};
        const now = admin.firestore.FieldValue.serverTimestamp();
        await ref.set({
            status: "expired",
            expiredAt: now,
            expiredByUid: ((_a = (0, shared_1.getUserFromReq)(req)) === null || _a === void 0 ? void 0 : _a.uid) || null,
            expiredByEmail: ((_b = (0, shared_1.getUserFromReq)(req)) === null || _b === void 0 ? void 0 : _b.email) || null,
            updatedAt: now,
        }, { merge: true });
        const spotId = String(data.spotId || "").trim();
        if (spotId) {
            const patch = {
                isSponsored: false,
                sponsorLevel: null,
                sponsorExpiry: null,
                sponsorRequestId: null,
                updatedAt: now,
            };
            const candidates = [shared_1.db.collection("spots").doc(spotId), shared_1.db.collection("adult_spots").doc(spotId)];
            for (const r of candidates) {
                const s = await r.get();
                if (s.exists) {
                    await r.set(patch, { merge: true });
                    break;
                }
            }
        }
        await (0, shared_1.writeAuditLog)(req, "sponsors.request.expire", { id, spotId: spotId || null });
        return res.status(200).send({ ok: true });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to expire sponsor request" });
    }
});
// ✅ 만료 임박 스폰서 스팟 목록
router.get("/expiring", async (req, res) => {
    try {
        const days = Math.max(1, Math.min(60, Number(req.query.days || 7)));
        const today = (0, shared_1.isoToday)();
        const end = new Date();
        end.setDate(end.getDate() + days);
        const endStr = end.toISOString().split("T")[0];
        const pick = async (col, mode) => {
            try {
                const snap = await shared_1.db
                    .collection(col)
                    .where("isSponsored", "==", true)
                    .where("sponsorExpiry", ">=", today)
                    .where("sponsorExpiry", "<=", endStr)
                    .orderBy("sponsorExpiry", "asc")
                    .limit(200)
                    .get();
                return snap.docs.map((d) => (Object.assign(Object.assign({ id: d.id }, d.data()), { mode })));
            }
            catch (_a) {
                const snap = await shared_1.db.collection(col).where("isSponsored", "==", true).limit(300).get();
                return snap.docs
                    .map((d) => (Object.assign(Object.assign({ id: d.id }, d.data()), { mode })))
                    .filter((s) => {
                    const exp = String(s.sponsorExpiry || "");
                    return exp && exp >= today && exp <= endStr;
                })
                    .sort((a, b) => String(a.sponsorExpiry).localeCompare(String(b.sponsorExpiry)));
            }
        };
        const [a, b] = await Promise.all([pick("spots", "explorer"), pick("adult_spots", "nightlife")]);
        return res.status(200).send([...a, ...b]);
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to fetch expiring sponsors" });
    }
});
// ==========================================
// 7. 광고/스폰서 통계 (기존 유지)
// ==========================================
router.get("/stats", async (req, res) => {
    try {
        const days = Math.max(1, Math.min(30, Number(req.query.days || 7)));
        const date = new Date();
        date.setDate(date.getDate() - days);
        const startDateStr = date.toISOString().split("T")[0];
        const snapshot = await shared_1.db.collection("daily_ad_stats").where("date", ">=", startDateStr).orderBy("date", "asc").get();
        const stats = snapshot.docs.map((d) => d.data());
        return res.status(200).send(stats);
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error: "Failed to fetch stats" });
    }
});
exports.default = router;
//# sourceMappingURL=sponsors.router.js.map
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
exports.reviewsRouter = void 0;
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const validate_1 = require("../middlewares/validate");
const rateLimit_1 = require("../middlewares/rateLimit");
const requireAuth_1 = require("../middlewares/requireAuth"); // 기존 파일
const review_1 = require("../utils/schema/review");
const db = () => admin.firestore();
const router = express.Router();
router.get("/", rateLimit_1.publicLimiter, (0, validate_1.validate)(review_1.ReviewListQuerySchema), async (req, res) => {
    const { spotId, sort, page, limit } = req._validated.query;
    try {
        let q = db().collection("spots").doc(spotId).collection("reviews");
        if (sort === "latest")
            q = q.orderBy("createdAt", "desc");
        if (sort === "highest")
            q = q.orderBy("rating", "desc").orderBy("createdAt", "desc");
        if (sort === "lowest")
            q = q.orderBy("rating", "asc").orderBy("createdAt", "desc");
        const offset = (page - 1) * limit;
        const snap = await q.offset(offset).limit(limit).get();
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        res.send({ items, page, limit, hasMore: items.length === limit });
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "FailedToListReviews" });
    }
});
router.post("/", rateLimit_1.authLimiter, requireAuth_1.requireAuth, (0, validate_1.validate)(review_1.ReviewCreateSchema, "body"), async (req, res) => {
    const { spotId, rating, content, photos = [], nickname } = req._validated.body;
    try {
        const ref = db().collection("spots").doc(spotId).collection("reviews").doc();
        await ref.set({
            rating,
            content,
            photos,
            nickname: nickname || req.user?.name || "익명",
            userId: req.user?.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(201).send({ id: ref.id });
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "FailedToCreateReview" });
    }
});
router.post("/report", rateLimit_1.authLimiter, requireAuth_1.requireAuth, (0, validate_1.validate)(review_1.ReviewReportSchema, "body"), async (req, res) => {
    const { spotId, reviewId, reason } = req._validated.body;
    try {
        const ref = db().collection("spots").doc(spotId).collection("reviews").doc(reviewId);
        await ref.update({
            reports: admin.firestore.FieldValue.increment(1),
            lastReportReason: reason || null,
            lastReportAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.send({ ok: true });
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "FailedToReportReview" });
    }
});
exports.reviewsRouter = router;
//# sourceMappingURL=reviews.js.map
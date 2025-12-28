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
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
const validate_1 = require("../middlewares/validate");
const router = express.Router();
const getDb = () => admin.firestore();
// 캐시 변수 제거 (사용하지 않음)
/** 목록 조회용 쿼리 스키마 */
const ListQuery = zod_1.z.object({
    q: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    region: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    sort: zod_1.z.enum(["latest", "rating", "popular"]).optional().default("latest"),
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(20),
    mode: zod_1.z.enum(["explorer", "nightlife"]).optional().default("explorer"),
});
/** 목록 조회 */
router.get("/", (0, validate_1.validate)(ListQuery), async (req, res) => {
    try {
        // 🟢 [수정] 사용하지 않는 변수 'q' 제거
        const { city, region, category, sort, page, limit, mode } = req.query;
        const colName = mode === "nightlife" ? "adult_spots" : "spots";
        let queryRef = getDb().collection(colName);
        // 필터링 적용
        if (city)
            queryRef = queryRef.where("locationId", "==", city);
        if (region)
            queryRef = queryRef.where("region", "==", region);
        if (category)
            queryRef = queryRef.where("category", "==", category);
        // 정렬
        if (sort === "rating")
            queryRef = queryRef.orderBy("rating", "desc");
        else if (sort === "popular")
            queryRef = queryRef.orderBy("viewCount", "desc");
        else
            queryRef = queryRef.orderBy("createdAt", "desc");
        const offset = (page - 1) * limit;
        const snapshot = await queryRef.offset(offset).limit(limit).get();
        const items = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.send({
            data: items,
            page,
            nextPage: items.length === limit ? page + 1 : null
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch spots" });
    }
});
/** 상세 조회 */
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const mode = req.query.mode;
    const col = mode === "nightlife" ? "adult_spots" : "spots";
    try {
        const ref = getDb().collection(col).doc(String(id));
        const doc = await ref.get();
        if (!doc.exists) {
            return res.status(404).send({ error: "NotFound" });
        }
        ref.update({ viewCount: admin.firestore.FieldValue.increment(1) }).catch(() => { });
        return res.send(Object.assign({ id: doc.id }, doc.data()));
    }
    catch (e) {
        return res.status(500).send({ error: "FailedToFetchDetail" });
    }
});
exports.default = router;
//# sourceMappingURL=spots.js.map
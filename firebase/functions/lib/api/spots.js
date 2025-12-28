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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spotsRouter = void 0;
// functions/src/api/spots.ts
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const node_cache_1 = __importDefault(require("node-cache"));
const zod_1 = require("zod");
const validate_1 = require("../middlewares/validate");
const rateLimit_1 = require("../middlewares/rateLimit");
const router = express.Router();
const getDb = () => admin.firestore();
const recommendationCache = new node_cache_1.default({ stdTTL: 3600 });
/** 쿼리 스키마 수정 (q 추가) */
const ListQuery = zod_1.z.object({
    q: zod_1.z.string().optional(), // 🆕 검색어 파라미터 추가
    city: zod_1.z.string().optional(),
    region: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    sort: zod_1.z.enum(["latest", "rating", "popular"]).optional().default("latest"),
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(20),
    mode: zod_1.z.enum(["explorer", "nightlife"]).optional().default("explorer"),
});
/** 목록 조회 (검색 기능 포함) */
router.get("/", rateLimit_1.publicLimiter, (0, validate_1.validate)(ListQuery), async (req, res) => {
    // validated 된 쿼리 데이터 가져오기
    const { q, city, region, category, sort, page, limit, mode } = req._validated.query;
    // 모드에 따라 컬렉션 선택
    const col = mode === "nightlife" ? "adult_spots" : "spots";
    try {
        let query = getDb().collection(col);
        // 🆕 1. 검색어 필터링 (키워드 검색)
        // Firestore의 array-contains는 단일 필드에 대해서만 동작하며, 다른 범위 필터(<, >)와 동시 사용 제약이 있을 수 있음
        if (q) {
            // 입력받은 검색어를 소문자로 변환하여 키워드 배열에서 찾음
            query = query.where("keywords", "array-contains", q.toLowerCase());
        }
        // 2. 기존 필터링
        if (city)
            query = query.where("city", "==", city);
        if (region)
            query = query.where("region", "==", region);
        if (category)
            query = query.where("category", "==", category);
        // 3. 정렬 (검색어 사용 시에는 정렬 제약이 생길 수 있음 - 필요시 인덱스 생성 에러 로그 확인하여 링크 클릭)
        if (sort === "popular") {
            query = query.orderBy("viewCount", "desc");
        }
        else if (sort === "rating") {
            query = query.orderBy("rating", "desc");
        }
        else {
            query = query.orderBy("createdAt", "desc");
        }
        // 4. 페이지네이션
        // offset 방식은 데이터가 많아지면 느리지만 초기 구현에는 적합
        const offset = (page - 1) * limit;
        const snapshot = await query.limit(limit).offset(offset).get();
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        res.send({
            data: items,
            meta: { page, limit, total: items.length } // 전체 개수(count)는 별도 쿼리 필요하므로 여기선 현재 가져온 개수나 임시처리
        });
    }
    catch (e) {
        console.error("Spots List Error:", e);
        res.status(500).send({ error: "FailedToFetchSpots" });
    }
});
/** 상세 조회 (조회수 증가 포함) - 기존 코드 유지 */
router.get("/:id", rateLimit_1.publicLimiter, async (req, res) => {
    const { id } = req.params;
    const mode = req.query.mode;
    const col = mode === "nightlife" ? "adult_spots" : "spots";
    try {
        const ref = getDb().collection(col).doc(String(id));
        const doc = await ref.get();
        if (!doc.exists)
            return res.status(404).send({ error: "NotFound" });
        // 조회수 증가 (비동기 처리하여 응답 속도 저하 방지)
        ref.update({ viewCount: admin.firestore.FieldValue.increment(1) }).catch(() => { });
        res.send({ id: doc.id, ...doc.data() });
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "FailedToFetchDetail" });
    }
});
/** 추천 스팟 캐시 - 기존 코드 유지 */
router.get("/featured", rateLimit_1.publicLimiter, async (_req, res) => {
    try {
        const cached = recommendationCache.get("featured");
        if (cached)
            return res.send(cached);
        const snap = await getDb()
            .collection("spots")
            .where("isSponsored", "==", true)
            .orderBy("sponsorLevel", "desc")
            .limit(12)
            .get();
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        recommendationCache.set("featured", items);
        res.send(items);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "FailedToFetchFeatured" });
    }
});
exports.spotsRouter = router;
//# sourceMappingURL=spots.js.map
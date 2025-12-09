// functions/src/api/spots.ts
import * as express from "express";
import * as admin from "firebase-admin";
import NodeCache from "node-cache";
import { z } from "zod";
import { validate } from "../middlewares/validate";
import { publicLimiter, authLimiter } from "../middlewares/rateLimit";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAge } from "../middlewares/requireAge";

const router = express.Router();
const getDb = () => admin.firestore();
const recommendationCache = new NodeCache({ stdTTL: 3600 });

/** 쿼리 스키마 수정 (q 추가) */
const ListQuery = z.object({
  q: z.string().optional(), // 🆕 검색어 파라미터 추가
  city: z.string().optional(),
  region: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["latest", "rating", "popular"]).optional().default("latest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  mode: z.enum(["explorer", "nightlife"]).optional().default("explorer"),
});

/** 목록 조회 (검색 기능 포함) */
router.get("/", publicLimiter, validate(ListQuery), async (req, res) => {
  // validated 된 쿼리 데이터 가져오기
  const { q, city, region, category, sort, page, limit, mode } = (req as any)._validated.query;
  
  // 모드에 따라 컬렉션 선택
  const col = mode === "nightlife" ? "adult_spots" : "spots";
  
  try {
    let query = getDb().collection(col) as admin.firestore.Query;

    // 🆕 1. 검색어 필터링 (키워드 검색)
    // Firestore의 array-contains는 단일 필드에 대해서만 동작하며, 다른 범위 필터(<, >)와 동시 사용 제약이 있을 수 있음
    if (q) {
      // 입력받은 검색어를 소문자로 변환하여 키워드 배열에서 찾음
      query = query.where("keywords", "array-contains", q.toLowerCase());
    }

    // 2. 기존 필터링
    if (city) query = query.where("city", "==", city);
    if (region) query = query.where("region", "==", region);
    if (category) query = query.where("category", "==", category);

    // 3. 정렬 (검색어 사용 시에는 정렬 제약이 생길 수 있음 - 필요시 인덱스 생성 에러 로그 확인하여 링크 클릭)
    if (sort === "popular") {
      query = query.orderBy("viewCount", "desc");
    } else if (sort === "rating") {
      query = query.orderBy("rating", "desc");
    } else {
      query = query.orderBy("createdAt", "desc");
    }

    // 4. 페이지네이션
    // offset 방식은 데이터가 많아지면 느리지만 초기 구현에는 적합
    const offset = (page - 1) * limit;
    const snapshot = await query.limit(limit).offset(offset).get();

    const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    
    res.send({
      data: items,
      meta: { page, limit, total: items.length } // 전체 개수(count)는 별도 쿼리 필요하므로 여기선 현재 가져온 개수나 임시처리
    });
  } catch (e) {
    console.error("Spots List Error:", e);
    res.status(500).send({ error: "FailedToFetchSpots" });
  }
});

/** 상세 조회 (조회수 증가 포함) - 기존 코드 유지 */
router.get("/:id", publicLimiter, async (req, res) => {
  const { id } = req.params;
  const mode = req.query.mode as string;
  const col = mode === "nightlife" ? "adult_spots" : "spots";

  try {
    const ref = getDb().collection(col).doc(String(id));
    const doc = await ref.get();
    
    if (!doc.exists) return res.status(404).send({ error: "NotFound" });
    
    // 조회수 증가 (비동기 처리하여 응답 속도 저하 방지)
    ref.update({ viewCount: admin.firestore.FieldValue.increment(1) }).catch(() => {});
    
    res.send({ id: doc.id, ...(doc.data() as any) });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "FailedToFetchDetail" });
  }
});

/** 추천 스팟 캐시 - 기존 코드 유지 */
router.get("/featured", publicLimiter, async (_req, res) => {
  try {
    const cached = recommendationCache.get("featured");
    if (cached) return res.send(cached);

    const snap = await getDb()
      .collection("spots")
      .where("isSponsored", "==", true)
      .orderBy("sponsorLevel", "desc")
      .limit(12)
      .get();

    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    recommendationCache.set("featured", items);
    res.send(items);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "FailedToFetchFeatured" });
  }
});

export const spotsRouter = router;
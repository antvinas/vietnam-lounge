import * as express from "express";
import * as admin from "firebase-admin";
import { z } from "zod";
import { validate } from "../middlewares/validate";

const router = express.Router();
const getDb = () => admin.firestore();

// 캐시 변수 제거 (사용하지 않음)

/** 목록 조회용 쿼리 스키마 */
const ListQuery = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["latest", "rating", "popular"]).optional().default("latest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  mode: z.enum(["explorer", "nightlife"]).optional().default("explorer"),
});

/** 목록 조회 */
router.get("/", validate(ListQuery), async (req, res) => {
  try {
    // 🟢 [수정] 사용하지 않는 변수 'q' 제거
    const { 
      city, region, category, sort, page, limit, mode 
    } = req.query as any;

    const colName = mode === "nightlife" ? "adult_spots" : "spots";
    let queryRef: FirebaseFirestore.Query = getDb().collection(colName);

    // 필터링 적용
    if (city) queryRef = queryRef.where("locationId", "==", city);
    if (region) queryRef = queryRef.where("region", "==", region);
    if (category) queryRef = queryRef.where("category", "==", category);

    // 정렬
    if (sort === "rating") queryRef = queryRef.orderBy("rating", "desc");
    else if (sort === "popular") queryRef = queryRef.orderBy("viewCount", "desc");
    else queryRef = queryRef.orderBy("createdAt", "desc");

    const offset = (page - 1) * limit;
    const snapshot = await queryRef.offset(offset).limit(limit).get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.send({ 
      data: items, 
      page, 
      nextPage: items.length === limit ? page + 1 : null 
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch spots" });
  }
});

/** 상세 조회 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const mode = req.query.mode as string;
  const col = mode === "nightlife" ? "adult_spots" : "spots";

  try {
    const ref = getDb().collection(col).doc(String(id));
    const doc = await ref.get();
    
    if (!doc.exists) {
      return res.status(404).send({ error: "NotFound" });
    }
    
    ref.update({ viewCount: admin.firestore.FieldValue.increment(1) }).catch(() => {});
    
    return res.send({ id: doc.id, ...doc.data() });
  } catch (e) {
    return res.status(500).send({ error: "FailedToFetchDetail" });
  }
});

export default router;
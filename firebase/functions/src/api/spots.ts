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

/** 쿼리 스키마 */
const ListQuery = z.object({
  city: z.string().optional(),
  region: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["latest", "rating", "popular"]).optional().default("latest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  mode: z.enum(["explorer", "nightlife"]).optional().default("explorer"),
});

/** 목록 with 페이징·정렬 */
router.get("/", publicLimiter, validate(ListQuery), async (req, res) => {
  const { city, region, category, sort, page, limit, mode } = (req as any)._validated.query;
  const col = mode === "nightlife" ? "adult_spots" : "spots";

  try {
    let q = getDb().collection(col) as FirebaseFirestore.Query;

    if (city) q = q.where("city", "==", city);
    else if (region) q = q.where("region", "==", region);
    if (category) q = q.where("category", "==", category);

    if (sort === "latest") q = q.orderBy("createdAt", "desc");
    if (sort === "rating") q = q.orderBy("rating", "desc").orderBy("createdAt", "desc");
    if (sort === "popular") q = q.orderBy("viewCount", "desc").orderBy("createdAt", "desc");

    const offset = (page - 1) * limit;
    const snap = await q.offset(offset).limit(limit).get();
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    res.send({ items, page, limit, hasMore: items.length === limit });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "FailedToFetchSpots" });
  }
});

/** 상세조회 + 조회수 증가 */
router.get("/detail", publicLimiter, async (req, res) => {
  const { id, mode = "explorer" } = req.query as any;
  if (!id) return res.status(400).send({ error: "SpotIdRequired" });
  const col = mode === "nightlife" ? "adult_spots" : "spots";

  try {
    const ref = getDb().collection(col).doc(String(id));
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).send({ error: "NotFound" });
    await ref.update({ viewCount: admin.firestore.FieldValue.increment(1) }).catch(() => {});
    res.send({ id: doc.id, ...(doc.data() as any) });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "FailedToFetchDetail" });
  }
});

/** 추천 스팟 캐시 */
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

/** 어덜트 전용 */
router.get("/adult", authLimiter, requireAuth, requireAge, async (_req, res) => {
  try {
    const snap = await getDb().collection("adult_spots").limit(100).get();
    res.send(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "FailedToFetchAdultSpots" });
  }
});

export const spotsRouter = router;

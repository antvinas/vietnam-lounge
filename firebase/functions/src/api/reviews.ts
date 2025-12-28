import * as express from "express";
import * as admin from "firebase-admin";
import { validate } from "../middlewares/validate";
import { authLimiter, publicLimiter } from "../middlewares/rateLimit";
import { requireAuth } from "../middlewares/requireAuth"; // 기존 파일
import { ReviewCreateSchema, ReviewListQuerySchema, ReviewReportSchema } from "../utils/schema/review";

const db = () => admin.firestore();
const router = express.Router();

router.get("/", publicLimiter, validate(ReviewListQuerySchema), async (req, res) => {
  const { spotId, sort, page, limit } = (req as any)._validated.query;
  try {
    let q = db().collection("spots").doc(spotId).collection("reviews") as FirebaseFirestore.Query;
    if (sort === "latest") q = q.orderBy("createdAt", "desc");
    if (sort === "highest") q = q.orderBy("rating", "desc").orderBy("createdAt", "desc");
    if (sort === "lowest") q = q.orderBy("rating", "asc").orderBy("createdAt", "desc");

    const offset = (page - 1) * limit;
    const snap = await q.offset(offset).limit(limit).get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.send({ items, page, limit, hasMore: items.length === limit });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "FailedToListReviews" });
  }
});

router.post("/", authLimiter, requireAuth, validate(ReviewCreateSchema, "body"), async (req, res) => {
  const { spotId, rating, content, photos = [], nickname } = (req as any)._validated.body;
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
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "FailedToCreateReview" });
  }
});

router.post("/report", authLimiter, requireAuth, validate(ReviewReportSchema, "body"), async (req, res) => {
  const { spotId, reviewId, reason } = (req as any)._validated.body;
  try {
    const ref = db().collection("spots").doc(spotId).collection("reviews").doc(reviewId);
    await ref.update({
      reports: admin.firestore.FieldValue.increment(1),
      lastReportReason: reason || null,
      lastReportAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.send({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "FailedToReportReview" });
  }
});

export const reviewsRouter = router;

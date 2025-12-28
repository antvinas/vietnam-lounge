// firebase/functions/src/api/admin/stats.router.ts
import * as express from "express";
import { countCollection, countQuery, db } from "./shared";


const router = express.Router();

// GET /admin/stats
// -------------------------------
router.get("/", async (_req, res) => {
  try {
    const [userCount, spots1, spots2, events1, events2] = await Promise.all([
      countCollection("users"),
      countCollection("spots"),
      countCollection("adult_spots"),
      countCollection("events"),
      countCollection("adult_events"),
    ]);

    const [sponsor1, sponsor2] = await Promise.all([
      countQuery(db.collection("spots").where("isSponsored", "==", true)),
      countQuery(db.collection("adult_spots").where("isSponsored", "==", true)),
    ]);

    return res.status(200).send({
      userCount,
      spotCount: spots1 + spots2,
      eventCount: events1 + events2,
      sponsorCount: sponsor1 + sponsor2,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to fetch dashboard stats" });
  }
});

export default router;

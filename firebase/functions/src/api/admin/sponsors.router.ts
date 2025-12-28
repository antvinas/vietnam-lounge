// firebase/functions/src/api/admin/sponsors.router.ts
import * as express from "express";
import * as admin from "firebase-admin";
import { z } from "zod";
import { validate } from "../../middlewares/validate";
import { db, getUserFromReq, isoToday, toMillis, writeAuditLog } from "./shared";


const router = express.Router();

// ==========================================
router.get("/requests", async (req, res) => {
  try {
    const status = String(req.query.status || "all").trim().toLowerCase(); // pending|approved|expired|all
    const lim = 200;

    const sortLocal = (arr: any[]) =>
      arr.sort((a, b) => {
        const ta = toMillis((a as any).createdAt) ?? toMillis((a as any).updatedAt) ?? 0;
        const tb = toMillis((b as any).createdAt) ?? toMillis((b as any).updatedAt) ?? 0;
        return tb - ta;
      });

    // ✅ 인덱스/필드 불일치로 500 나는 케이스 방지
    // - where(status==X) + orderBy(createdAt) 는 composite index가 없으면 실패할 수 있음
    // - 실패 시: 넉넉히 읽어서 서버에서 필터/정렬
    const fetchAll = async () => {
      try {
        return await db.collection("sponsorRequests").orderBy("createdAt", "desc").limit(lim).get();
      } catch {
        try {
          return await db.collection("sponsorRequests").orderBy("updatedAt", "desc").limit(lim).get();
        } catch {
          return await db.collection("sponsorRequests").limit(lim).get();
        }
      }
    };

    if (status === "all") {
      const snap = await fetchAll();
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      sortLocal(list);
      return res.status(200).send(list);
    }

    // status 필터 시도(성공하면 가장 효율적)
    try {
      const snap = await db.collection("sponsorRequests").where("status", "==", status).orderBy("createdAt", "desc").limit(lim).get();
      return res.status(200).send(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      // fallback: 전체 읽어서 필터
      const snap = await fetchAll();
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list = list.filter((x: any) => String(x.status || "").toLowerCase() === status);
      sortLocal(list);
      return res.status(200).send(list.slice(0, lim));
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to fetch sponsor requests" });
  }
});

const ApproveSponsorSchema = z.object({
  untilDate: z.string().min(8), // YYYY-MM-DD
});

router.post("/requests/:id/approve", validate(ApproveSponsorSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { untilDate } = req.body as { untilDate: string };

    const ref = db.collection("sponsorRequests").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).send({ error: "Request not found" });

    const data = snap.data() || {};
    const now = admin.firestore.FieldValue.serverTimestamp();

    await ref.set(
      {
        status: "approved",
        sponsorUntil: untilDate,
        approvedAt: now,
        approvedByUid: getUserFromReq(req)?.uid || null,
        approvedByEmail: getUserFromReq(req)?.email || null,
        updatedAt: now,
      },
      { merge: true }
    );

    const spotId = String((data as any).spotId || "").trim();
    if (spotId) {
      const patch = {
        isSponsored: true,
        sponsorLevel: (data as any).sponsorLevel || "banner",
        sponsorExpiry: untilDate,
        sponsorRequestId: id,
        updatedAt: now,
      };

      const candidates = [db.collection("spots").doc(spotId), db.collection("adult_spots").doc(spotId)];
      for (const r of candidates) {
        const s = await r.get();
        if (s.exists) {
          await r.set(patch, { merge: true });
          break;
        }
      }
    }

    await writeAuditLog(req, "sponsors.request.approve", { id, untilDate, spotId: spotId || null });
    return res.status(200).send({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to approve sponsor request" });
  }
});

router.post("/requests/:id/expire", async (req, res) => {
  try {
    const { id } = req.params;

    const ref = db.collection("sponsorRequests").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).send({ error: "Request not found" });

    const data = snap.data() || {};
    const now = admin.firestore.FieldValue.serverTimestamp();

    await ref.set(
      {
        status: "expired",
        expiredAt: now,
        expiredByUid: getUserFromReq(req)?.uid || null,
        expiredByEmail: getUserFromReq(req)?.email || null,
        updatedAt: now,
      },
      { merge: true }
    );

    const spotId = String((data as any).spotId || "").trim();
    if (spotId) {
      const patch = {
        isSponsored: false,
        sponsorLevel: null,
        sponsorExpiry: null,
        sponsorRequestId: null,
        updatedAt: now,
      };
      const candidates = [db.collection("spots").doc(spotId), db.collection("adult_spots").doc(spotId)];
      for (const r of candidates) {
        const s = await r.get();
        if (s.exists) {
          await r.set(patch, { merge: true });
          break;
        }
      }
    }

    await writeAuditLog(req, "sponsors.request.expire", { id, spotId: spotId || null });
    return res.status(200).send({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to expire sponsor request" });
  }
});

// ✅ 만료 임박 스폰서 스팟 목록
router.get("/expiring", async (req, res) => {
  try {
    const days = Math.max(1, Math.min(60, Number(req.query.days || 7)));
    const today = isoToday();
    const end = new Date();
    end.setDate(end.getDate() + days);
    const endStr = end.toISOString().split("T")[0];

    const pick = async (col: string, mode: "explorer" | "nightlife") => {
      try {
        const snap = await db
          .collection(col)
          .where("isSponsored", "==", true)
          .where("sponsorExpiry", ">=", today)
          .where("sponsorExpiry", "<=", endStr)
          .orderBy("sponsorExpiry", "asc")
          .limit(200)
          .get();
        return snap.docs.map((d) => ({ id: d.id, ...d.data(), mode }));
      } catch {
        const snap = await db.collection(col).where("isSponsored", "==", true).limit(300).get();
        return snap.docs
          .map((d) => ({ id: d.id, ...d.data(), mode }))
          .filter((s: any) => {
            const exp = String(s.sponsorExpiry || "");
            return exp && exp >= today && exp <= endStr;
          })
          .sort((a: any, b: any) => String(a.sponsorExpiry).localeCompare(String(b.sponsorExpiry)));
      }
    };

    const [a, b] = await Promise.all([pick("spots", "explorer"), pick("adult_spots", "nightlife")]);
    return res.status(200).send([...a, ...b]);
  } catch (e) {
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

    const snapshot = await db.collection("daily_ad_stats").where("date", ">=", startDateStr).orderBy("date", "asc").get();

    const stats = snapshot.docs.map((d) => d.data());
    return res.status(200).send(stats);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Failed to fetch stats" });
  }
});

export default router;

// firebase/functions/src/api/admin/reports.router.ts
import * as express from "express";
import * as admin from "firebase-admin";
import { z } from "zod";
import { validate } from "../../middlewares/validate";
import { db, toMillis, getUserFromReq, countQuery, writeAuditLog } from "./shared";

const router = express.Router();

// GET /admin/reports/count?status=pending|resolved|rejected|all
// -------------------------------
router.get("/count", async (req, res) => {
  try {
    const status = String(req.query.status || "pending");
    const q = status === "all" ? db.collection("reports") : db.collection("reports").where("status", "==", status);
    const count = await countQuery(q as any);
    return res.status(200).send({ count });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to fetch reports count" });
  }
});

// -------------------------------
// 1-1) Reports Queue (운영용 Top N)
// GET /admin/reports/queue?limit=5
// 반환: { countPending, top: [...] }
// -------------------------------
router.get("/queue", async (req, res) => {
  try {
    const lim = Math.max(1, Math.min(20, Number(req.query.limit || 5)));

    const pendingQ = db.collection("reports").where("status", "==", "pending");

    // ✅ 운영 안정: 인덱스/필드 불일치 시에도 "최소한의 결과"는 주기
    let topSnap: FirebaseFirestore.QuerySnapshot;
    try {
      topSnap = await pendingQ.orderBy("createdAt", "desc").limit(lim).get();
    } catch {
      try {
        topSnap = await pendingQ.orderBy("updatedAt", "desc").limit(lim).get();
      } catch {
        topSnap = await pendingQ.limit(lim).get();
      }
    }

    const countPending = await countQuery(pendingQ as any);

    const top = topSnap.docs.map((d) => {
      const data = d.data() as any;
      const reporterUid = data.reporterUid ?? data.reportedBy ?? null;
      return {
        id: d.id,
        type: data.type ?? data.targetType ?? "report",
        createdAt: toMillis(data.createdAt) ?? data.createdAt ?? null,
        updatedAt: toMillis(data.updatedAt) ?? data.updatedAt ?? null,
        targetType: data.targetType ?? null,
        targetId: data.targetId ?? null,
        reason: data.reason ?? null,
        description: data.description ?? null,

        // 호환 필드
        reporterUid,
        reporterEmail: data.reporterEmail ?? null,
        reportedBy: data.reportedBy ?? reporterUid ?? null,
        priorityScore: typeof data.priorityScore === "number" ? data.priorityScore : null,
      };
    });

    return res.status(200).send({ countPending, top });
  } catch (e: any) {
    console.error(e);
    return res.status(500).send({ error: "Failed to fetch reports queue" });
  }
});

// (Report Center)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const status = String(req.query.status || "pending"); // pending|resolved|rejected|all
    const lim = Math.max(1, Math.min(200, Number(req.query.limit || 50)));

    let q: FirebaseFirestore.Query = db.collection("reports");
    if (status !== "all") q = q.where("status", "==", status);

    // ✅ createdAt 없어서 500 나는 케이스 방지: createdAt -> updatedAt -> no orderBy
    let snapshot: FirebaseFirestore.QuerySnapshot;
    try {
      snapshot = await q.orderBy("createdAt", "desc").limit(lim).get();
    } catch {
      try {
        snapshot = await q.orderBy("updatedAt", "desc").limit(lim).get();
      } catch {
        snapshot = await q.limit(lim).get();
      }
    }

    const reports = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).send(reports);
  } catch (error: any) {
    console.error(error);
    return res.status(500).send({ error: "Failed to fetch reports" });
  }
});

const ProcessReportSchema = z.object({
  action: z.enum(["delete", "dismiss", "resolve", "reject"]),
  note: z.string().max(500).optional(),
  resolutionNote: z.string().max(500).optional(),
});

async function resolveReportTargetRefs(report: any): Promise<FirebaseFirestore.DocumentReference[]> {
  const refs: FirebaseFirestore.DocumentReference[] = [];

  // 1) 명시적 path 지원: "spots/<id>"
  const targetPath = typeof report.targetPath === "string" ? report.targetPath.trim() : "";
  if (targetPath.includes("/")) {
    const [col, id] = targetPath.split("/");
    if (col && id) refs.push(db.collection(col).doc(id));
  }

  // 2) targetCollection + targetId
  if (report.targetCollection && report.targetId) {
    refs.push(db.collection(String(report.targetCollection)).doc(String(report.targetId)));
  }

  const t = String(report.targetType || "").toLowerCase();
  const tid = String(report.targetId || report.contentId || report.spotId || report.eventId || "").trim();
  if (!tid) return refs;

  // 3) type 기반 fallback
  if (t.includes("spot")) {
    refs.push(db.collection("spots").doc(tid));
    refs.push(db.collection("adult_spots").doc(tid));
  } else if (t.includes("event")) {
    refs.push(db.collection("events").doc(tid));
    refs.push(db.collection("adult_events").doc(tid));
  } else if (t.includes("review")) {
    refs.push(db.collection("reviews").doc(tid));
  } else if (t.includes("user")) {
    refs.push(db.collection("users").doc(tid));
  }

  return refs;
}

// ✅ (신규) body 기반 처리: POST /admin/reports/process
const ProcessReportBodySchema = z.object({
  reportId: z.string().min(1),
  action: z.enum(["delete", "dismiss", "resolve", "reject"]),
  note: z.string().max(500).optional(),
  resolutionNote: z.string().max(500).optional(),
});

type ProcessAction = "delete" | "dismiss";
function normalizeProcessAction(action: any): ProcessAction {
  const a = String(action || "").toLowerCase();
  if (a === "delete" || a === "resolve") return "delete";
  if (a === "dismiss" || a === "reject") return "dismiss";
  throw new Error("Invalid action");
}

async function runProcessReport(req: express.Request, reportId: string, action: ProcessAction, note?: string) {
  const u = getUserFromReq(req);

  await db.runTransaction(async (t) => {
    const reportRef = db.collection("reports").doc(reportId);
    const reportDoc = await t.get(reportRef);
    if (!reportDoc.exists) throw new Error("Report not found");

    const report = reportDoc.data() || {};
    const now = admin.firestore.FieldValue.serverTimestamp();

    // delete 액션이면 “가능한 범위”에서 target 삭제 시도
    let deletedTarget = false;
    if (action === "delete") {
      const refs = await resolveReportTargetRefs(report);
      for (const r of refs) {
        const targetSnap = await t.get(r);
        if (targetSnap.exists) {
          t.delete(r);
          deletedTarget = true;
          break;
        }
      }
    }

    const finalStatus = action === "delete" ? "resolved" : "rejected";

    t.update(reportRef, {
      status: finalStatus,

      // 운영 추적 필드(신규/권장)
      resolverUid: u?.uid || null,
      resolverEmail: u?.email || null,
      resolutionNote: note || null,

      // 레거시/호환 필드
      adminAction: action,
      adminNote: note || null,
      processedAt: now,
      processedByUid: u?.uid || null,
      processedByEmail: u?.email || null,
      deletedTarget: action === "delete" ? deletedTarget : null,

      updatedAt: now,
    });
  });

  await writeAuditLog(req, "reports.process", { id: reportId, action, note: note || null });
}

router.post("/process", validate(ProcessReportBodySchema), async (req, res) => {
  try {
    const { reportId } = req.body as any;
    const action = normalizeProcessAction((req.body as any).action);
    const note = String((req.body as any).note ?? (req.body as any).resolutionNote ?? "").trim() || undefined;

    await runProcessReport(req, reportId, action, note);
    return res.status(200).send({ ok: true });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.toLowerCase().includes("invalid action")) return res.status(400).send({ error: "Invalid action" });
    if (msg.toLowerCase().includes("not found")) return res.status(404).send({ error: "Report not found" });
    console.error(e);
    return res.status(500).send({ error: "Failed to process report" });
  }
});

// 기존 라우트 유지 (id 기반): POST /admin/reports/:id/process
router.post("/:id/process", validate(ProcessReportSchema), async (req, res) => {
  try {
    const { id } = req.params;

    const action = normalizeProcessAction((req.body as any).action);
    const note = String((req.body as any).note ?? (req.body as any).resolutionNote ?? "").trim() || undefined;

    await runProcessReport(req, id, action, note);
    return res.status(200).send({ ok: true });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.toLowerCase().includes("invalid action")) return res.status(400).send({ error: "Invalid action" });
    if (msg.toLowerCase().includes("not found")) return res.status(404).send({ error: "Report not found" });
    console.error(e);
    return res.status(500).send({ error: "Failed to process report" });
  }
});

export default router;

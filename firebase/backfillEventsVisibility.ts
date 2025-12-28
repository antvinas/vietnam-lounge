// firebase/backfillEventsVisibility.ts
// One-off migration: backfill visibility/status/isPublic for events + adult_events
//
// Run from repo root:
//   npx ts-node firebase/backfillEventsVisibility.ts
//
// Prereq:
// - serviceAccountKey.json exists at repo root (same convention as firebase/seed.ts)

import * as admin from "firebase-admin";
import * as path from "path";

if (!admin.apps.length) {
  // 🔑 루트의 serviceAccountKey.json 사용 (seed.ts와 동일 패턴)
  const serviceAccount = require(path.resolve(__dirname, "../serviceAccountKey.json"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ✅ 마이그레이션 기본값
// - 이미 운영중인 이벤트가 많다면 "public" 추천
// - 혹시 과거에 draft를 같은 컬렉션에 쌓아뒀던 적이 있으면 "private"로 두고 필요한 것만 발행
const DEFAULT_VISIBILITY: "public" | "private" = "public";

function ymdToday() {
  return new Date().toISOString().slice(0, 10);
}

function isYmd(v: any): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

async function backfillCollection(colName: "events" | "adult_events") {
  const col = db.collection(colName);
  const today = ymdToday();

  console.log(`\n[${colName}] start backfill…`);

  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let updated = 0;
  let scanned = 0;

  while (true) {
    let q = col.orderBy(admin.firestore.FieldPath.documentId()).limit(400);
    if (lastDoc) q = q.startAfter(lastDoc.id);

    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    let batchCount = 0;

    for (const docSnap of snap.docs) {
      scanned++;
      const data: any = docSnap.data() || {};

      const hasVisibility = data.visibility != null;
      const hasIsPublic = data.isPublic != null;
      const hasStatus = data.status != null;

      // 이미 세팅되어 있으면 스킵
      if (hasVisibility && hasIsPublic && hasStatus) continue;

      const visRaw = typeof data.visibility === "string" ? data.visibility : null;
      const isPublicRaw = typeof data.isPublic === "boolean" ? data.isPublic : null;

      const visibility =
        visRaw === "public" || visRaw === "private"
          ? visRaw
          : isPublicRaw === false
            ? "private"
            : DEFAULT_VISIBILITY;

      // endDate/date가 과거면 ended로 기본
      const endDateCandidate = data.endDate ?? data.date;
      const endDate = isYmd(endDateCandidate) ? endDateCandidate : null;
      const defaultStatus =
        visibility === "private"
          ? "draft"
          : endDate && endDate < today
            ? "ended"
            : "active";

      const status = typeof data.status === "string" && data.status ? data.status : defaultStatus;
      const isPublic = visibility === "public";

      batch.update(docSnap.ref, {
        visibility,
        isPublic,
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      batchCount++;
      updated++;
    }

    if (batchCount > 0) await batch.commit();

    lastDoc = snap.docs[snap.docs.length - 1];
    console.log(`[${colName}] scanned=${scanned}, updated=${updated}, last=${lastDoc.id}`);
  }

  console.log(`[${colName}] done. scanned=${scanned}, updated=${updated}`);
}

async function main() {
  await backfillCollection("events");
  await backfillCollection("adult_events");
  console.log("\n✅ backfill complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

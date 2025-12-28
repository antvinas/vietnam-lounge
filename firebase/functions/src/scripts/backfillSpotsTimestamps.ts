// firebase/functions/src/scripts/backfillSpotsTimestamps.ts

import * as admin from "firebase-admin";

type Mode = "dry" | "commit";

type BackfillResult = {
  collection: string;
  scanned: number;
  updated: number;
  skipped: number;
  batches: number;
};

function parseArgs(argv: string[]) {
  const args = new Set(argv.slice(2));
  const mode: Mode = args.has("--commit") ? "commit" : "dry";

  const pageSizeRaw = argv.find((x) => x.startsWith("--pageSize="))?.split("=")[1];
  const pageSize = clampInt(pageSizeRaw, 50, 500, 500);

  const onlyRaw = argv.find((x) => x.startsWith("--only="))?.split("=")[1];
  const only = onlyRaw
    ? onlyRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  const verbose = args.has("--verbose");

  return { mode, pageSize, only, verbose };
}

function clampInt(v: any, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function isTimestampLike(v: any) {
  return (
    v instanceof admin.firestore.Timestamp ||
    (v && typeof v === "object" && typeof v.toDate === "function")
  );
}

// ✅ noUnusedLocals 방지용 (실제 동작에는 영향 없음)
void isTimestampLike;

function asTimestamp(
  v: any,
  fallback: admin.firestore.Timestamp
): admin.firestore.Timestamp {
  try {
    if (v instanceof admin.firestore.Timestamp) return v;
    if (v && typeof v.toDate === "function") {
      return admin.firestore.Timestamp.fromDate(v.toDate());
    }
    if (typeof v === "number" && Number.isFinite(v)) {
      // millis 가정
      return admin.firestore.Timestamp.fromMillis(v);
    }
    if (typeof v === "string") {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return admin.firestore.Timestamp.fromDate(d);
    }
  } catch {
    // ignore
  }
  return fallback;
}

function tsOrNow(v: any): admin.firestore.Timestamp {
  const now = admin.firestore.Timestamp.now();
  if (!v) return now;
  return asTimestamp(v, now);
}

function metaTimeOrNow(snap: FirebaseFirestore.QueryDocumentSnapshot) {
  // createTime/updateTime는 admin SDK에서 Timestamp로 제공됨
  return snap.createTime ?? snap.updateTime ?? admin.firestore.Timestamp.now();
}

async function backfillCollection(
  db: FirebaseFirestore.Firestore,
  collectionName: string,
  pageSize: number,
  mode: Mode,
  verbose: boolean
): Promise<BackfillResult> {
  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  let batches = 0;

  let lastDocId: string | null = null;

  while (true) {
    let q = db
      .collection(collectionName)
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(pageSize);

    if (lastDocId) {
      q = q.startAfter(lastDocId);
    }

    const snap = await q.get();
    if (snap.empty) break;

    let batch = db.batch();
    let batchWrites = 0;

    for (const docSnap of snap.docs) {
      scanned += 1;

      const data = docSnap.data() as any;

      const hasCreated = data && data.createdAt != null;
      const hasUpdated = data && data.updatedAt != null;

      if (hasCreated && hasUpdated) {
        skipped += 1;
        continue;
      }

      // 문서 메타 기반으로 최대한 정확하게 채움
      const metaCreated = metaTimeOrNow(docSnap);
      
      const createdAt = hasCreated ? tsOrNow(data.createdAt) : metaCreated;
      const updatedAt = hasUpdated ? tsOrNow(data.updatedAt) : (docSnap.updateTime ?? createdAt);

      const patch: Record<string, any> = {};
      if (!hasCreated) patch.createdAt = createdAt;
      if (!hasUpdated) patch.updatedAt = updatedAt;

      // 값이 timestamp-like가 아닌 경우라도(문자열/숫자) 강제 통일하고 싶으면 아래를 활성화
      // (운영에서 이미 쓰는 중이면 데이터 타입 변경이 부담될 수 있어 기본은 OFF)
      //
      // if (hasCreated && !isTimestampLike(data.createdAt)) patch.createdAt = createdAt;
      // if (hasUpdated && !isTimestampLike(data.updatedAt)) patch.updatedAt = updatedAt;

      if (Object.keys(patch).length === 0) {
        skipped += 1;
        continue;
      }

      updated += 1;

      if (verbose) {
        // eslint-disable-next-line no-console
        console.log(
          `[${collectionName}] patch ${docSnap.id}:`,
          Object.keys(patch).join(", ")
        );
      }

      if (mode === "commit") {
        batch.set(docSnap.ref, patch, { merge: true });
        batchWrites += 1;
      }

      // 배치 write 500 제한
      if (batchWrites >= 450) {
        if (mode === "commit") {
          await batch.commit();
          batches += 1;
        }
        batch = db.batch();
        batchWrites = 0;
      }
    }

    // 남은 배치 커밋
    if (mode === "commit" && batchWrites > 0) {
      await batch.commit();
      batches += 1;
    }

    // 다음 페이지 커서
    lastDocId = snap.docs[snap.docs.length - 1].id;

    // 안전 로그
    // eslint-disable-next-line no-console
    console.log(
      `[${collectionName}] progress: scanned=${scanned}, updated=${updated}, skipped=${skipped}, lastDocId=${lastDocId}`
    );
  }

  return { collection: collectionName, scanned, updated, skipped, batches };
}

async function main() {
  const { mode, pageSize, only, verbose } = parseArgs(process.argv);

  // eslint-disable-next-line no-console
  console.log(
    `\n[backfillSpotsTimestamps] mode=${mode.toUpperCase()} pageSize=${pageSize} only=${only ? only.join(",") : "ALL"}\n`
  );

  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const db = admin.firestore();

  const targets = ["spots", "adult_spots"].filter((c) => {
    if (!only) return true;
    return only.includes(c);
  });

  const results: BackfillResult[] = [];
  for (const c of targets) {
    // eslint-disable-next-line no-console
    console.log(`\n--- Start: ${c} ---`);
    const r = await backfillCollection(db, c, pageSize, mode, verbose);
    results.push(r);
    // eslint-disable-next-line no-console
    console.log(`--- Done: ${c} ---\n`);
  }

  const total = results.reduce(
    (acc, r) => {
      acc.scanned += r.scanned;
      acc.updated += r.updated;
      acc.skipped += r.skipped;
      acc.batches += r.batches;
      return acc;
    },
    { scanned: 0, updated: 0, skipped: 0, batches: 0 }
  );

  // eslint-disable-next-line no-console
  console.log("\n========== SUMMARY ==========");
  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(
      `${r.collection}: scanned=${r.scanned}, updated=${r.updated}, skipped=${r.skipped}, batches=${r.batches}`
    );
  }
  // eslint-disable-next-line no-console
  console.log(
    `TOTAL: scanned=${total.scanned}, updated=${total.updated}, skipped=${total.skipped}, batches=${total.batches}`
  );
  // eslint-disable-next-line no-console
  console.log("================================\n");

  if (mode !== "commit") {
    // eslint-disable-next-line no-console
    console.log(
      "DRY RUN 완료(쓰기 없음). 실제 반영하려면: --commit 옵션을 붙여서 실행하세요."
    );
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[backfillSpotsTimestamps] FAILED:", e);
  process.exitCode = 1;
});

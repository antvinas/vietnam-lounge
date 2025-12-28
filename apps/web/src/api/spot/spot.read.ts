// apps/web/src/api/spot/spot.read.ts
import {
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  DocumentSnapshot,
  QueryConstraint,
} from "firebase/firestore";
import type { Spot } from "@/types/spot";
import type { SpotMode } from "./firestore";
import { snapshotToSpot, spotDocRef, spotsCollectionRef } from "./firestore";

export interface GetSpotsParams {
  category?: string; // 'all' 포함
  region?: string;   // 'all' 포함
  limit?: number;
  lastDoc?: DocumentSnapshot;
  mode?: SpotMode;
}

export interface GetSpotsResult {
  items: Spot[];
  lastDoc: DocumentSnapshot | null;
}

/**
 * 목록 조회 (기존 spotsApi.getSpots 역할)
 */
export async function getSpots(params: GetSpotsParams = {}): Promise<GetSpotsResult> {
  const constraints: QueryConstraint[] = [
    orderBy("createdAt", "desc"),
    limit(params.limit ?? 20),
  ];

  if (params.category && params.category !== "all") {
    constraints.push(where("category", "==", params.category));
  }
  if (params.region && params.region !== "all") {
    constraints.push(where("region", "==", params.region));
  }
  if (params.lastDoc) {
    constraints.push(startAfter(params.lastDoc));
  }

  const q = query(spotsCollectionRef(params.mode), ...constraints);
  const snapshot = await getDocs(q);

  return {
    items: snapshot.docs.map((d) => snapshotToSpot(d, params.mode)),
    lastDoc: snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null,
  };
}

/**
 * 상세 조회 (기존 fetchSpotById 역할)
 * - mode 미지정이면 explorer -> nightlife 순으로 탐색
 */
export async function fetchSpotById(id: string, mode?: SpotMode): Promise<Spot> {
  if (mode) {
    const snap = await getDoc(spotDocRef(mode, id));
    if (!snap.exists()) throw new Error("Spot not found");
    return snapshotToSpot(snap, mode);
  }

  // mode 미지정: explorer 먼저, 없으면 nightlife
  const snap1 = await getDoc(spotDocRef("explorer", id));
  if (snap1.exists()) return snapshotToSpot(snap1, "explorer");

  const snap2 = await getDoc(spotDocRef("nightlife", id));
  if (snap2.exists()) return snapshotToSpot(snap2, "nightlife");

  throw new Error("Spot not found");
}

// apps/web/src/api/spot/sponsor.api.ts
import { getDocs, limit, orderBy, query, where } from "firebase/firestore";
import type { Spot } from "@/types/spot";
import type { SpotMode } from "./firestore";
import { snapshotToSpot, spotsCollectionRef } from "./firestore";

/**
 * 스폰서드 스팟 조회 (fetchSponsoredSpots / getSponsoredSpots)
 * - 단순: isSponsored == true + 최신순
 */
export async function fetchSponsoredSpots(mode?: SpotMode, take: number = 10): Promise<Spot[]> {
  const q = query(
    spotsCollectionRef(mode),
    where("isSponsored", "==", true),
    orderBy("updatedAt", "desc"),
    limit(take)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => snapshotToSpot(d, mode));
}

// 호환 alias
export const getSponsoredSpots = fetchSponsoredSpots;

// apps/web/src/api/spot/spot.search.ts
import { getDocs, limit, orderBy, query } from "firebase/firestore";
import type { Spot } from "@/types/spot";
import type { SpotMode } from "./firestore";
import { snapshotToSpot, spotsCollectionRef } from "./firestore";

export interface SearchSpotsParams {
  mode?: SpotMode;
  text: string;
  limit?: number;
}

/**
 * 텍스트 검색
 * - Firestore는 기본적으로 full-text 검색이 없으니 1차는 "최근 N개 가져와서 클라 필터"로 안전하게 구현
 * - (나중에 Algolia/Meilisearch/Cloud Functions 검색으로 교체 가능)
 */
export async function searchSpotsByText(mode: SpotMode | undefined, text: string): Promise<Spot[]> {
  const q = query(
    spotsCollectionRef(mode),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => snapshotToSpot(d, mode));

  const keyword = text.trim().toLowerCase();
  if (!keyword) return [];

  return all.filter((s) => {
    const name = (s.name ?? "").toLowerCase();
    const desc = (s.description ?? "").toLowerCase();
    const category = (s.category ?? "").toLowerCase();
    const address = (s.address ?? s.location?.address ?? "").toLowerCase();
    return (
      name.includes(keyword) ||
      desc.includes(keyword) ||
      category.includes(keyword) ||
      address.includes(keyword)
    );
  });
}

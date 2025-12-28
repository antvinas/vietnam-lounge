// apps/web/src/api/spot/reviews.api.ts
import { addDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/config/firebase";
import type { SpotReview } from "@/types/spot";
import type { SpotMode } from "./firestore";
import { getCollectionName } from "./firestore";

function reviewsCol(mode: SpotMode | undefined, spotId: string) {
  return collection(db, getCollectionName(mode), spotId, "reviews");
}

/**
 * 리뷰 조회 (fetchSpotReviews)
 */
export async function fetchSpotReviews(spotId: string, mode?: SpotMode): Promise<SpotReview[]> {
  const q = query(reviewsCol(mode, spotId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SpotReview[];
}

/**
 * 리뷰 추가 (addReviewToSpot)
 * - input 형태는 UI가 다양하게 줄 수 있으니 Partial 허용
 */
export async function addReviewToSpot(
  spotId: string,
  review: Omit<SpotReview, "id" | "createdAt"> & Partial<Pick<SpotReview, "createdAt">>,
  mode?: SpotMode
): Promise<void> {
  const payload = {
    ...review,
    createdAt: review.createdAt ?? new Date().toISOString(),
  };
  await addDoc(reviewsCol(mode, spotId), payload);
}

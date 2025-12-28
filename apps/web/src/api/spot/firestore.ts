// apps/web/src/api/spot/firestore.ts
import {
  collection,
  doc,
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import type { Spot, SpotLocation } from "@/types/spot";

export type SpotMode = "explorer" | "nightlife";

export const SPOTS_COLLECTION = "spots";
export const ADULT_SPOTS_COLLECTION = "adult_spots";

/**
 * mode에 따라 Firestore 컬렉션명을 반환
 */
export function getCollectionName(mode: SpotMode | undefined): string {
  return mode === "nightlife" ? ADULT_SPOTS_COLLECTION : SPOTS_COLLECTION;
}

/**
 * SpotLocation 정규화 (canonical)
 * - Firestore에 location이 있으면 우선 사용
 * - 없으면 latitude/longitude/address 기반으로 보정
 */
export function normalizeLocation(data: any): SpotLocation {
  const loc = data?.location;
  const lat = Number(loc?.lat ?? data?.latitude ?? 0);
  const lng = Number(loc?.lng ?? data?.longitude ?? 0);
  const address = String(loc?.address ?? data?.address ?? "");
  return { lat, lng, address };
}

/**
 * Firestore 문서 -> Spot 타입으로 정규화
 * - location을 canonical로 고정하고, 레거시 latitude/longitude/address도 함께 채워줌
 */
export function toSpot(id: string, data: any, mode?: SpotMode): Spot {
  const location = normalizeLocation(data);

  return {
    // 먼저 원본을 깔고
    ...(data ?? {}),

    // canonical 필드들을 뒤에서 확정(원본이 덮어쓰지 못하게)
    id,
    name: String(data?.name ?? ""),
    category: String(data?.category ?? "all"),

    // canonical location (중복 키 방지: 1번만)
    location,

    // (레거시/호환)
    address: data?.address ?? location.address,
    latitude: Number(data?.latitude ?? location.lat),
    longitude: Number(data?.longitude ?? location.lng),

    description: data?.description,
    summary: data?.summary,
    region: data?.region,

    // 이미지 호환
    imageUrl: data?.imageUrl ?? data?.image ?? data?.thumbnailUrl,
    imageUrls:
      data?.imageUrls ??
      data?.images ??
      (data?.imageUrl ? [data.imageUrl] : undefined),

    // 스폰서/모드
    mode: (data?.mode as SpotMode) ?? mode,
    isSponsored: Boolean(data?.isSponsored),
    sponsorLevel: data?.sponsorLevel,
    sponsorExpiry: data?.sponsorExpiry,

    // 시간
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
  } as Spot;
}

export function spotsCollectionRef(mode?: SpotMode) {
  return collection(db, getCollectionName(mode));
}

export function spotDocRef(mode: SpotMode | undefined, id: string) {
  return doc(db, getCollectionName(mode), id);
}

/**
 * 스냅샷 -> Spot
 */
export function snapshotToSpot(
  snap: DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>,
  mode?: SpotMode
): Spot {
  const data = snap.data();
  return toSpot(snap.id, data, mode);
}

// apps/web/src/api/spot/spot.write.ts
import { addDoc, updateDoc } from "firebase/firestore";
import type { Spot, SpotLocation } from "@/types/spot";
import type { SpotMode } from "./firestore";
import { spotsCollectionRef, spotDocRef, normalizeLocation } from "./firestore";

export type UpsertSpotInput = Partial<Spot> & {
  name: string;
  category: string;
  mode?: SpotMode;
  // 레거시 입력도 허용
  latitude?: number;
  longitude?: number;
  address?: string;
  location?: Partial<SpotLocation>;
};

/**
 * 등록 (기존 addSpot 역할)
 * - createdAt/updatedAt는 ISO string으로 통일
 * - location을 canonical로 저장
 */
export async function addSpot(data: UpsertSpotInput): Promise<void> {
  const mode = data.mode ?? "explorer";
  const location = normalizeLocation(data);

  const payload: Record<string, any> = {
    ...data,
    mode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    location,
    // 레거시도 같이 맞춰줌
    latitude: Number(data.latitude ?? location.lat),
    longitude: Number(data.longitude ?? location.lng),
    address: data.address ?? location.address,
  };

  await addDoc(spotsCollectionRef(mode), payload);
}

/**
 * 수정 (기존 updateSpot 역할)
 */
export async function updateSpot(id: string, data: UpsertSpotInput): Promise<void> {
  const mode = data.mode ?? "explorer";
  const location = normalizeLocation(data);

  const payload: Record<string, any> = {
    ...data,
    mode,
    updatedAt: new Date().toISOString(),
    location,
    latitude: Number(data.latitude ?? location.lat),
    longitude: Number(data.longitude ?? location.lng),
    address: data.address ?? location.address,
  };

  await updateDoc(spotDocRef(mode, id), payload);
}

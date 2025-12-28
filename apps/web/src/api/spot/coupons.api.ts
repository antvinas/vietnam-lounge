// apps/web/src/api/spot/coupons.api.ts
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import type { SpotMode } from "./firestore";
import { getCollectionName } from "./firestore";

/**
 * SpotCoupon.tsx가 기대하는 형태를 우선 만족시키기 위해 유연 타입으로 반환
 * (장기적으로는 src/types/spot.ts의 Coupon 타입으로 정규화 추천)
 */
export interface SpotCouponItem {
  id: string;
  title: string;
  description: string;
  discount?: string;
  validUntil?: string;
  // 확장 필드들
  discountRate?: number;
  discountAmount?: number;
  discountType?: "percentage" | "fixed";
  code?: string;
  redeemedAt?: string;
  isRedeemed?: boolean;
}

function couponsCol(mode: SpotMode | undefined, spotId: string) {
  return collection(db, getCollectionName(mode), spotId, "coupons");
}

function couponDoc(mode: SpotMode | undefined, spotId: string, couponId: string) {
  return doc(db, getCollectionName(mode), spotId, "coupons", couponId);
}

export async function fetchCoupons(spotId: string, mode?: SpotMode): Promise<SpotCouponItem[]> {
  const snap = await getDocs(couponsCol(mode, spotId));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SpotCouponItem[];
}

/**
 * 쿠폰 사용 처리 (redeemCoupon)
 * - 최소 구현: 쿠폰 문서에 redeemedAt/isRedeemed 기록
 */
export async function redeemCoupon(spotId: string, couponId: string, mode?: SpotMode): Promise<void> {
  await updateDoc(couponDoc(mode, spotId, couponId), {
    isRedeemed: true,
    redeemedAt: new Date().toISOString(),
  });
}

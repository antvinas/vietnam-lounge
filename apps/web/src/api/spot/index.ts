// apps/web/src/api/spot/index.ts
export type { SpotMode } from "./firestore";

// read
export type { GetSpotsParams, GetSpotsResult } from "./spot.read";
export { getSpots, fetchSpotById } from "./spot.read";

// write
export type { UpsertSpotInput } from "./spot.write";
export { addSpot, updateSpot } from "./spot.write";

// search
export { searchSpotsByText } from "./spot.search";

// reviews
export { fetchSpotReviews, addReviewToSpot } from "./reviews.api";

// coupons
export type { SpotCouponItem } from "./coupons.api";
export { fetchCoupons, redeemCoupon } from "./coupons.api";

// sponsor
export { fetchSponsoredSpots, getSponsoredSpots } from "./sponsor.api";

// types (필요하면 외부에서 같이 쓰라고 re-export)
export type { Spot, SpotLocation, SpotReview, Coupon } from "@/types/spot";

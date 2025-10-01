import { api } from "@/lib/api";
import type { Spot, Review, SpotCoupon } from "@/types/spot";

//
// 🟢 Spot 관련 API
//

// 기본 Spot 리스트 가져오기 (Explorer / Nightlife 분기 + 필터)
export const fetchSpots = async (
  mode: "explorer" | "nightlife" = "explorer",
  filters?: { region?: string; category?: string }
): Promise<Spot[]> => {
  const endpoint = mode === "nightlife" ? "/spots/adult" : "/spots";
  const response = await api.get(endpoint, {
    params: {
      ...(filters?.region && filters.region !== "all"
        ? { region: filters.region }
        : {}),
      ...(filters?.category && filters.category !== "all"
        ? { category: filters.category }
        : {}),
    },
  });
  return response.data;
};

// 추천 Spot 가져오기
export const fetchFeaturedSpots = async (): Promise<Spot[]> => {
  const response = await api.get("/spots/featured");
  return response.data;
};

// Spot 상세 정보
export const getSpotById = async (id: string): Promise<Spot> => {
  const response = await api.get(`/spots/detail`, { params: { id } });
  return response.data;
};

// Spot 추천
export const getRecommendations = async (spotId: string): Promise<Spot[]> => {
  const response = await api.get(`/spots/recommendations`, {
    params: { spotId },
  });
  return response.data;
};

//
// 🟢 리뷰 관련 API
//
export const addReviewToSpot = async (
  spotId: string,
  review: Partial<Review>
): Promise<Review> => {
  const response = await api.post(`/spots/review`, { spotId, review });
  return response.data;
};

export const uploadReviewPhoto = async (
  spotId: string,
  file: File
): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("spotId", spotId);
  formData.append("file", file);

  const response = await api.post(`/spots/review/photo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const fetchReviewsBySpotId = async (
  spotId: string
): Promise<Review[]> => {
  const response = await api.get(`/spots/reviews`, { params: { spotId } });
  return response.data;
};

//
// 🟢 즐겨찾기
//
export const toggleFavoriteStatus = async ({
  spotId,
}: {
  spotId: string;
}): Promise<{ isFavorite: boolean }> => {
  const response = await api.post("/spots/favorite", { spotId });
  return response.data;
};

//
// 🟢 스팟 추가/운영자용
//
export const addSpot = async (spot: Omit<Spot, "id">): Promise<Spot> => {
  const response = await api.post("/spots", spot);
  return response.data;
};

//
// 🟢 쿠폰 관련
//
export const fetchCoupons = async (spotId: string): Promise<SpotCoupon[]> => {
  const response = await api.get(`/spots/coupons`, { params: { spotId } });
  return response.data;
};

export const redeemCoupon = async (
  spotId: string,
  couponId: string
): Promise<{ success: boolean; coupon: SpotCoupon }> => {
  const response = await api.post(`/spots/coupons/redeem`, {
    spotId,
    couponId,
  });
  return response.data;
};

//
// 🟢 주변 탐색 / 필터
//
export const fetchNearbySpots = async (
  lat: number,
  lng: number,
  radiusKm: number = 3
): Promise<Spot[]> => {
  const response = await api.get(`/spots/nearby`, {
    params: { lat, lng, radiusKm },
  });
  return response.data;
};

export const fetchOpenNowSpots = async (): Promise<Spot[]> => {
  const response = await api.get(`/spots/open-now`);
  return response.data;
};

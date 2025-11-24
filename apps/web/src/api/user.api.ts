// src/api/user.api.ts
import { api } from "@/lib/api";

export interface UserProfile {
  userId: string;
  nickname: string;
  email: string;
  bio: string;
  avatarUrl: string;
}

export interface ProfileUpdateData {
  nickname?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface Coupon {
  id: string;
  name: string;
  description: string;
  discount: string;
  expiryDate: string;
}

export interface FavoriteSpot {
  id: string;
  name: string;
  address?: string;
  timestamp?: string;
}

export const getUserProfile = async (): Promise<UserProfile> => {
  const res = await api.get("/user/profile");
  return res.data;
};

export const updateUserProfile = async (data: ProfileUpdateData): Promise<UserProfile> => {
  const res = await api.put("/user/profile", data);
  return res.data;
};

export const getMyCoupons = async (): Promise<Coupon[]> => {
  const res = await api.get("/user/coupons");
  return res.data;
};

/** 커뮤니티 제거: 북마크 포스트 API 대신 즐겨찾은 스팟 API 사용 */
export const getMyFavorites = async (): Promise<FavoriteSpot[]> => {
  const res = await api.get("/user/favorites");
  return res.data ?? [];
};

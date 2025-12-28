// apps/web/src/types/spot.ts

import type { BudgetUnit, PriceLevel, SpotMode } from "@/constants/filters";
import { getSpotThumbnailUrl as getSpotThumbnailUrlFromFilters } from "@/constants/filters";

export type FirestoreLikeTimestamp =
  | string
  | number
  | Date
  | { seconds: number; nanoseconds?: number }
  | null
  | undefined;

export interface SpotLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface Coupon {
  id: string;
  title: string;
  description: string;
  discountRate?: number;
  discountAmount?: number;
  discountType?: "percentage" | "fixed";
  code?: string;
  expiresAt?: string;
  validUntil?: string;
  isActive?: boolean;
}

export interface SpotReview {
  id: string;
  spotId: string;
  userId: string;

  // 화면/기존 코드 호환용
  userName?: string;
  userAvatar?: string;
  nickname?: string;
  displayName?: string;

  rating: number;

  // content/comment 혼용 방지(둘 다 허용)
  content: string;
  comment?: string;

  createdAt: FirestoreLikeTimestamp;

  images?: string[];
  likes?: number;
}

export interface SpotMenuItem {
  name: string;
  price: string;
  description?: string;
  image?: string;
}

export interface SpotOpeningHours {
  day: string;
  open: string;
  close: string;
}

export interface SpotSocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
}

export type SpotImage = string | { url: string; caption?: string };

export interface Spot {
  id: string;

  name: string;
  description?: string;
  summary?: string;

  /** ✅ 저장값: filters.ts SPOT_CATEGORIES의 라벨(한국어) */
  category: string;

  // ✅ location / latitude/longitude 혼용 대응 (실데이터 누락 가능성 때문에 optional)
  location?: SpotLocation;
  address?: string;

  /** ✅ 사용자/관리자 공통 locationId (filters.ts POPULAR_LOCATIONS의 id) */
  locationId?: string;

  /** ✅ 과거 데이터: 북/중/남 region 코드 또는 locationId가 region에 들어간 경우 대응 */
  region?: string;

  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  coordinates?: { lat: number; lng: number };

  /**
   * ✅ Admin 폼(객체 배열) + 기존 UI(string 배열) 둘 다 받기
   * - 실데이터 누락 가능성 때문에 optional
   */
  images?: SpotImage[];
  imageUrls?: string[]; // 일부 컴포넌트가 기대하는 alias
  imageUrl?: string;
  heroImage?: string;

  /** ✅ 리스트 표준 썸네일(있으면) */
  thumbnailUrl?: string;

  menuImages?: string[];

  /** ✅ rating은 없을 수 있음(신규 등록/리뷰 0) */
  rating?: number;
  reviewCount?: number;

  /**
   * ✅ priceLevel: 필터 전용 등급 (0~4)
   * - "금액" 입력이 아님
   */
  priceLevel?: PriceLevel;

  /**
   * ✅ 표시용 예산(실제 금액 정보)
   * - 유저 화면에서 우선 노출
   */
  budget?: number;
  budgetUnit?: BudgetUnit;
  budgetText?: string;

  // 기존 UI 호환 필드(있으면 유지)
  priceRange?: string;
  averageSpend?: string | number;

  tags?: string[];
  amenities?: string[];

  phone?: string;
  website?: string;
  bookingUrl?: string;
  socialLinks?: SpotSocialLinks;
  contact?: { phone?: string; website?: string };

  openingHours?: string[] | SpotOpeningHours[] | Record<string, any>;
  openHours?: string[];
  operatingHours?: string;
  isOpenNow?: boolean;

  menuItems?: SpotMenuItem[];
  menus?: SpotMenuItem[];
  menu?: SpotMenuItem[];

  coupons?: Coupon[];
  hasCoupon?: boolean;
  coupon?: Coupon;

  mode?: SpotMode;
  isSponsored?: boolean;
  sponsorLevel?: string;
  sponsorExpiry?: string;

  createdAt?: FirestoreLikeTimestamp;
  updatedAt?: FirestoreLikeTimestamp;

  [key: string]: any;
}

/**
 * ✅ 대표이미지 추출 규칙(단일 규칙)
 * - 사용자/관리자/카드/리스트가 모두 이 함수만 쓰면 "썸네일 안 뜸" 재발이 줄어듦
 */
export const getSpotThumbnailUrl = getSpotThumbnailUrlFromFilters;

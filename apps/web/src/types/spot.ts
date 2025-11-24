export type SpotRegion =
  | "north" | "central" | "south"
  | "hanoi" | "ninhbinh" | "halong" | "haiphong"
  | "danang" | "hoian" | "dalat" | "hochiminh" | "phuquoc"
  | string;

export type SpotCategory =
  | "hotel" | "restaurant" | "cafe" | "nightlife" | "spa" | "culture" | "shopping" | "activity"
  | string;

export interface SpotCoupon {
  title: string;
  description?: string;
  expiresAt?: string;
  remaining?: number;
  terms?: string;
  ctaLabel?: string;
  discountRate?: number;
}

export interface SpotMenuItem {
  name: string;
  price?: string;
  description?: string;
  category?: string;
}

export interface SpotService {
  name: string;
  duration?: string;
  price?: string;
  description?: string;
}

export type OpeningHours =
  | { [weekday in "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"]?: { open: string; close: string } | "closed" }
  | Array<{ day: string; open?: string; close?: string; closed?: boolean }>;

/** Spot */
export interface Spot {
  id: string;
  name: string;

  // 설명/카테고리/지역
  description?: string;
  category?: SpotCategory;
  region?: SpotRegion;
  city?: string;
  district?: string;
  address?: string;

  // 연락/웹/예약
  phone?: string;
  website?: string;
  bookingUrl?: string;

  // 가격/편의
  priceRange?: string | { min?: number; max?: number; currency?: string };
  averageSpend?: string;
  amenities?: string[];

  // 운영시간
  openingHours?: OpeningHours;      // 권장
  operatingHours?: string;          // 구형 호환

  // 이미지
  heroImage?: string;
  images?: string[];                // 권장
  imageUrl?: string;                // 구형 호환
  imageUrls?: string[];             // 구형 호환

  // 평판
  rating?: number;
  reviewCount?: number;
  viewCount?: number;
  likeCount?: number;
  isOpenNow?: boolean;

  // 쿠폰/서비스
  hasCoupon?: boolean;
  coupon?: SpotCoupon | null;
  couponUrl?: string;
  menu?: SpotMenuItem[];
  services?: SpotService[];

  // 위치
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  mapUrl?: string;

  // 즐겨찾기/광고
  isFavorited?: boolean;
  isSponsored?: boolean;
  sponsorLevel?: "banner" | "slider" | "infeed";
  sponsorUntil?: string | number | null;
  sponsorLabel?: string;
}

/** 리뷰 타입(컴포넌트/백엔드 혼용 호환) */
export interface SpotReview {
  id?: string;
  spotId?: string;
  userId?: string;
  displayName?: string;
  nickname?: string;
  rating: number;
  content?: string;   // 신형
  comment?: string;   // 구형
  createdAt?: any;
  photos?: string[];
  keywords?: string[];
  isVerified?: boolean;
  isAnonymous?: boolean;
  likes?: number;
  reports?: number;
  ownerResponse?: {
    author: string;
    timestamp: string;
    comment: string;
  };
}

export type SpotRegion =
  | "north" | "central" | "south"
  | "hanoi" | "ninhbinh" | "halong" | "haiphong"
  | "danang" | "hoian" | "dalat" | "hochiminh" | "phuquoc"
  | string; // 시드 데이터(한글) 호환을 위해 string 허용

export type SpotCategory =
  | "hotel" | "restaurant" | "cafe" | "nightlife" | "spa" | "culture" | "shopping" | "activity"
  | string; // 시드 데이터(한글) 호환을 위해 string 허용

export interface SpotCoupon {
  title: string;
  description?: string;
  expiresAt?: string;
  remaining?: number;
  terms?: string;
  ctaLabel?: string;
  discountRate?: number;
}

// 메뉴 아이템 타입 (DB 구조 반영)
export interface SpotMenuItem {
  name: string;
  price: string; // "150,000 VND" 형태의 문자열
  description?: string;
  category?: string;
}

export type OpeningHours =
  | { [weekday in "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"]?: { open: string; close: string } | "closed" }
  | Array<{ day: string; open?: string; close?: string; closed?: boolean }>;

/** Spot Interface (DB 및 UI 통합) */
export interface Spot {
  id: string;
  name: string;

  // 기본 정보
  description?: string;
  category?: SpotCategory;
  region?: SpotRegion;
  city?: string;
  district?: string;
  address?: string;
  tags?: string[]; // ★ 추가됨: 태그 배열

  // 연락/웹/예약
  phone?: string;
  website?: string;
  bookingUrl?: string;

  // 가격/편의
  priceRange?: string; // '$' | '$$' | '$$$' | '$$$$'
  averageSpend?: string;
  
  // 서비스/편의시설 (문자열 배열로 단순화하여 시드 데이터와 매칭)
  services?: string[]; 
  amenities?: string[]; // 구형 호환용

  // 운영시간
  openHours?: string;       // ★ 추가됨: 시드 데이터용 단순 문자열 ("09:00 - 22:00")
  openingHours?: OpeningHours; // 구형 호환용 (구조적 데이터)

  // 이미지
  images: string[];         // ★ 필수: 메인 갤러리
  heroImage?: string;       // 구형 호환용
  imageUrl?: string;        // 구형 호환용

  // 평판/통계
  rating?: number;
  reviewCount?: number;
  viewCount?: number;
  likeCount?: number;
  isOpenNow?: boolean;

  // 메뉴 (시드 데이터 구조 반영)
  menus?: SpotMenuItem[]; 
  menu?: SpotMenuItem[]; // 구형 호환용

  // 위치
  coordinates?: { lat: number; lng: number }; // ★ 추가됨: 시드 데이터용
  latitude?: number;  // 구형 호환용
  longitude?: number; // 구형 호환용
  distanceKm?: number;
  mapUrl?: string;

  // 광고/스폰서 (핵심 비즈니스 로직)
  isSponsored?: boolean;
  sponsorMessage?: string;      // ★ 추가됨: "사장님 공지"
  promotionalImages?: string[]; // ★ 추가됨: 메뉴판/홍보 이미지
  sponsorLevel?: number | "banner" | "slider" | "infeed";
  
  // 사용자 인터랙션 (프론트엔드 전용)
  isFavorited?: boolean;
}

/** 리뷰 타입 */
export interface SpotReview {
  id?: string;
  spotId?: string;
  userId?: string;
  displayName?: string;
  nickname?: string;
  rating: number;
  content?: string;
  createdAt?: any;
  photos?: string[];
  ownerResponse?: {
    author: string;
    timestamp: string;
    comment: string;
  };
}
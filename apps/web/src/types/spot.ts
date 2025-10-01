export type SpotRegion =
  | "north"
  | "central"
  | "south"
  | "hanoi"
  | "ninhbinh"
  | "halong"
  | "haiphong"
  | "danang"
  | "hoian"
  | "dalat"
  | "hochiminh"
  | "phuquoc";

export type SpotCategory =
  | "hotel"
  | "restaurant"
  | "cafe"
  | "nightlife"
  | "spa"
  | "culture"
  | "shopping"
  | "activity";

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

export interface Spot {
  id: string;
  name: string;
  description: string;
  category: SpotCategory | string;
  region: SpotRegion | string;
  city: string;
  district?: string;
  address: string;
  phone?: string;
  website?: string;
  operatingHours: string;
  priceRange?: string;
  averageSpend?: string;
  tags?: string[];
  keywords?: string[];
  heroImage?: string;
  imageUrl: string;
  imageUrls: string[];
  rating: number;
  reviewCount?: number;
  viewCount?: number;
  likeCount?: number;
  isOpenNow?: boolean;
  hasCoupon?: boolean;
  coupon?: SpotCoupon | null;
  amenities?: string[];
  menu?: SpotMenuItem[];
  services?: SpotService[];
  latitude: number;
  longitude: number;
  distanceKm?: number;
  isFavorited?: boolean;
  isSponsored?: boolean;
  bookingUrl?: string;
  couponUrl?: string;
  mapUrl?: string;
}

export interface Review {
  id: string;
  spotId: string;
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  timestamp: string;
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

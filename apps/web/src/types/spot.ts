export interface SpotCoupon {
  title: string;
  description?: string;
  expiresAt?: string;
  remaining?: number;
  terms?: string;
  ctaLabel?: string;
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
  category: string;
  region: string;
  city: string;
  district?: string;
  address: string;
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
  ownerResponse?: {
    author: string;
    timestamp: string;
    comment: string;
  };
}
// src/api/spots.api.ts

import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  limit as fsLimit,
  doc,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  getStorage,
} from "firebase/storage";
import { db } from "@/config/firebase";
import type { Spot, SpotReview } from "@/types/spot";

const storage = getStorage();
const colNameByMode = (mode: "explorer" | "nightlife") =>
  mode === "nightlife" ? "adult_spots" : "spots";

/** 공통 정규화 */
const normalizeSpot = (id: string, data: any): Spot => {
  const images: string[] = Array.isArray(data.images)
    ? data.images
    : Array.isArray(data.imageUrls)
    ? data.imageUrls
    : data.image
    ? [data.image]
    : data.imageUrl
    ? [data.imageUrl]
    : [];

  const heroImage: string | undefined =
    data.heroImage || images[0];

  const lat =
    data.latitude ??
    data.coordinates?.lat ??
    data.location?.lat;
  const lng =
    data.longitude ??
    data.coordinates?.lng ??
    data.location?.lng;

  return {
    id,
    name: data.name || "이름 없음",
    description: data.description ?? data.summary ?? "",
    category: data.category ?? data.categories?.[0],
    city: data.city,
    region: data.region,

    address: data.address,
    phone: data.phone ?? data.contact?.phone,
    website: data.website ?? data.contact?.website,
    bookingUrl: data.bookingUrl,

    priceRange: data.priceRange ?? data.price_range,
    averageSpend: data.averageSpend,
    amenities: Array.isArray(data.amenities)
      ? data.amenities
      : [],

    openingHours: data.openingHours ?? data.hours,
    operatingHours: data.operatingHours, // 호환

    heroImage,
    images,

    rating:
      typeof data.rating === "number"
        ? data.rating
        : undefined,
    reviewCount: data.reviewCount,
    viewCount: data.viewCount,
    likeCount: data.likeCount,
    isOpenNow: data.isOpenNow,

    hasCoupon: data.hasCoupon,
    coupon: data.coupon ?? null,
    couponUrl: data.couponUrl,
    menu: data.menu,
    services: data.services,

    latitude:
      typeof lat === "number" ? lat : undefined,
    longitude:
      typeof lng === "number" ? lng : undefined,
    distanceKm: data.distanceKm,
    mapUrl: data.mapUrl,

    isFavorited: data.isFavorited,
    isSponsored: data.isSponsored,
    sponsorLevel: data.sponsorLevel,
    sponsorUntil: data.sponsorUntil,
    sponsorLabel: data.sponsorLabel,
  };
};

/** 목록 */
export const fetchSpots = async (
  mode: "explorer" | "nightlife" = "explorer",
  filters?: {
    region?: string;
    city?: string;
    category?: string;
  }
): Promise<Spot[]> => {
  const colRef = collection(db, colNameByMode(mode));
  let qRef: any = query(colRef);

  if (filters?.city && filters.city !== "전체") {
    qRef = query(qRef, where("city", "==", filters.city));
  } else if (
    filters?.region &&
    filters.region !== "전체"
  ) {
    qRef = query(
      qRef,
      where("region", "==", filters.region)
    );
  }
  if (
    filters?.category &&
    filters.category !== "전체"
  ) {
    qRef = query(
      qRef,
      where("category", "==", filters.category)
    );
  }

  const snap = await getDocs(qRef);
  return snap.docs.map((d) =>
    normalizeSpot(d.id, d.data())
  );
};

/**
 * 텍스트 검색 — 이름/도시/지역/카테고리/설명을 대상으로
 * 간단한 포함 검색 (클라단 필터링 방식)
 */
export const searchSpotsByText = async (
  mode: "explorer" | "nightlife" = "explorer",
  queryText: string,
  filters?: {
    region?: string;
    city?: string;
    category?: string;
  }
): Promise<Spot[]> => {
  const q = queryText.trim().toLowerCase();
  if (!q) return [];

  // 1차: region/city/category 기준으로 Firestore에서 필터된 목록을 가져오고
  const base = await fetchSpots(mode, filters);
  // 2차: 클라이언트에서 텍스트 포함 검색
  return base.filter((spot) => {
    const fields = [
      spot.name,
      spot.city,
      spot.region,
      spot.category,
      spot.description,
      spot.address,
    ];
    return fields.some(
      (f) => f && f.toLowerCase().includes(q)
    );
  });
};

/** 단건 */
export const fetchSpotById = async (
  mode: "explorer" | "nightlife" = "explorer",
  id: string
): Promise<Spot | null> => {
  if (!id) return null;
  const snap = await getDoc(
    doc(db, colNameByMode(mode), id)
  );
  if (!snap.exists()) return null;
  return normalizeSpot(snap.id, snap.data());
};

/** 스폰서 */
export const fetchSponsoredSpots = async (
  mode: "explorer" | "nightlife" = "explorer",
  limitCount = 10
): Promise<Spot[]> => {
  const qRef = query(
    collection(db, colNameByMode(mode)),
    where("isSponsored", "==", true),
    orderBy("sponsorLevel", "desc"),
    fsLimit(limitCount)
  );
  const snap = await getDocs(qRef);
  return snap.docs.map((d) =>
    normalizeSpot(d.id, d.data())
  );
};

/** 추가 */
export const addSpot = async (
  spot: Spot,
  imageFiles?: File[],
  mode: "explorer" | "nightlife" = "explorer"
): Promise<{ id: string }> => {
  let imageUrls: string[] = [];

  if (imageFiles?.length) {
    for (const file of imageFiles) {
      const fileRef = ref(
        storage,
        `spots/${Date.now()}_${file.name}`
      );
      const shot = await uploadBytes(
        fileRef,
        file
      );
      const url = await getDownloadURL(shot.ref);
      imageUrls.push(url);
    }
  }

  const docRef = await addDoc(
    collection(db, colNameByMode(mode)),
    {
      ...spot,
      images: imageUrls.length
        ? imageUrls
        : spot.images ?? [],
      heroImage:
        spot.heroImage ??
        imageUrls[0] ??
        spot.images?.[0] ??
        spot.imageUrl,
      createdAt: serverTimestamp(),
    }
  );

  return { id: docRef.id };
};

/** 수정 */
export const updateSpot = async (
  id: string,
  updates: Partial<Spot>,
  mode: "explorer" | "nightlife" = "explorer"
) => {
  const docRef = doc(
    db,
    colNameByMode(mode),
    id
  );
  await updateDoc(docRef, updates as any);
};

/** 삭제 */
export const deleteSpot = async (
  id: string,
  mode: "explorer" | "nightlife" = "explorer"
) => {
  await deleteDoc(
    doc(db, colNameByMode(mode), id)
  );
};

/** 카테고리 */
export const getSpotCategories = async (): Promise<
  string[]
> => {
  const snap = await getDocs(
    collection(db, "spots")
  );
  const set = new Set<string>();
  snap.forEach((d) => {
    const data = d.data();
    if (data.category) set.add(data.category);
    if (Array.isArray(data.categories))
      data.categories.forEach((c: string) =>
        set.add(c)
      );
  });
  return Array.from(set);
};

/* -------------------- 리뷰 -------------------- */
export const addReviewToSpot = async (
  mode: "explorer" | "nightlife",
  spotId: string,
  review: Omit<SpotReview, "createdAt" | "id">
) => {
  const reviewsCol = collection(
    db,
    colNameByMode(mode),
    spotId,
    "reviews"
  );
  await addDoc(reviewsCol, {
    ...review,
    createdAt: serverTimestamp(),
  });
};

export const fetchSpotReviews = async (
  mode: "explorer" | "nightlife",
  spotId: string,
  limitCount = 20
): Promise<SpotReview[]> => {
  const qRef = query(
    collection(
      db,
      colNameByMode(mode),
      spotId,
      "reviews"
    ),
    orderBy("createdAt", "desc"),
    fsLimit(limitCount)
  );
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      rating: data.rating,
      content: data.content ?? data.comment,
      createdAt: data.createdAt,
      photos: data.photos,
      nickname:
        data.nickname ?? data.displayName,
      userId: data.userId,
    } as SpotReview;
  });
};

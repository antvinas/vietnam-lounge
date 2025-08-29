// src/lib/spots.ts
import {
    collection, getDocs, getCountFromServer, limit, orderBy, query,
    startAfter, where, QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PriceLevel = 1 | 2 | 3 | 4;

export type Spot = {
    id: string;
    name: string;
    city?: string;
    cityId?: string;
    districtId?: string;
    categories: string[];
    tags?: string[];
    rating?: number;
    reviewsCount?: number;
    priceLevel?: PriceLevel;
    isAdult?: boolean;
    openNow?: boolean;
    closingTimeText?: string; // "22:00 마감" 등
    coverImage?: string;
    images?: string[];
    location?: { lat: number; lng: number };
    updatedAt?: number;

    // 프론트 계산용
    distanceKm?: number;
};

export type Near = { lat: number; lng: number; radiusKm: number };

export type SpotFilter = {
    q?: string;
    regionId?: string;
    cityIds?: string[];
    districtIds?: string[];
    category?: string;
    isAdult: boolean;
    openNow?: boolean;
    minRating?: number;
    price?: PriceLevel[];
    sort?: "popular" | "rating" | "reviews" | "priceLow" | "priceHigh" | "recent" | "distance";
    near?: Near; // 내 주변
};

const PAGE_SIZE = 24;

function buildConstraints(f: SpotFilter): QueryConstraint[] {
    const cons: QueryConstraint[] = [];
    cons.push(where("isAdult", "==", !!f.isAdult));

    if (f.districtIds?.length) {
        cons.push(where("districtId", "in", f.districtIds.slice(0, 10)));
    } else if (f.cityIds?.length) {
        cons.push(where("cityId", "in", f.cityIds.slice(0, 10)));
    }
    if (f.category && f.category !== "all") cons.push(where("categories", "array-contains", f.category));
    if (typeof f.openNow === "boolean") cons.push(where("openNow", "==", f.openNow));
    if (typeof f.minRating === "number") cons.push(where("rating", ">=", f.minRating));
    if (f.price && f.price.length) cons.push(where("priceLevel", "in", f.price));
    return cons;
}

function buildOrdering(f: SpotFilter): QueryConstraint[] {
    // Firestore는 distance 정렬이 불가 → 프론트에서 정렬
    switch (f.sort) {
        case "rating": return [orderBy("rating", "desc")];
        case "reviews": return [orderBy("reviewsCount", "desc")];
        case "priceLow": return [orderBy("priceLevel", "asc")];
        case "priceHigh": return [orderBy("priceLevel", "desc")];
        case "recent": return [orderBy("updatedAt", "desc")];
        default: return [orderBy("reviewsCount", "desc"), orderBy("rating", "desc")];
    }
}

export async function fetchSpots(filters: SpotFilter, cursor?: any) {
    const base = query(
        collection(db, "places"),
        ...buildConstraints(filters),
        ...buildOrdering(filters),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(PAGE_SIZE)
    );

    const snap = await getDocs(base);
    const items: Spot[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
    return { items, nextCursor };
}

export async function countSpots(filters: SpotFilter) {
    const q = query(collection(db, "places"), ...buildConstraints(filters));
    const c = await getCountFromServer(q);
    return c.data().count;
}

// 거리 계산(Haversine)
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const R = 6371; // km
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(x));
}

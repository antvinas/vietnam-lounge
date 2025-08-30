// src/lib/api.ts
import { db, auth } from "@/lib/firebase";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    where,
    serverTimestamp,
    Timestamp,
    limit as qLimit,
} from "firebase/firestore";
import type {
    AddReviewInput,
    GetPlacesParams,
    GetReviewsParams,
    Place,
    PlaceScore,
    Review,
} from "@/types";

/** ---------- utils ---------- */

function tsToDisplayString(v: any): string {
    try {
        const d =
            v instanceof Date
                ? v
                : v?.toDate
                    ? (v as Timestamp).toDate()
                    : typeof v === "number"
                        ? new Date(v)
                        : typeof v === "string"
                            ? new Date(v)
                            : new Date();
        // 한국어 표시 (프로젝트 톤에 맞춤)
        return d.toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return new Date().toLocaleString("ko-KR");
    }
}

function ensureScore(score?: Partial<PlaceScore>): PlaceScore {
    return {
        clean: Number(score?.clean ?? 0),
        price: Number(score?.price ?? 0),
        kindness: Number(score?.kindness ?? 0),
        ambiance: Number(score?.ambiance ?? 0),
        commute: Number(score?.commute ?? 0),
    };
}

function scoreAvg(s: PlaceScore) {
    return (
        (Number(s.clean) +
            Number(s.price) +
            Number(s.kindness) +
            Number(s.ambiance) +
            Number(s.commute)) / 5
    );
}

function normalizePlace(id: string, data: any): Place {
    const score = ensureScore(data?.score);
    return {
        id,
        name: String(data?.name ?? "Unknown"),
        city: String(data?.city ?? ""),
        category: String(data?.category ?? ""),
        cover: data?.cover || undefined,
        verified: Boolean(data?.verified ?? false),
        tags: Array.isArray(data?.tags) ? (data.tags as string[]) : [],
        score,
        scoreAvg: typeof data?.scoreAvg === "number" ? data.scoreAvg : scoreAvg(score),
        createdAt: tsToDisplayString(data?.createdAt),
    };
}

function normalizeReview(id: string, data: any): Review {
    return {
        id,
        placeId: String(data?.placeId ?? ""),
        user: String(data?.user ?? "@guest"),
        userId: data?.userId ? String(data.userId) : undefined,
        rating: Number(data?.rating ?? 0),
        text: String(data?.text ?? ""),
        createdAt: tsToDisplayString(data?.createdAt),
    };
}

/** ---------- places ---------- */

export async function getPlaces(params: GetPlacesParams = {}): Promise<Place[]> {
    const { q = "", city = "", category = "", limit = 30, sort = "topSafety" } = params;

    try {
        let qRef = collection(db, "places");
        const clauses: any[] = [];

        if (city) clauses.push(where("city", "==", city));
        if (category) clauses.push(where("category", "==", category));

        // 정렬: "new"는 createdAt desc, "topSafety"는 scoreAvg desc(없으면 클라 계산)
        if (sort === "new") {
            clauses.push(orderBy("createdAt", "desc"));
        }

        const finalQuery = clauses.length ? query(qRef, ...clauses, qLimit(100)) : query(qRef, qLimit(100));
        const snap = await getDocs(finalQuery);
        let items = snap.docs.map((d) => normalizePlace(d.id, d.data()));

        // 텍스트 검색(q): Firestore에서 부분일치 검색은 제한 → 클라이언트 후처리
        if (q) {
            const term = q.trim().toLowerCase();
            items = items.filter(
                (p) =>
                    p.name.toLowerCase().includes(term) ||
                    p.city.toLowerCase().includes(term) ||
                    p.category.toLowerCase().includes(term) ||
                    p.tags.some((t) => t.toLowerCase().includes(term))
            );
        }

        if (sort === "topSafety") {
            items.sort((a, b) => (b.scoreAvg ?? 0) - (a.scoreAvg ?? 0));
        }

        return items.slice(0, limit);
    } catch (e) {
        console.error("[getPlaces] error", e);
        return [];
    }
}

export async function getPlace(id: string): Promise<Place | null> {
    try {
        const ref = doc(db, "places", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return normalizePlace(snap.id, snap.data());
    } catch (e) {
        console.error("[getPlace] error", e);
        return null;
    }
}

/** ---------- reviews ---------- */

export async function getReviewsForPlace(placeId: string, opt: GetReviewsParams = {}): Promise<Review[]> {
    const { limit = 50, sort = "new" } = opt;
    try {
        const clauses: any[] = [where("placeId", "==", placeId)];
        if (sort === "new") clauses.push(orderBy("createdAt", "desc"));
        if (sort === "old") clauses.push(orderBy("createdAt", "asc"));

        const snap = await getDocs(query(collection(db, "reviews"), ...clauses, qLimit(limit)));
        return snap.docs.map((d) => normalizeReview(d.id, d.data()));
    } catch (e) {
        console.error("[getReviewsForPlace] error", e);
        return [];
    }
}

export async function getMyReviews(userId: string, opt: GetReviewsParams = {}): Promise<Review[]> {
    const { limit = 50, sort = "new" } = opt;
    try {
        const clauses: any[] = [where("userId", "==", userId)];
        if (sort === "new") clauses.push(orderBy("createdAt", "desc"));
        if (sort === "old") clauses.push(orderBy("createdAt", "asc"));

        const snap = await getDocs(query(collection(db, "reviews"), ...clauses, qLimit(limit)));
        return snap.docs.map((d) => normalizeReview(d.id, d.data()));
    } catch (e) {
        console.error("[getMyReviews] error", e);
        return [];
    }
}

export async function addReview(input: AddReviewInput): Promise<void> {
    const { placeId, user, rating, text } = input;
    try {
        const uid = auth.currentUser?.uid || null;
        await addDoc(collection(db, "reviews"), {
            placeId,
            user,
            userId: uid,
            rating,
            text,
            createdAt: serverTimestamp(),
        });
    } catch (e) {
        console.error("[addReview] error", e);
        throw e;
    }
}

/** ---------- reports ---------- */

export async function reportPlace(placeId: string, reason: string): Promise<void> {
    try {
        const uid = auth.currentUser?.uid || null;
        await addDoc(collection(db, "reports"), {
            targetType: "place",
            targetId: placeId,
            reason,
            userId: uid,
            status: "pending",
            createdAt: serverTimestamp(),
        });
    } catch (e) {
        console.error("[reportPlace] error", e);
        throw e;
    }
}

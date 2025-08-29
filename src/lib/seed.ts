// src/lib/seed.ts
import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// ============ 사전 시드 ============

const CATEGORY_SEED = [
    { id: "lounge", name: "Lounge", adult: false },
    { id: "bar", name: "Bar", adult: false },
    { id: "club", name: "Club", adult: true },
    { id: "karaoke", name: "Karaoke", adult: true },
    { id: "spa", name: "Spa", adult: false },
    { id: "massage", name: "Massage", adult: true },
];

const CITY_SEED = [
    { id: "hcm", name: "Ho Chi Minh" },
    { id: "hanoi", name: "Hanoi" },
    { id: "danang", name: "Da Nang" },
    { id: "nhatrang", name: "Nha Trang" },
    { id: "dalat", name: "Da Lat" },
    { id: "phuquoc", name: "Phu Quoc" },
];

export async function seedTaxonomies() {
    // categories
    for (const c of CATEGORY_SEED) {
        await setDoc(doc(db, "categories", c.id), {
            name: c.name,
            adult: c.adult,
            createdAt: serverTimestamp(),
        });
    }
    // cities
    for (const c of CITY_SEED) {
        await setDoc(doc(db, "cities", c.id), {
            name: c.name,
            createdAt: serverTimestamp(),
        });
    }
}

// ============ 장소 & 리뷰 샘플 ============

type Score = {
    clean: number;
    price: number;
    kindness: number;
    ambiance: number;
    commute: number;
};

const placesSeed: Array<{
    name: string;
    cityId: string;
    categoryId: string;
    cover: string;
    verified: boolean;
    tags: string[];
    score: Score;
}> = [
        {
            name: "Lounge Saigon Sky",
            cityId: "hcm",
            categoryId: "lounge",
            cover:
                "https://images.unsplash.com/photo-1541417904950-b855846fe074?q=80&w=1600&auto=format&fit=crop",
            verified: true,
            tags: ["비흡연석", "카드결제", "루프탑", "라이브"],
            score: { clean: 4.4, price: 4.0, kindness: 4.6, ambiance: 4.7, commute: 4.1 },
        },
        {
            name: "Hanoi Velvet Bar",
            cityId: "hanoi",
            categoryId: "bar",
            cover:
                "https://images.unsplash.com/photo-1514362545857-3bc16c4c76ea?q=80&w=1600&auto=format&fit=crop",
            verified: false,
            tags: ["카드결제", "재즈", "조용함"],
            score: { clean: 4.1, price: 4.2, kindness: 4.0, ambiance: 4.3, commute: 3.8 },
        },
        {
            name: "Danang Blue Club",
            cityId: "danang",
            categoryId: "club",
            cover:
                "https://images.unsplash.com/photo-1519677100203-a0e668c92439?q=80&w=1600&auto=format&fit=crop",
            verified: true,
            tags: ["EDM", "넓은무대", "새벽영업"],
            score: { clean: 3.9, price: 3.8, kindness: 4.2, ambiance: 4.5, commute: 3.7 },
        },
        {
            name: "Saigon Jazz Lounge",
            cityId: "hcm",
            categoryId: "lounge",
            cover:
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
            verified: false,
            tags: ["재즈", "조용함", "칵테일"],
            score: { clean: 4.5, price: 4.1, kindness: 4.4, ambiance: 4.6, commute: 4.0 },
        },
    ];

function avgScore(s: Score) {
    const v = (s.clean + s.price + s.kindness + s.ambiance + s.commute) / 5;
    return Math.round(v * 100) / 100;
}

export async function seedPlaces() {
    for (const p of placesSeed) {
        await addDoc(collection(db, "places"), {
            name: p.name,
            cityId: p.cityId,
            categoryId: p.categoryId,
            cover: p.cover,
            verified: p.verified,
            tags: p.tags,
            score: p.score,
            scoreAvg: avgScore(p.score),
            createdAt: serverTimestamp(),
        });
    }
}

export async function seedSampleReviews() {
    // 주의: 실제에선 place 문서 ID를 참조해야 함. 여기선 샘플로 아무 한 곳에 몇개만 넣자.
    const samplePlaceId = (await addDoc(collection(db, "places"), {
        name: "Sample Review Place",
        cityId: "hcm",
        categoryId: "lounge",
        cover:
            "https://images.unsplash.com/photo-1521017432531-fbd92d1cf066?q=80&w=1600&auto=format&fit=crop",
        verified: false,
        tags: ["칵테일", "루프탑"],
        score: { clean: 4.2, price: 4.0, kindness: 4.3, ambiance: 4.4, commute: 4.1 },
        scoreAvg: 4.2,
        createdAt: serverTimestamp(),
    })).id;

    const reviews = [
        { user: "@wanderer", rating: 5, text: "뷰 최고, 가격 투명." },
        { user: "@hanriver", rating: 4, text: "재즈 감성 좋아요. 직원 친절." },
    ];

    for (const r of reviews) {
        await addDoc(collection(db, "reviews"), {
            placeId: samplePlaceId,
            user: r.user,
            rating: r.rating,
            text: r.text,
            createdAt: serverTimestamp(),
        });
    }
}

// src/lib/seed.ts
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Place } from "@/types";

const placesSeed: Omit<Place, "id">[] = [
    {
        name: "Lounge Saigon Sky",
        city: "Ho Chi Minh",
        category: "Lounge",
        cover:
            "https://images.unsplash.com/photo-1541417904950-b855846fe074?q=80&w=1600&auto=format&fit=crop",
        verified: true,
        tags: ["비흡연석", "카드결제", "루프탑", "라이브"],
        score: { clean: 4.4, price: 4.0, kindness: 4.6, ambiance: 4.7, commute: 4.1 },
        scoreAvg: 4.36,
        createdAt: new Date().toISOString(),
    },
    {
        name: "Hanoi Velvet Bar",
        city: "Hanoi",
        category: "Bar",
        cover:
            "https://images.unsplash.com/photo-1514362545857-3bc16c4c76ea?q=80&w=1600&auto=format&fit=crop",
        verified: false,
        tags: ["카드결제", "재즈", "조용함"],
        score: { clean: 4.1, price: 4.2, kindness: 4.0, ambiance: 4.3, commute: 3.8 },
        scoreAvg: 4.08,
        createdAt: new Date().toISOString(),
    },
    {
        name: "Danang Blue Club",
        city: "Da Nang",
        category: "Club",
        cover:
            "https://images.unsplash.com/photo-1519677100203-a0e668c92439?q=80&w=1600&auto=format&fit=crop",
        verified: true,
        tags: ["EDM", "넓은무대", "새벽영업"],
        score: { clean: 3.9, price: 3.8, kindness: 4.2, ambiance: 4.5, commute: 3.7 },
        scoreAvg: 4.02,
        createdAt: new Date().toISOString(),
    },
    {
        name: "Saigon Jazz Lounge",
        city: "Ho Chi Minh",
        category: "Lounge",
        cover:
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
        verified: false,
        tags: ["재즈", "조용함", "칵테일"],
        score: { clean: 4.5, price: 4.1, kindness: 4.4, ambiance: 4.6, commute: 4.0 },
        scoreAvg: 4.32,
        createdAt: new Date().toISOString(),
    },
];

export async function seedPlaces() {
    for (const p of placesSeed) {
        await addDoc(collection(db, "places"), {
            ...p,
            createdAt: serverTimestamp(),
        });
    }
}

export async function seedSampleReviews() {
    // 각 place마다 1개 샘플리뷰
    const reviews = [
        {
            placeName: "Lounge Saigon Sky",
            user: "@wanderer",
            rating: 5,
            text: "루프탑 뷰 최고, 가격도 투명해요.",
        },
        {
            placeName: "Hanoi Velvet Bar",
            user: "@hanriver",
            rating: 4,
            text: "잔잔한 재즈 좋아하면 추천. 직원분들 친절합니다.",
        },
    ];

    for (const r of reviews) {
        await addDoc(collection(db, "reviews"), {
            placeId: r.placeName, // 실제 운영에서는 placeId(문서ID)를 참조해야 함
            // 시드 데이터 편의상 이름을 id처럼 넣지만, 실제 사용 전 문서ID로 교체 권장
            user: r.user,
            rating: r.rating,
            text: r.text,
            createdAt: serverTimestamp(),
        });
    }
}

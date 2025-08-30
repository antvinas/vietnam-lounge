// src/types.ts
export type PlaceScore = {
    clean: number;     // 청결
    price: number;     // 가격투명
    kindness: number;  // 응대친절
    ambiance: number;  // 분위기/조도
    commute: number;   // 귀가동선
};

export type Place = {
    id: string;
    name: string;
    city: string;             // "Ho Chi Minh" | "Hanoi" | "Da Nang" | ...
    category: string;         // "Lounge" | "Bar" | "Club" | "Karaoke" | ...
    cover?: string;           // 대표 이미지 URL
    verified?: boolean;       // 배지 여부
    tags: string[];           // ["비흡연석","카드결제",...]
    score: PlaceScore;        // 여성안심 지수
    scoreAvg?: number;        // (옵션) 평균 점수 캐시
    createdAt?: string;       // ISO or locale string
};

export type Review = {
    id: string;
    placeId: string;
    user: string;           // 닉네임
    userId?: string;        // Firebase UID (로그인 시)
    rating: number;         // 1~5
    text: string;
    createdAt: string;      // ISO/locale string
};

export type GetPlacesParams = {
    q?: string;
    city?: string;
    category?: string;
    limit?: number;
    sort?: "topSafety" | "new";
};

export type GetReviewsParams = {
    limit?: number;
    sort?: "new" | "old";
};

export type AddReviewInput = {
    placeId: string;
    user: string;
    rating: number;
    text: string;
};

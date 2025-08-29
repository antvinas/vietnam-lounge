// src/lib/geo.ts
export type RegionId = "north" | "central" | "south";

export type City = {
    id: string;        // slug (영문 소문자/하이픈)
    name: string;      // EN
    ko: string;        // 한글 노출용
    region: RegionId;  // 권역
};

export type District = {
    id: string;
    cityId: string;    // 어느 도시에 속하는지
    name: string;
    ko: string;
};

// --- 권역(3개) ---
export const REGIONS: { id: RegionId; ko: string }[] = [
    { id: "north", ko: "북부" },
    { id: "central", ko: "중부" },
    { id: "south", ko: "남부" },
];

// --- 핵심 지역(도시/여행지) --- (요청 목록 반영)
export const CITIES: City[] = [
    // 북부
    { id: "hanoi", name: "Hanoi", ko: "하노이", region: "north" },
    { id: "halong-bay", name: "Ha Long Bay", ko: "하롱베이", region: "north" },
    { id: "sapa", name: "Sa Pa", ko: "사파", region: "north" },
    { id: "ninh-binh", name: "Ninh Binh", ko: "닌빈", region: "north" },
    { id: "ha-giang", name: "Ha Giang", ko: "하장", region: "north" },
    { id: "cat-ba", name: "Cat Ba Island", ko: "깟바 섬", region: "north" },
    { id: "cao-bang", name: "Cao Bang", ko: "까오방", region: "north" },
    { id: "mu-cang-chai", name: "Mu Cang Chai", ko: "무캉차이", region: "north" },
    { id: "mai-chau", name: "Mai Chau", ko: "마이쩌우", region: "north" },

    // 중부
    { id: "da-nang", name: "Da Nang", ko: "다낭", region: "central" },
    { id: "hoi-an", name: "Hoi An", ko: "호이안", region: "central" },
    { id: "hue", name: "Hue", ko: "후에", region: "central" },
    { id: "nha-trang", name: "Nha Trang", ko: "냐짱", region: "central" },
    { id: "da-lat", name: "Da Lat", ko: "달랏", region: "central" },
    { id: "quang-binh", name: "Quang Binh", ko: "꽝빈", region: "central" },
    { id: "phu-yen", name: "Phu Yen", ko: "푸옌", region: "central" },
    { id: "quy-nhon", name: "Quy Nhon", ko: "꾸이년", region: "central" },
    { id: "ha-tinh", name: "Ha Tinh", ko: "하띤", region: "central" },

    // 남부
    { id: "ho-chi-minh", name: "Ho Chi Minh City", ko: "호찌민", region: "south" },
    { id: "can-tho", name: "Can Tho", ko: "껀터", region: "south" },
    { id: "vung-tau", name: "Vung Tau", ko: "붕따우", region: "south" },
    { id: "phu-quoc", name: "Phu Quoc Island", ko: "푸꾸옥 섬", region: "south" },
    { id: "kien-giang", name: "Kien Giang", ko: "끼엔장", region: "south" },
    { id: "tay-ninh", name: "Tay Ninh", ko: "떠이닌", region: "south" },
    { id: "dong-thap", name: "Dong Thap", ko: "동탑", region: "south" },
    { id: "ca-mau", name: "Ca Mau", ko: "까마우", region: "south" },
];

// --- 세부 구/지역(옵션) ---
export const DISTRICTS: District[] = [
    // 호찌민 대표 구
    { id: "hcmc-q1", cityId: "ho-chi-minh", name: "District 1", ko: "1군" },
    { id: "hcmc-q3", cityId: "ho-chi-minh", name: "District 3", ko: "3군" },
    { id: "hcmc-q7", cityId: "ho-chi-minh", name: "District 7", ko: "7군" },
    { id: "hcmc-binhthanh", cityId: "ho-chi-minh", name: "Binh Thanh", ko: "빈탄" },
    { id: "hcmc-thuduc", cityId: "ho-chi-minh", name: "Thu Duc City", ko: "투득시" },

    // 하노이 대표 구
    { id: "hanoi-hoankiem", cityId: "hanoi", name: "Hoan Kiem", ko: "호안끼엠" },
    { id: "hanoi-badinh", cityId: "hanoi", name: "Ba Dinh", ko: "바딘" },
    { id: "hanoi-tayho", cityId: "hanoi", name: "Tay Ho", ko: "떠이호" },
    { id: "hanoi-caugiay", cityId: "hanoi", name: "Cau Giay", ko: "까우저이" },

    // 다낭 대표 구
    { id: "danang-haichau", cityId: "da-nang", name: "Hai Chau", ko: "하이쩌우" },
    { id: "danang-sontra", cityId: "da-nang", name: "Son Tra", ko: "선짜" },
];

// --- 카테고리(일반/성인) ---
export const GENERAL_CATEGORIES = [
    "맛집", "카페·디저트", "명소·랜드마크", "자연·뷰포인트",
    "액티비티(투어·체험)", "스파·힐링", "쇼핑·마켓",
    "야시장", "루프탑·라이브뮤직", "호텔·숙소",
] as const;

export const ADULT_CATEGORIES = [
    "KTV/가라오케", "나이트클럽", "바·라운지(19+)", "성인 마사지", "성인 이벤트",
] as const;

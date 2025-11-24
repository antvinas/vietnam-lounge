import admin from "firebase-admin";
import { readFileSync } from "fs";

// 서비스 계정 경로
const serviceAccount = JSON.parse(
  readFileSync("serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

interface Spot {
  name: string;
  category: string;
  city: string;
  region: string;
  address: string;
  rating: number;
  images: string[];
  coordinates: { lat: number; lng: number };
  openHours: string;
  description: string;
  tags: string[];
  createdAt: string;
}

const spots: Spot[] = [
  // ------------------------ 호텔 ------------------------
  {
    name: "Lotte Hotel Hanoi",
    category: "호텔",
    city: "하노이",
    region: "북부",
    address: "54 Lieu Giai, Ba Dinh, Hanoi",
    rating: 4.7,
    images: ["https://images.unsplash.com/photo-1551776235-dde6d4829808"],
    coordinates: { lat: 21.033, lng: 105.814 },
    openHours: "24h",
    description: "호안끼엠과 가까운 5성급 럭셔리 호텔. 시티뷰와 인피니티풀로 유명.",
    tags: ["5성급", "시티뷰", "럭셔리"],
    createdAt: new Date().toISOString(),
  },
  {
    name: "Apricot Hotel",
    category: "호텔",
    city: "하노이",
    region: "북부",
    address: "136 Hang Trong, Hoan Kiem",
    rating: 4.5,
    images: ["https://images.unsplash.com/photo-1590490359854-dfba19688b1b"],
    coordinates: { lat: 21.028, lng: 105.852 },
    openHours: "24h",
    description: "호안끼엠 호수 바로 옆에 위치한 예술적인 부티크 호텔.",
    tags: ["호안끼엠", "부티크", "예술적"],
    createdAt: new Date().toISOString(),
  },
  {
    name: "InterContinental Hanoi Westlake",
    category: "호텔",
    city: "하노이",
    region: "북부",
    address: "5 Tu Hoa, Tay Ho",
    rating: 4.6,
    images: ["https://images.unsplash.com/photo-1600047500633-4b4e68e51d37"],
    coordinates: { lat: 21.057, lng: 105.818 },
    openHours: "24h",
    description: "호수 위에 지어진 수상 빌라형 객실이 매력적인 리조트형 호텔.",
    tags: ["수상빌라", "웨스트레이크", "리조트"],
    createdAt: new Date().toISOString(),
  },
  // ------------------------ 레스토랑 ------------------------
  {
    name: "Pizza 4P’s Tràng Tiền",
    category: "레스토랑",
    city: "하노이",
    region: "북부",
    address: "43 Trang Tien, Hoan Kiem",
    rating: 4.8,
    images: ["https://images.unsplash.com/photo-1600891964599-f61ba0e24092"],
    coordinates: { lat: 21.025, lng: 105.853 },
    openHours: "10:00 - 22:00",
    description: "베트남 최고의 화덕피자 전문점. 치즈를 자체 생산.",
    tags: ["피자", "이탈리안", "인기맛집"],
    createdAt: new Date().toISOString(),
  },
  {
    name: "Cau Go Vietnamese Cuisine",
    category: "레스토랑",
    city: "하노이",
    region: "북부",
    address: "7 Dinh Tien Hoang, Hoan Kiem",
    rating: 4.4,
    images: ["https://images.unsplash.com/photo-1606787366850-de6330128bfc"],
    coordinates: { lat: 21.027, lng: 105.853 },
    openHours: "10:00 - 22:30",
    description: "호안끼엠 호수 전망 레스토랑. 전통 베트남 코스요리 제공.",
    tags: ["베트남음식", "전통요리", "호수전망"],
    createdAt: new Date().toISOString(),
  },
  // ------------------------ 카페 ------------------------
  {
    name: "The Note Coffee",
    category: "카페 & 브런치",
    city: "하노이",
    region: "북부",
    address: "64 Luong Van Can, Hoan Kiem",
    rating: 4.5,
    images: ["https://images.unsplash.com/photo-1504754524776-8f4f37790ca0"],
    coordinates: { lat: 21.033, lng: 105.851 },
    openHours: "07:00 - 22:00",
    description: "수천 개의 포스트잇으로 가득한 유명 카페. 관광객 필수 방문지.",
    tags: ["감성카페", "호안끼엠", "인스타명소"],
    createdAt: new Date().toISOString(),
  },
  {
    name: "Maison Marou Hanoi",
    category: "카페 & 브런치",
    city: "하노이",
    region: "북부",
    address: "91A Tho Nhuom, Hoan Kiem",
    rating: 4.6,
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5"],
    coordinates: { lat: 21.027, lng: 105.847 },
    openHours: "08:00 - 22:00",
    description: "베트남산 카카오로 만든 초콜릿 카페. 진한 핫초콜릿이 인기.",
    tags: ["초콜릿", "디저트", "핫초코"],
    createdAt: new Date().toISOString(),
  },
  // ------------------------ 스파 ------------------------
  {
    name: "La Spa Iconic",
    category: "스파 & 마사지",
    city: "하노이",
    region: "북부",
    address: "38A Hang Chuoi, Hoan Kiem",
    rating: 4.8,
    images: ["https://images.unsplash.com/photo-1606220838311-8c13e44c38c4"],
    coordinates: { lat: 21.025, lng: 105.855 },
    openHours: "09:00 - 22:00",
    description: "트립어드바이저 1위 스파. 아로마테라피와 전통 마사지 전문.",
    tags: ["마사지", "아로마", "휴식"],
    createdAt: new Date().toISOString(),
  },
  // ------------------------ 관광 & 문화 ------------------------
  {
    name: "호안끼엠 호수",
    category: "관광 & 문화",
    city: "하노이",
    region: "북부",
    address: "Hoan Kiem Lake, Hoan Kiem",
    rating: 4.7,
    images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e"],
    coordinates: { lat: 21.028, lng: 105.852 },
    openHours: "24h",
    description: "하노이의 상징적인 호수. 아침 산책 명소이자 야경 명소.",
    tags: ["호수", "야경", "관광지"],
    createdAt: new Date().toISOString(),
  },
  // ------------------------ 쇼핑 ------------------------
  {
    name: "Trang Tien Plaza",
    category: "쇼핑",
    city: "하노이",
    region: "북부",
    address: "24 Hai Ba Trung, Hoan Kiem",
    rating: 4.3,
    images: ["https://images.unsplash.com/photo-1542838132-92c53300491e"],
    coordinates: { lat: 21.024, lng: 105.853 },
    openHours: "09:00 - 22:00",
    description: "하노이 대표 백화점. 명품 브랜드와 현지 브랜드가 공존.",
    tags: ["백화점", "명품", "쇼핑"],
    createdAt: new Date().toISOString(),
  },
  // ------------------------ 액티비티 ------------------------
  {
    name: "하롱베이 크루즈",
    category: "액티비티",
    city: "하롱",
    region: "북부",
    address: "Halong Bay, Quang Ninh",
    rating: 4.9,
    images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e"],
    coordinates: { lat: 20.910, lng: 107.183 },
    openHours: "08:00 - 20:00",
    description: "세계자연유산 하롱베이에서 즐기는 크루즈 투어. 점심 포함.",
    tags: ["크루즈", "자연", "투어"],
    createdAt: new Date().toISOString(),
  },
];

(async () => {
  const batch = db.batch();
  const spotsRef = db.collection("spots");

  for (const spot of spots) {
    const id = spot.name.toLowerCase().replace(/\s+/g, "_");
    const docRef = spotsRef.doc(id);
    batch.set(docRef, spot, { merge: true });
  }

  await batch.commit();
  console.log(`✅ ${spots.length} spots successfully uploaded.`);
  process.exit(0);
})();

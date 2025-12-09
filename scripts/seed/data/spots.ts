
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import dotenv from "dotenv";
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedData = [
  { region: "북부", city: "하노이", category: "호텔", names: [
    "롯데 호텔 하노이", "JW 메리어트 하노이", "멜리아 하노이", "하노이 라 시에스타",
    "인터컨티넨탈 하노이 웨스트레이크", "하노이 소피텔 레전드 메트로폴", "팬 퍼시픽 하노이",
    "하노이 닛꼬 호텔", "하노이 풀만 호텔", "하노이 골든 레이크"
  ]},
  { region: "북부", city: "하노이", category: "레스토랑", names: [
    "Home Hanoi", "Pizza 4P’s", "Cau Go Vietnamese Cuisine", "La Badiane",
    "Duong’s Restaurant", "Green Tangerine", "Maison Marou Hanoi",
    "Pho 10 Ly Quoc Su", "The Hanoi Social Club", "Quan An Ngon"
  ]},
  { region: "북부", city: "하노이", category: "카페 & 브런치", names: [
    "The Note Coffee", "Tranquil Books & Coffee", "Giang Cafe",
    "The Running Bean", "Loading T", "Blackbird Coffee",
    "Kafeville", "Simple Coffee", "Cong Caphe", "Oriberry Coffee"
  ]},
  { region: "북부", city: "하노이", category: "스파 & 마사지", names: [
    "La Spa Iconic", "Serene Spa", "MF Spa Hanoi", "O’Spa Hang Dao",
    "Orchid Spa", "Mido Spa", "Emam Spa", "Omamori Spa", "Zen Spa", "Herbal Spa Hanoi"
  ]},
  { region: "북부", city: "하노이", category: "관광 & 문화", names: [
    "호안끼엠 호수", "하노이 대성당", "문묘", "호치민 묘소", "하노이 오페라 하우스",
    "하노이 구시가지", "호치민 박물관", "롱비엔 다리", "동쑤언 시장", "탕롱 황성"
  ]},
  { region: "북부", city: "하롱베이", category: "관광 & 문화", names: [
    "하롱베이 크루즈", "썬월드 하롱파크", "티톱섬", "동 티엔궁 동굴", "꽈방 절벽",
    "바이짜이 해변", "하롱나이트마켓", "하롱시티 뷰포인트", "바이짜이 다리", "도선항"
  ]},
  { region: "북부", city: "닌빈", category: "관광 & 문화", names: [
    "짱안 보트투어", "땀꼭 보트투어", "호아루 고성", "바이딘 사원", "무아동 전망대",
    "닌빈 국립공원", "타이비엣 사원", "옌마우 마을", "타이비엣 동굴", "호앙롱 사원"
  ]}
];

async function seed() {
  console.log("🌍 Firestore 북부 데이터 입력 중...");
  const image =
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80";

  for (const group of seedData) {
    for (const name of group.names) {
      const spot = {
        name,
        address: `${group.city} 중심가 ${Math.floor(Math.random() * 100)}`,
        description: `${group.city}의 인기 ${group.category} 장소입니다.`,
        imageUrl: image,
        rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
        category: group.category,
        city: group.city,
        region: group.region,
        isSponsored: Math.random() < 0.15,
        sponsorLevel: Math.floor(Math.random() * 3),
      };
      await addDoc(collection(db, "spots"), spot);
      console.log(`✅ ${group.city} - ${group.category} - ${name}`);
    }
  }

  console.log("🎉 모든 북부 지역 데이터 추가 완료!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ 오류 발생:", e);
  process.exit(1);
});

// scripts/seeds/spots.ts
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

// ES Module 환경 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 서비스 계정 키 로드 (경로 확인 필수: 프로젝트 루트 기준)
const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ [Error] serviceAccountKey.json 파일을 찾을 수 없습니다.');
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);

// Firebase 초기화
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// --------------------------------------------------------------------------
// 🛠️ 유틸리티: 베트남어 성조 제거 및 키워드 생성
// --------------------------------------------------------------------------

// 베트남어 성조 제거 함수 (검색 편의성 증대)
const removeVietnameseTones = (str: string): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

// 키워드 생성 헬퍼 (한국어, 영어, 베트남어, 성조제거 버전 모두 포함)
const generateKeywords = (...texts: (string | undefined)[]) => {
  const keywords = new Set<string>();
  
  texts.forEach(text => {
    if (!text) return;
    
    const original = text.trim();
    if (!original) return;

    // 1. 원본 저장
    keywords.add(original);
    
    // 2. 소문자 저장
    const lower = original.toLowerCase();
    keywords.add(lower);

    // 3. 띄어쓰기 단위로 분리해서 저장 (예: "Fansipan Legend" -> "fansipan", "legend")
    lower.split(/\s+/).forEach(w => {
      if (w.length > 1) keywords.add(w);
    });

    // 4. 베트남어 성조 제거 버전 저장 (예: "Hà Nội" -> "ha noi")
    const noTone = removeVietnameseTones(lower);
    if (noTone !== lower) {
      keywords.add(noTone);
      // 성조 제거된 것도 띄어쓰기 분리
      noTone.split(/\s+/).forEach(w => {
        if (w.length > 1) keywords.add(w);
      });
    }
  });

  return Array.from(keywords);
};

// 기존 컬렉션 삭제 함수
async function deleteCollection(collectionPath: string, batchSize: number = 50) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db: any, query: any, resolve: (value?: unknown) => void) {
  const snapshot = await query.get();

  if (snapshot.size === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc: any) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

// ==============================================================================
// 🏔️ 베트남 북서부 (Northwest) 데이터
// [구조 변경]
// city: 행정구역 (성/Province) - 예: 라오까이 (Lào Cai)
// region: 관광 거점 (Town/Spot) - 예: 사파 (Sa Pa)
// name_vn: 현지어 명칭 추가
// ==============================================================================

const NORTHWEST_SPOTS = [
  // --------------------------------------------------------------------------
  // [1] 라오까이 성 (Lào Cai) - 사파 (Sa Pa)
  // --------------------------------------------------------------------------
  {
    name: "판시판 산 (Fansipan Legend)",
    name_vn: "Fansipan Legend",
    city: "라오까이 (Lào Cai)", region: "사파 (Sa Pa)", category: "관광지", mode: "explorer",
    address: "Sapa, Lao Cai",
    description: "해발 3,143m 인도차이나의 지붕. 케이블카를 타고 구름 위를 오르는 경험은 사파 여행의 필수 코스입니다.",
    images: ["https://images.unsplash.com/photo-1585023908688-692d47da2267?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.9, reviewCount: 8800, priceLevel: 3, viewCount: 42000,
    location: { lat: 22.3034, lng: 103.7752 }
  },
  {
    name: "깟깟 마을 (Cat Cat Village)",
    name_vn: "Bản Cát Cát",
    city: "라오까이 (Lào Cai)", region: "사파 (Sa Pa)", category: "관광지", mode: "explorer",
    address: "San Sa Ho, Sapa",
    description: "사파 시내에서 가장 가까운 몽족 마을. 계단식 논과 폭포, 물레방아가 어우러진 동화 같은 풍경을 자랑합니다.",
    images: ["https://images.unsplash.com/photo-1585023831780-692d47da2267?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.5, reviewCount: 6200, priceLevel: 1, viewCount: 28000,
    location: { lat: 22.3275, lng: 103.8342 }
  },
  {
    name: "타반 마을 (Ta Van Village)",
    name_vn: "Bản Tả Van",
    city: "라오까이 (Lào Cai)", region: "사파 (Sa Pa)", category: "관광지", mode: "explorer",
    address: "Muong Hoa Valley, Sapa",
    description: "자이족이 사는 평화로운 마을. 상업화된 깟깟 마을보다 한적하며 트레킹과 홈스테이 명소로 유명합니다.",
    images: ["https://images.unsplash.com/photo-1533299741930-9b6264d14216?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.7, reviewCount: 2500, priceLevel: 0, viewCount: 15000,
    location: { lat: 22.3086, lng: 103.8825 }
  },
  {
    name: "함롱 산 (Ham Rong Mountain)",
    name_vn: "Núi Hàm Rồng",
    city: "라오까이 (Lào Cai)", region: "사파 (Sa Pa)", category: "관광지", mode: "explorer",
    address: "Sapa Town, Lao Cai",
    description: "사파 시내를 한눈에 내려다볼 수 있는 꽃 정원 전망대. 가벼운 등산으로 사파의 전경을 감상하기 좋습니다.",
    images: ["https://images.unsplash.com/photo-1528543035968-084725339f4e?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.4, reviewCount: 3100, priceLevel: 1, viewCount: 12000,
    location: { lat: 22.3353, lng: 103.8415 }
  },
  {
    name: "실버 폭포 (Thac Bac Waterfall)",
    name_vn: "Thác Bạc",
    city: "라오까이 (Lào Cai)", region: "사파 (Sa Pa)", category: "관광지", mode: "explorer",
    address: "San Sa Ho, Sapa",
    description: "200m 높이에서 쏟아지는 은색 물줄기. 오뀌호 고개로 가는 길에 들르기 좋은 웅장한 폭포입니다.",
    images: ["https://images.unsplash.com/photo-1616080536480-1a76c8c1d56e?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.3, reviewCount: 1500, priceLevel: 1, viewCount: 8000,
    location: { lat: 22.3619, lng: 103.7803 }
  },
  {
    name: "러브 폭포 (Love Waterfall)",
    name_vn: "Thác Tình Yêu",
    city: "라오까이 (Lào Cai)", region: "사파 (Sa Pa)", category: "관광지", mode: "explorer",
    address: "San Sa Ho, Sapa",
    description: "숲속 길을 따라 걷다 보면 만나는 아름다운 폭포. 전설 속 선녀와 나무꾼의 사랑 이야기가 깃들어 있습니다.",
    images: ["https://images.unsplash.com/photo-1544955115-08e87498305c?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.6, reviewCount: 1200, priceLevel: 1, viewCount: 7500,
    location: { lat: 22.3550, lng: 103.7667 }
  },
  {
    name: "오 뀌 호 고개 (O Quy Ho Pass)",
    name_vn: "Đèo Ô Quy Hồ",
    city: "라오까이 (Lào Cai)", region: "사파 (Sa Pa)", category: "관광지", mode: "explorer",
    address: "National Road 4D, Lao Cai",
    description: "베트남 4대 고개 중 하나로, 구름 바다 위로 지는 일몰이 환상적인 드라이브 코스입니다.",
    images: ["https://images.unsplash.com/photo-1627894006066-b405553b3004?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.8, reviewCount: 4800, priceLevel: 0, viewCount: 22000,
    location: { lat: 22.3525, lng: 103.7533 }
  },
  {
    name: "사파 성당 (Stone Church)",
    name_vn: "Nhà Thờ Đá Sapa",
    city: "라오까이 (Lào Cai)", region: "사파 (Sa Pa)", category: "관광지", mode: "explorer",
    address: "Sapa Town, Lao Cai",
    description: "1895년 프랑스인들이 지은 석조 성당. 사파 광장의 중심이자 만남의 장소입니다.",
    images: ["https://images.unsplash.com/photo-1565251662998-d19119561081?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.5, reviewCount: 5500, priceLevel: 0, viewCount: 30000,
    location: { lat: 22.3356, lng: 103.8419 }
  },
  {
    name: "모아나 사파 (Moana Sapa)",
    name_vn: "Moana Sapa",
    city: "라오까이 (Lào Cai)", region: "사파 (Sa Pa)", category: "관광지", mode: "explorer",
    address: "68 Phan Si Pang, Sapa",
    description: "'천국의 문', '거대 손' 등 사진 촬영을 위해 조성된 테마파크. 인생샷을 남기기 위해 젊은 여행객들이 많이 찾습니다.",
    images: ["https://images.unsplash.com/photo-1616892550186-0428d087756f?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.4, reviewCount: 3100, priceLevel: 2, viewCount: 18000,
    location: { lat: 22.3297, lng: 103.8394 }
  },
  {
    name: "박하 시장 (Bac Ha Market)",
    name_vn: "Chợ Bắc Hà",
    city: "라오까이 (Lào Cai)", region: "박하 (Bắc Hà)", category: "쇼핑", mode: "explorer",
    address: "Bac Ha, Lao Cai",
    description: "매주 일요일에만 열리는 북부 최대 규모의 소수민족 시장. 화려한 전통 의상과 물물교환 현장을 볼 수 있습니다.",
    images: ["https://images.unsplash.com/photo-1522066806086-63e793936994?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.7, reviewCount: 2800, priceLevel: 1, viewCount: 11000,
    location: { lat: 22.5386, lng: 104.2889 }
  },
  {
    name: "이 띠 (Y Ty)",
    name_vn: "Y Tý",
    city: "라오까이 (Lào Cai)", region: "밧쌋 (Bát Xát)", category: "관광지", mode: "explorer",
    address: "Bat Xat, Lao Cai",
    description: "구름 사냥과 황금빛 다랭이 논, 그리고 독특한 흙집으로 유명한 사진작가들의 숨겨진 명소입니다.",
    images: ["https://images.unsplash.com/photo-1600863071221-8b3d63b27677?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.8, reviewCount: 950, priceLevel: 0, viewCount: 6000,
    location: { lat: 22.6256, lng: 103.6067 }
  },
  {
    name: "하커우 국경 (Ha Khau Border)",
    name_vn: "Cửa khẩu Hà Khẩu",
    city: "라오까이 (Lào Cai)", region: "라오까이 시 (TP Lào Cai)", category: "관광지", mode: "explorer",
    address: "Lao Cai City",
    description: "다리 하나만 건너면 중국 운남성 하구(Hekou)로 갈 수 있는 국경 관문. 국경 비석 인증샷 명소입니다.",
    images: ["https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.3, reviewCount: 2100, priceLevel: 0, viewCount: 9500,
    location: { lat: 22.5083, lng: 103.9639 }
  },

  // --------------------------------------------------------------------------
  // [2] 선라 성 (Sơn La) - 목쩌우 (Mộc Châu)
  // --------------------------------------------------------------------------
  {
    name: "목쩌우 차밭 (Moc Chau Tea Hills)",
    name_vn: "Đồi Chè Mộc Châu",
    city: "선라 (Sơn La)", region: "목쩌우 (Mộc Châu)", category: "관광지", mode: "explorer",
    address: "Moc Chau, Son La",
    description: "끝없이 펼쳐진 초록빛 차밭. 특히 하트 모양으로 심어진 차밭은 커플들의 필수 방문 코스입니다.",
    images: ["https://images.unsplash.com/photo-1616744889965-0916b713600c?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.7, reviewCount: 5200, priceLevel: 0, viewCount: 20000,
    location: { lat: 20.8419, lng: 104.6653 }
  },
  {
    name: "박 롱 유리다리 (Bach Long Glass Bridge)",
    name_vn: "Cầu Kính Bạch Long",
    city: "선라 (Sơn La)", region: "목쩌우 (Mộc Châu)", category: "관광지", mode: "explorer",
    address: "Moc Chau, Son La",
    description: "세계에서 가장 긴 유리 바닥 다리(632m). 아찔한 절벽 위를 걷는 스릴을 즐길 수 있습니다.",
    images: ["https://images.unsplash.com/photo-1605648916361-9bc12ad6a569?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.6, reviewCount: 3500, priceLevel: 3, viewCount: 18000,
    location: { lat: 20.8167, lng: 104.6167 }
  },
  {
    name: "나카 자두 골짜기 (Na Ka Plum Valley)",
    name_vn: "Thung Lũng Mận Nà Ka",
    city: "선라 (Sơn La)", region: "목쩌우 (Mộc Châu)", category: "관광지", mode: "explorer",
    address: "Moc Chau, Son La",
    description: "봄이면 하얀 자두꽃이 계곡 전체를 뒤덮어 장관을 이룹니다. 5월에는 자두 따기 체험도 가능합니다.",
    images: ["https://images.unsplash.com/photo-1518005052304-a372180c952d?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.8, reviewCount: 2800, priceLevel: 1, viewCount: 14000,
    location: { lat: 20.8500, lng: 104.6500 }
  },
  {
    name: "반 앙 소나무 숲 (Ban Ang Pine Forest)",
    name_vn: "Rừng Thông Bản Áng",
    city: "선라 (Sơn La)", region: "목쩌우 (Mộc Châu)", category: "관광지", mode: "explorer",
    address: "Moc Chau, Son La",
    description: "호수를 둘러싼 고요한 소나무 숲. '베트남의 달랏'이라 불리며 캠핑과 산책을 즐기기에 좋습니다.",
    images: ["https://images.unsplash.com/photo-1543835683-ec5466c68790?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.5, reviewCount: 3100, priceLevel: 1, viewCount: 12000,
    location: { lat: 20.8333, lng: 104.6333 }
  },
  {
    name: "다이 옘 폭포 (Dai Yem Waterfall)",
    name_vn: "Thác Dải Yếm",
    city: "선라 (Sơn La)", region: "목쩌우 (Mộc Châu)", category: "관광지", mode: "explorer",
    address: "Moc Chau, Son La",
    description: "두 개의 물줄기가 합쳐져 떨어지는 아름다운 폭포. 전설에 따르면 소녀의 브래지어(Yem)를 닮았다고 합니다.",
    images: ["https://images.unsplash.com/photo-1463130456064-2e915003b4f6?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.4, reviewCount: 1800, priceLevel: 1, viewCount: 8000,
    location: { lat: 20.8250, lng: 104.6000 }
  },
  {
    name: "따수아 공룡 척추 (Ta Xua Dinosaur Spine)",
    name_vn: "Sống Lưng Khủng Long Tà Xùa",
    city: "선라 (Sơn La)", region: "박옌 (Bắc Yên)", category: "관광지", mode: "explorer",
    address: "Bac Yen, Son La",
    description: "베트남 최고의 운해(구름 바다) 명소. 능선이 공룡 척추처럼 얇고 길게 뻗어 있어 아찔한 트레킹을 즐길 수 있습니다.",
    images: ["https://images.unsplash.com/photo-1552554286-6677cc203248?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.9, reviewCount: 4500, priceLevel: 0, viewCount: 25000,
    location: { lat: 21.2667, lng: 104.4500 }
  },
  {
    name: "선라 감옥 박물관 (Son La Prison)",
    name_vn: "Nhà Tù Sơn La",
    city: "선라 (Sơn La)", region: "선라 시 (TP Sơn La)", category: "관광지", mode: "explorer",
    address: "Son La City",
    description: "프랑스 식민지 시절 정치범을 수용했던 감옥. 유명한 '복숭아 나무'가 심어진 역사 교육의 현장입니다.",
    images: ["https://images.unsplash.com/photo-1618588507085-c79565432917?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.5, reviewCount: 1200, priceLevel: 1, viewCount: 5000,
    location: { lat: 21.3333, lng: 103.9167 }
  },
  {
    name: "파 루옹 산 (Pha Luong Peak)",
    name_vn: "Đỉnh Pha Luông",
    city: "선라 (Sơn La)", region: "목쩌우 (Mộc Châu)", category: "관광지", mode: "explorer",
    address: "Moc Chau, Son La",
    description: "베트남-라오스 국경에 위치한 웅장한 바위산. 정상의 평평한 바위 끝에 앉아 찍는 사진이 유명합니다.",
    images: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.8, reviewCount: 2100, priceLevel: 0, viewCount: 9000,
    location: { lat: 20.7667, lng: 104.6333 }
  },
  {
    name: "홍 촌 (Hong Village)",
    name_vn: "Bản Hồng",
    city: "선라 (Sơn La)", region: "목쩌우 (Mộc Châu)", category: "관광지", mode: "explorer",
    address: "Moc Chau, Son La",
    description: "관광객이 적고 현지 소수민족의 삶을 가까이서 볼 수 있는 조용한 마을입니다.",
    images: ["https://images.unsplash.com/photo-1596707328470-87729f273570?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.3, reviewCount: 800, priceLevel: 0, viewCount: 4000,
    location: { lat: 20.8500, lng: 104.6600 }
  },
  {
    name: "해피랜드 (Happy Land)",
    name_vn: "Happy Land Mộc Châu",
    city: "선라 (Sơn La)", region: "목쩌우 (Mộc Châu)", category: "관광지", mode: "explorer",
    address: "Moc Chau, Son La",
    description: "사계절 꽃이 피는 정원과 양떼 목장, 전통 의상 체험 등을 한곳에서 즐길 수 있는 가족형 테마파크입니다.",
    images: ["https://images.unsplash.com/photo-1560759226-1483a2beab85?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.2, reviewCount: 3500, priceLevel: 2, viewCount: 13000,
    location: { lat: 20.8200, lng: 104.6100 }
  },

  // --------------------------------------------------------------------------
  // [3] 호아빈 성 (Hòa Bình) - 마이쩌우 (Mai Châu)
  // --------------------------------------------------------------------------
  {
    name: "마이쩌우 (Mai Chau)",
    name_vn: "Thung Lũng Mai Châu",
    city: "호아빈 (Hòa Bình)", region: "마이쩌우 (Mai Châu)", category: "관광지", mode: "explorer",
    address: "Mai Chau, Hoa Binh",
    description: "하노이 근교의 평화로운 전원 마을. 자전거를 타고 황금빛 논밭 사이를 달리는 힐링 여행지입니다.",
    images: ["https://images.unsplash.com/photo-1504214208698-ea1916a2195a?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.8, reviewCount: 6500, priceLevel: 0, viewCount: 21000,
    location: { lat: 20.6608, lng: 105.0786 }
  },
  {
    name: "반 락 마을 (Ban Lac)",
    name_vn: "Bản Lác",
    city: "호아빈 (Hòa Bình)", region: "마이쩌우 (Mai Châu)", category: "관광지", mode: "explorer",
    address: "Mai Chau, Hoa Binh",
    description: "타이족(Thai)의 전통 고상 가옥(Stilt House)에서 홈스테이를 하며 캠프파이어와 전통춤을 즐길 수 있습니다.",
    images: ["https://images.unsplash.com/photo-1518005052304-a372180c952d?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.6, reviewCount: 3800, priceLevel: 1, viewCount: 12000,
    location: { lat: 20.6650, lng: 105.0850 }
  },
  {
    name: "퉁 나이 (Thung Nai)",
    name_vn: "Thung Nai",
    city: "호아빈 (Hòa Bình)", region: "까오퐁 (Cao Phong)", category: "관광지", mode: "explorer",
    address: "Cao Phong, Hoa Binh",
    description: "'다 강(Da River)의 하롱베이'라 불리는 인공 호수. 보트를 타고 사원을 방문하거나 수상 가옥을 구경할 수 있습니다.",
    images: ["https://images.unsplash.com/photo-1594235048794-fac97475304c?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.5, reviewCount: 1500, priceLevel: 1, viewCount: 7000,
    location: { lat: 20.7333, lng: 105.2333 }
  },
  {
    name: "호아빈 댐 (Hoa Binh Hydropower Plant)",
    name_vn: "Thủy Điện Hòa Bình",
    city: "호아빈 (Hòa Bình)", region: "호아빈 시 (TP Hòa Bình)", category: "관광지", mode: "explorer",
    address: "Hoa Binh City",
    description: "베트남 전력 공급의 핵심인 거대 댐. 호치민 주석 동상이 있는 전망대에서 웅장한 전경을 볼 수 있습니다.",
    images: ["https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.4, reviewCount: 2200, priceLevel: 0, viewCount: 8500,
    location: { lat: 20.8167, lng: 105.3333 }
  },
  {
    name: "킴보이 온천 (Kim Boi Hot Springs)",
    name_vn: "Suối Khoáng Kim Bôi",
    city: "호아빈 (Hòa Bình)", region: "킴보이 (Kim Bôi)", category: "스파/마사지", mode: "explorer",
    address: "Kim Boi, Hoa Binh",
    description: "지하 깊은 곳에서 솟아나는 천연 미네랄 온천. 수질이 좋아 건강과 피부 미용을 위한 휴양지로 인기입니다.",
    images: ["https://images.unsplash.com/photo-1563720223523-491ff04651de?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.3, reviewCount: 1800, priceLevel: 2, viewCount: 6000,
    location: { lat: 20.6667, lng: 105.5333 }
  },
  {
    name: "루옹 선 (Luong Son)",
    name_vn: "Lương Sơn",
    city: "호아빈 (Hòa Bình)", region: "루옹 선 (Lương Sơn)", category: "관광지", mode: "explorer",
    address: "Luong Son, Hoa Binh",
    description: "고급 리조트와 골프장이 모여 있는 하노이 근교의 럭셔리 주말 휴양지입니다.",
    images: ["https://images.unsplash.com/photo-1582653288634-4136fc1ee9b6?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.5, reviewCount: 1100, priceLevel: 3, viewCount: 4000,
    location: { lat: 20.8500, lng: 105.5500 }
  },
  {
    name: "고 라오 폭포 (Go Lao Waterfall)",
    name_vn: "Thác Gò Lào",
    city: "호아빈 (Hòa Bình)", region: "마이쩌우 (Mai Châu)", category: "관광지", mode: "explorer",
    address: "Mai Chau, Hoa Binh",
    description: "대나무 숲 속에 숨겨진 청정 폭포. 마이쩌우 가는 길에 잠시 들러 더위를 식히기 좋습니다.",
    images: ["https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.4, reviewCount: 900, priceLevel: 0, viewCount: 3500,
    location: { lat: 20.6800, lng: 105.1000 }
  },
  {
    name: "룽 반 (Lung Van)",
    name_vn: "Lũng Vân",
    city: "호아빈 (Hòa Bình)", region: "떤락 (Tân Lạc)", category: "관광지", mode: "explorer",
    address: "Tan Lac, Hoa Binh",
    description: "해발 1,200m 고지에 위치한 '구름의 땅'. 문명과 동떨어진 채 전통을 지키며 사는 므엉족 마을입니다.",
    images: ["https://images.unsplash.com/photo-1591526038358-0e3d305cd86b?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.7, reviewCount: 500, priceLevel: 0, viewCount: 2000,
    location: { lat: 20.6000, lng: 105.2000 }
  },

  // --------------------------------------------------------------------------
  // [4] 옌바이 성 (Yên Bái) - 무캉차이 (Mù Cang Chải)
  // --------------------------------------------------------------------------
  {
    name: "무캉차이 다랭이 논 (Mu Cang Chai)",
    name_vn: "Ruộng Bậc Thang Mù Cang Chải",
    city: "옌바이 (Yên Bái)", region: "무캉차이 (Mù Cang Chải)", category: "관광지", mode: "explorer",
    address: "Mu Cang Chai, Yen Bai",
    description: "[국가유산] 산비탈을 깎아 만든 거대한 계단식 논. 9~10월 수확철 황금빛 물결은 베트남 최고의 절경으로 꼽힙니다.",
    images: ["https://images.unsplash.com/photo-1531384370597-8590413be50a?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.9, reviewCount: 6700, priceLevel: 0, viewCount: 32000,
    location: { lat: 21.8500, lng: 104.0833 }
  },
  {
    name: "멈 쏘이 언덕 (Mam Xoi Hill)",
    name_vn: "Đồi Mâm Xôi",
    city: "옌바이 (Yên Bái)", region: "무캉차이 (Mù Cang Chải)", category: "관광지", mode: "explorer",
    address: "La Pan Tan, Mu Cang Chai",
    description: "둥근 쟁반 모양의 '라즈베리 언덕'. 무캉차이의 상징적인 포토존으로 사진작가들이 가장 사랑하는 장소입니다.",
    images: ["https://images.unsplash.com/photo-1596707328470-87729f273570?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.8, reviewCount: 4200, priceLevel: 1, viewCount: 18000,
    location: { lat: 21.8667, lng: 104.1000 }
  },
  {
    name: "카우 파 고개 (Khau Pha Pass)",
    name_vn: "Đèo Khau Phạ",
    city: "옌바이 (Yên Bái)", region: "무캉차이 (Mù Cang Chải)", category: "관광지", mode: "explorer",
    address: "Mu Cang Chai, Yen Bai",
    description: "베트남 4대 험준한 고개 중 하나. 매년 가을 '황금빛 들판 위를 비행하는' 패러글라이딩 축제가 열립니다.",
    images: ["https://images.unsplash.com/photo-1465433671151-b6a12b7f08b3?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.7, reviewCount: 2500, priceLevel: 3, viewCount: 9000,
    location: { lat: 21.8000, lng: 104.1500 }
  },
  {
    name: "투 레 계곡 (Tu Le Valley)",
    name_vn: "Thung Lũng Tú Lệ",
    city: "옌바이 (Yên Bái)", region: "반찬 (Văn Chấn)", category: "관광지", mode: "explorer",
    address: "Van Chan, Yen Bai",
    description: "향기로운 찹쌀(Com) 생산지로 유명한 평화로운 계곡. 수확철에는 소수민족들이 계곡 온천에서 목욕하는 모습도 볼 수 있습니다.",
    images: ["https://images.unsplash.com/photo-1569429562575-52b36214878a?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.5, reviewCount: 1800, priceLevel: 0, viewCount: 6500,
    location: { lat: 21.6500, lng: 104.3000 }
  },
  {
    name: "탁 바 호수 (Thac Ba Lake)",
    name_vn: "Hồ Thác Bà",
    city: "옌바이 (Yên Bái)", region: "옌빈 (Yên Bình)", category: "관광지", mode: "explorer",
    address: "Yen Binh, Yen Bai",
    description: "1,300개 이상의 섬이 있는 베트남 최대 인공 호수 중 하나. '산 속의 하롱베이'라 불리며 보트 투어가 가능합니다.",
    images: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.4, reviewCount: 1200, priceLevel: 1, viewCount: 5000,
    location: { lat: 21.8333, lng: 104.9167 }
  },
  {
    name: "수오이 지앙 (Suoi Giang)",
    name_vn: "Suối Giàng",
    city: "옌바이 (Yên Bái)", region: "반찬 (Văn Chấn)", category: "관광지", mode: "explorer",
    address: "Van Chan, Yen Bai",
    description: "수령 300~400년 된 고대 차나무 숲이 있는 고원. 이곳의 샨 뚜옛(Shan Tuyet) 차는 베트남 최고급 차로 꼽힙니다.",
    images: ["https://images.unsplash.com/photo-1523920709503-455b8040a6b9?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.6, reviewCount: 900, priceLevel: 0, viewCount: 3500,
    location: { lat: 21.6000, lng: 104.4000 }
  },
  {
    name: "트람 타우 온천 (Tram Tau Hot Spring)",
    name_vn: "Suối Khoáng Trạm Tấu",
    city: "옌바이 (Yên Bái)", region: "트람 타우 (Trạm Tấu)", category: "스파/마사지", mode: "explorer",
    address: "Tram Tau, Yen Bai",
    description: "계단식 논 바로 옆에 위치한 노천온천. 아름다운 전원 풍경을 바라보며 따뜻한 온천욕을 즐길 수 있는 힐링 스팟입니다.",
    images: ["https://images.unsplash.com/photo-1574673646738-4e897914619b?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.8, reviewCount: 2200, priceLevel: 2, viewCount: 11000,
    location: { lat: 21.5000, lng: 104.3500 }
  },

  // --------------------------------------------------------------------------
  // [5] 디엔비엔 성 (Điện Biên)
  // --------------------------------------------------------------------------
  {
    name: "디엔비엔푸 승전 기념관 (Victory Museum)",
    name_vn: "Bảo Tàng Chiến Thắng Điện Biên Phủ",
    city: "디엔비엔 (Điện Biên)", region: "디엔비엔푸 (TP Điện Biên Phủ)", category: "관광지", mode: "explorer",
    address: "Dien Bien Phu City",
    description: "1954년 프랑스군을 격파한 역사적 승리를 기념하는 박물관. 거대한 파노라마 그림이 전쟁의 상황을 생생하게 보여줍니다.",
    images: ["https://images.unsplash.com/photo-1579895393247-49f390886546?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.6, reviewCount: 2500, priceLevel: 1, viewCount: 8000,
    location: { lat: 21.3861, lng: 103.0211 }
  },
  {
    name: "A1 언덕 (A1 Hill)",
    name_vn: "Đồi A1",
    city: "디엔비엔 (Điện Biên)", region: "디엔비엔푸 (TP Điện Biên Phủ)", category: "관광지", mode: "explorer",
    address: "Dien Bien Phu City",
    description: "디엔비엔푸 전투의 가장 치열했던 격전지. 참호, 벙커, 탱크 잔해와 거대한 폭탄 구덩이가 그대로 보존되어 있습니다.",
    images: ["https://images.unsplash.com/photo-1599577732952-b8923485764d?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.5, reviewCount: 1800, priceLevel: 1, viewCount: 6500,
    location: { lat: 21.3833, lng: 103.0167 }
  },
  {
    name: "파 딘 고개 (Pha Din Pass)",
    name_vn: "Đèo Pha Đin",
    city: "디엔비엔 (Điện Biên)", region: "뚜언지아오 (Tuần Giáo)", category: "관광지", mode: "explorer",
    address: "Tuan Giao, Dien Bien",
    description: "'하늘과 땅의 경계'라는 뜻의 고개. 32km에 달하는 굽이친 길을 달리며 웅장한 산세를 감상할 수 있습니다.",
    images: ["https://images.unsplash.com/photo-1508233620467-f79f1e317a05?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.7, reviewCount: 1500, priceLevel: 0, viewCount: 5000,
    location: { lat: 21.5667, lng: 103.5500 }
  },
  {
    name: "파 쾅 호수 (Pa Khoang Lake)",
    name_vn: "Hồ Pa Khoang",
    city: "디엔비엔 (Điện Biên)", region: "디엔비엔 현 (Huyện Điện Biên)", category: "관광지", mode: "explorer",
    address: "Dien Bien District",
    description: "맑은 호수 한가운데 벚꽃 섬(Dao Hoa Anh Dao)이 있어 봄이면 핑크빛으로 물드는 로맨틱한 장소입니다.",
    images: ["https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.4, reviewCount: 900, priceLevel: 0, viewCount: 4000,
    location: { lat: 21.4333, lng: 103.1000 }
  },
  {
    name: "므엉 탄 들판 (Muong Thanh Field)",
    name_vn: "Cánh Đồng Mường Thanh",
    city: "디엔비엔 (Điện Biên)", region: "디엔비엔푸 (TP Điện Biên Phủ)", category: "관광지", mode: "explorer",
    address: "Dien Bien Phu City",
    description: "북서부 최대의 곡창 지대. 끝없이 펼쳐진 논밭과 그 사이를 흐르는 강이 평화로운 풍경을 자아냅니다.",
    images: ["https://images.unsplash.com/photo-1623851605335-51d283732000?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.5, reviewCount: 1200, priceLevel: 0, viewCount: 5500,
    location: { lat: 21.3500, lng: 103.0000 }
  },
  {
    name: "베트남-라오스 국경 (Tay Trang Border)",
    name_vn: "Cửa Khẩu Tây Trang",
    city: "디엔비엔 (Điện Biên)", region: "디엔비엔 현 (Huyện Điện Biên)", category: "관광지", mode: "explorer",
    address: "Dien Bien District",
    description: "베트남 서쪽 끝, 라오스로 넘어가는 국경 관문. 국경을 넘지 않더라도 표지석 앞에서 기념사진을 찍을 수 있습니다.",
    images: ["https://images.unsplash.com/photo-1548509923-b6d34b814a04?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.2, reviewCount: 600, priceLevel: 0, viewCount: 3000,
    location: { lat: 21.2167, lng: 102.9333 }
  },

  // --------------------------------------------------------------------------
  // [6] 라이쩌우 성 (Lai Châu)
  // --------------------------------------------------------------------------
  {
    name: "신 호 고원 (Sin Ho Plateau)",
    name_vn: "Cao Nguyên Sìn Hồ",
    city: "라이쩌우 (Lai Châu)", region: "신 호 (Sìn Hồ)", category: "관광지", mode: "explorer",
    address: "Sin Ho, Lai Chau",
    description: "해발 1,500m에 위치한 '북서부의 지붕'. 15개 소수민족이 어우러져 살며 일요일 시장이 매우 다채롭습니다.",
    images: ["https://images.unsplash.com/photo-1501438428514-41144cb19438?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.6, reviewCount: 800, priceLevel: 0, viewCount: 4500,
    location: { lat: 22.3500, lng: 103.2500 }
  },
  {
    name: "푸 타 렝 산 (Pu Ta Leng)",
    name_vn: "Đỉnh Pu Ta Leng",
    city: "라이쩌우 (Lai Châu)", region: "땀 즈엉 (Tam Đường)", category: "관광지", mode: "explorer",
    address: "Tam Duong, Lai Chau",
    description: "베트남에서 3번째로 높은 산(3,049m). 원시림과 이끼 숲, 철쭉꽃이 어우러진 전문 트레커들의 성지입니다.",
    images: ["https://images.unsplash.com/photo-1589553531649-14a0f448c085?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.8, reviewCount: 500, priceLevel: 0, viewCount: 3000,
    location: { lat: 22.4167, lng: 103.5833 }
  },
  {
    name: "천국의 문 (Heaven Gate)",
    name_vn: "Cổng Trời Ô Quy Hồ",
    city: "라이쩌우 (Lai Châu)", region: "땀 즈엉 (Tam Đường)", category: "관광지", mode: "explorer",
    address: "Tam Duong, Lai Chau",
    description: "오 뀌 호 고개 정상에 위치한 전망대. 발아래로 펼쳐지는 웅장한 산맥과 계곡 뷰가 압권입니다.",
    images: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.7, reviewCount: 3200, priceLevel: 1, viewCount: 12000,
    location: { lat: 22.3333, lng: 103.7667 }
  },
  {
    name: "탁 틴 폭포 (Tac Tinh Waterfall)",
    name_vn: "Thác Tác Tình",
    city: "라이쩌우 (Lai Châu)", region: "땀 즈엉 (Tam Đường)", category: "관광지", mode: "explorer",
    address: "Tam Duong, Lai Chau",
    description: "슬픈 사랑의 전설이 깃든 폭포. 멀리서 보면 산비탈에 걸린 하얀 비단처럼 보입니다.",
    images: ["https://images.unsplash.com/photo-1518384401463-d3876163c195?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.4, reviewCount: 600, priceLevel: 0, viewCount: 2500,
    location: { lat: 22.3833, lng: 103.5000 }
  },
  {
    name: "푸 삼 캡 동굴 (Pu Sam Cap Cave)",
    name_vn: "Động Pu Sam Cáp",
    city: "라이쩌우 (Lai Châu)", region: "라이쩌우 시 (TP Lai Châu)", category: "관광지", mode: "explorer",
    address: "Lai Chau City",
    description: "아직 많이 알려지지 않은 야생의 동굴. 자연 그대로 보존된 종유석들이 신비로운 지하 궁전을 연상케 합니다.",
    images: ["https://images.unsplash.com/photo-1499244571973-b0c3451151fc?q=80&w=1000&auto=format&fit=crop"],
    rating: 4.5, reviewCount: 400, priceLevel: 1, viewCount: 2000,
    location: { lat: 22.3667, lng: 103.4333 }
  }
];

// ==============================================================================
// 🚀 실행 로직 (Main)
// ==============================================================================

async function seed() {
  console.log("🚀 Seeding process started...");

  try {
    // 1. 기존 데이터 삭제 (Clean Start)
    console.log("🧹 Clearing old data...");
    await deleteCollection('spots');
    await deleteCollection('adult_spots');
    console.log("✅ Old data cleared.");

    // 2. 데이터 주입
    console.log(`🌱 Inserting ${NORTHWEST_SPOTS.length} spots...`);
    
    let explorerCount = 0;
    let nightlifeCount = 0;

    for (const spot of NORTHWEST_SPOTS) {
      // 키워드 생성 (이름, 도시, 지역, 베트남명 포함)
      const keywords = generateKeywords(
        spot.name, 
        spot.name_vn,
        spot.city, 
        spot.region,
        spot.category
      );

      // 공통 데이터 필드
      const spotData = {
        name: spot.name,
        name_vn: spot.name_vn, // 추가된 필드
        description: spot.description,
        address: spot.address,
        city: spot.city,       
        region: spot.region,   
        category: spot.category, 
        rating: spot.rating,
        reviewCount: spot.reviewCount,
        images: spot.images,
        latitude: spot.location.lat,
        longitude: spot.location.lng,
        openHours: "09:00 - 22:00",
        phone: "+84 123 456 789",
        keywords: keywords, // 강력해진 검색 키워드
        isSponsored: false,
        viewCount: spot.viewCount,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // 모드에 따라 컬렉션 분기
      const collectionName = spot.mode === 'nightlife' ? 'adult_spots' : 'spots';
      
      await db.collection(collectionName).add(spotData);

      if (spot.mode === 'nightlife') nightlifeCount++;
      else explorerCount++;
    }

    console.log(`🎉 Seeding finished!`);
    console.log(`   - Explorer Spots: ${explorerCount}`);
    console.log(`   - Nightlife Spots: ${nightlifeCount}`);
    console.log("⚠️ 프론트엔드에서 새로고침하여 확인하세요.");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// 실행
seed().then(() => {
  setTimeout(() => process.exit(0), 2000);
});
// apps/web/src/lib/regions.ts

/**
 * 베트남 지역 데이터 (권역 > 주요 도시)
 * - 관리자 페이지(AdminSpotForm)와 사용자 페이지(FilterDrawer)에서 공통으로 사용
 * - 형식: "한글명 (영문명)" -> 화면엔 한글만 표시됨
 */
export const VIETNAM_REGIONS = {
  "북부": [
    "하노이 (Hanoi)", "하롱베이 (Quang Ninh)", "사파 (Lao Cai)", "닌빈 (Ninh Binh)", 
    "하이퐁 (Hai Phong)", "하장 (Ha Giang)", "박닌 (Bac Ninh)", "마이쩌우 (Hoa Binh)",
    "목쩌우 (Son La)", "까오방 (Cao Bang)", "랑선 (Lang Son)", "라이쩌우 (Lai Chau)", 
    "디엔비엔 (Dien Bien)", "옌바이 (Yen Bai)", "박깐 (Bac Kan)", "뚜옌꽝 (Tuyen Quang)",
    "타이응우옌 (Thai Nguyen)", "빈푹 (Vinh Phuc)", "푸토 (Phu Tho)", "박장 (Bac Giang)",
    "남딘 (Nam Dinh)", "타이빈 (Thai Binh)", "하남 (Ha Nam)", "흥옌 (Hung Yen)", "하이즈엉 (Hai Duong)"
  ],
  "중부": [
    "다낭 (Da Nang)", "호이안 (Quang Nam)", "나트랑 (Khanh Hoa)", "달랏 (Lam Dong)", 
    "후에 (Hue)", "무이네 (Binh Thuan)", "퀴논 (Binh Dinh)", "동허이 (Quang Binh)",
    "플레이쿠 (Gia Lai)", "부온마투옷 (Dak Lak)", "꼰뚬 (Kon Tum)", "닥농 (Dak Nong)",
    "푸옌 (Phu Yen)", "꽝응아이 (Quang Ngai)", "꽝찌 (Quang Tri)", "타인호아 (Thanh Hoa)", 
    "응에안 (Nghe An)", "하띤 (Ha Tinh)"
  ],
  "남부": [
    "호치민 (Ho Chi Minh)", "붕따우 (Ba Ria)", "껀터 (Can Tho)", "미토 (Tien Giang)", 
    "벤째 (Ben Tre)", "쩌우독 (An Giang)", "락자 (Kien Giang)", "동나이 (Dong Nai)", 
    "빈즈엉 (Binh Duong)", "떠이닌 (Tay Ninh)", "빈프억 (Binh Phuoc)", "롱안 (Long An)",
    "동탑 (Dong Thap)", "빈롱 (Vinh Long)", "짜빈 (Tra Vinh)", "허우장 (Hau Giang)", 
    "속짱 (Soc Trang)", "박리에우 (Bac Lieu)", "까마우 (Ca Mau)"
  ],
  "섬": [
    "푸꾸옥 (Phu Quoc)", "콘다오 (Con Dao)", "남유 (Nam Du)", "리선 (Ly Son)", "푸꾸이 (Phu Quy)"
  ]
} as const;

export type RegionKey = keyof typeof VIETNAM_REGIONS;

export function getAllCities(): string[] {
  return Object.values(VIETNAM_REGIONS).flat();
}
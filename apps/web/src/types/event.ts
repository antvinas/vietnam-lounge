export interface Event {
  id: string;
  name: string;        // 목록이나 상세 화면에서 제목으로 사용 (기존 title 대신 name으로 통일)
  description: string;
  imageUrl: string;
  date: string;        // YYYY-MM-DD 형식
  endDate?: string;    // [추가] multi-day / upcoming 필터용 (YYYY-MM-DD)
  location: string;    // 구체적인 장소 (예: My Dinh Stadium)
  city?: string;       // [추가됨] 필터링을 위한 도시 정보 (예: Hanoi) - 선택적(?), 필수 아님
  category: string;
  organizer: string;
  gallery?: string[];
}
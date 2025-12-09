export type TemplateId =
  | "phuquoc-3n4d"
  | "phuquoc-2n3d"
  | "hanoi-2n3d"
  | "danang-3n4d";

export type TransportMode = "walk" | "car" | "transit" | "bike";

export type ItemSeed = {
  id?: string;                          // 옵션(미지정 시 자동 부여)
  kind: "spot" | "meal" | "activity";
  name: string;
  note?: string;
  location: { lat: number; lng: number };
  // 분 단위. 예: 9시 = 9*60 = 540
  timeStartMin?: number;
  timeEndMin?: number;
  // 영업시간(경고용)
  openMin?: number;
  closeMin?: number;
  costVnd?: number;
  modeHint?: TransportMode;             // 다음 지점까지 권장 모드(없으면 템플릿 default)
};

export type DaySeed = {
  label?: string;                       // 예: "북부 투어"
  items: ItemSeed[];                    // 시간 순서대로 나열
};

export type TemplateMeta = {
  id: TemplateId;
  city: "Phu Quoc" | "Hanoi" | "Da Nang";
  title: string;                        // 예: "푸꾸옥 3박4일 샘플"
  nights: number;                       // 3박4일 → 3
  defaultMode: TransportMode;           // 기본 이동수단
  currency: "VND";                      // 현 단계 한국인 대상 고정
  plannedBudgetVnd: number;             // 대략 비용(칩에 즉시 표시)
  summary: string;                      // 한 줄 요약 카피
};

export type PlanTemplate = {
  meta: TemplateMeta;
  base?: { name: string; location: { lat: number; lng: number } }; // 숙소
  days: DaySeed[];                      // nights + 1 길이 권장
};

// 제너레이터 옵션
export type SampleGenOptions = {
  startDate?: string;                   // ISO(YYYY-MM-DD). 미지정 시 today+7 또는 nextWeekend
  nights?: number;                      // 템플릿 덮어쓰기
  currency?: "VND";
};

// 스토어 커밋용 구조체
export type GeneratedPlan = {
  trip: any;
  days: any[];
  items: any[];
  links: any[];
};

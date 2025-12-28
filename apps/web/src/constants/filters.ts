// apps/web/src/constants/filters.ts

export type RegionType = "north" | "central" | "south" | "island";

export interface PopularLocation {
  id: string;
  name: string;
  name_en: string;
  region: RegionType;
  type: "city" | "spot" | "province";
}

// 80/20 법칙: 주요 관광지 리스트 (관리자 폼 Select 옵션으로 사용)
export const POPULAR_LOCATIONS: PopularLocation[] = [
  // [북부]
  { id: "hanoi", name: "하노이", name_en: "Hanoi", region: "north", type: "city" },
  { id: "halongbay", name: "하롱베이", name_en: "Halong Bay", region: "north", type: "spot" },
  { id: "sapa", name: "사파", name_en: "Sapa", region: "north", type: "spot" },
  { id: "ninhbinh", name: "닌빈", name_en: "Ninh Binh", region: "north", type: "province" },
  { id: "haiphong", name: "하이퐁", name_en: "Hai Phong", region: "north", type: "city" },
  { id: "hagiang", name: "하장", name_en: "Ha Giang", region: "north", type: "province" },

  // [중부]
  { id: "danang", name: "다낭", name_en: "Da Nang", region: "central", type: "city" },
  { id: "hoian", name: "호이안", name_en: "Hoi An", region: "central", type: "city" },
  { id: "nhatrang", name: "나트랑", name_en: "Nha Trang", region: "central", type: "city" },
  { id: "dalat", name: "달랏", name_en: "Da Lat", region: "central", type: "city" },
  { id: "hue", name: "후에", name_en: "Hue", region: "central", type: "city" },

  // [남부]
  { id: "hcmc", name: "호치민", name_en: "Ho Chi Minh", region: "south", type: "city" },
  { id: "muine", name: "무이네", name_en: "Mui Ne", region: "south", type: "spot" },
  { id: "vungtau", name: "붕따우", name_en: "Vung Tau", region: "south", type: "city" },
  { id: "cantho", name: "껀터", name_en: "Can Tho", region: "south", type: "city" },

  // [섬]
  { id: "phuquoc", name: "푸꾸옥", name_en: "Phu Quoc", region: "island", type: "spot" },
  { id: "condao", name: "콘다오", name_en: "Con Dao", region: "island", type: "spot" },
  { id: "lyson", name: "리선", name_en: "Ly Son", region: "island", type: "spot" },
  { id: "phuquy", name: "푸꾸이", name_en: "Phu Quy", region: "island", type: "spot" },
];

// --------------------------------------------
// ✅ Spot Category (단일 소스)
// --------------------------------------------

export type SpotMode = "explorer" | "nightlife";

// ✅ 저장값은 "라벨(한국어)"로 통일
export const SPOT_CATEGORIES: Record<SpotMode, string[]> = {
  explorer: ["맛집", "카페", "관광지", "쇼핑", "스파/마사지", "액티비티", "호텔/리조트"],
  nightlife: ["클럽", "바/펍", "라운지", "가라오케", "이벤트", "심야식당"],
};

// ✅ 사용자 화면 칩(탭)용: "전체" 포함 (관리자/유저 동일 기준 유지)
export const SPOT_CATEGORY_CHIPS: Record<SpotMode, string[]> = {
  explorer: ["전체", ...SPOT_CATEGORIES.explorer],
  nightlife: ["전체", ...SPOT_CATEGORIES.nightlife],
};

// --------------------------------------------
// ✅ Price Level (필터 전용: 0~4) 단일 소스
// --------------------------------------------

export type PriceLevel = 0 | 1 | 2 | 3 | 4;

export const PRICE_LEVEL_LABELS: Record<PriceLevel, string> = {
  0: "무료",
  1: "저렴",
  2: "보통",
  3: "비쌈",
  4: "매우 비쌈",
};

export const PRICE_LEVEL_OPTIONS: Array<{ value: PriceLevel; label: string; hint?: string }> = [
  { value: 0, label: "무료", hint: "Free" },
  { value: 1, label: "저렴", hint: "Inexpensive" },
  { value: 2, label: "보통", hint: "Moderate" },
  { value: 3, label: "비쌈", hint: "Expensive" },
  { value: 4, label: "매우 비쌈", hint: "Very Expensive" },
];

export function isPriceLevel(v: unknown): v is PriceLevel {
  const n = Number(v);
  return Number.isFinite(n) && [0, 1, 2, 3, 4].includes(Math.trunc(n));
}

// --------------------------------------------
// ✅ Budget Unit (표시용 예산) 단일 소스
// --------------------------------------------

export type BudgetUnit =
  | "ticket" // 입장권/입장료
  | "per_person" // 1인 기준
  | "per_person_avg" // 1인 평균
  | "per_night" // 1박 기준
  | "minimum_spend" // 최소소비/최소주문
  | "cover_charge"; // 커버차지/입장료(클럽 등)

export const BUDGET_UNITS: Array<{
  value: BudgetUnit;
  label: string;
  example?: string;
}> = [
  { value: "ticket", label: "입장권", example: "₫50,000 · 입장권" },
  { value: "per_person", label: "1인 기준", example: "₫350,000 · 1인" },
  { value: "per_person_avg", label: "1인 평균", example: "₫180,000 · 1인 평균" },
  { value: "per_night", label: "1박", example: "₫1,800,000 · 1박" },
  { value: "minimum_spend", label: "최소소비", example: "₫2,000,000 · 최소소비" },
  { value: "cover_charge", label: "커버차지", example: "₫200,000 · 커버차지" },
];

const BUDGET_UNIT_LABELS: Record<string, string> = Object.fromEntries(
  BUDGET_UNITS.map((u) => [u.value, u.label])
);

export function getBudgetUnitLabel(unit: unknown): string {
  const u = String(unit ?? "").trim();
  if (!u) return "";
  return BUDGET_UNIT_LABELS[u] ?? u;
}

// --------------------------------------------
// ✅ Category -> BudgetUnit 추천 매핑 (단일 소스)
// --------------------------------------------

export const CATEGORY_TO_BUDGET_UNIT: Record<SpotMode, Record<string, BudgetUnit>> = {
  explorer: {
    맛집: "per_person_avg",
    카페: "per_person_avg",
    관광지: "ticket",
    쇼핑: "per_person_avg",
    "스파/마사지": "per_person",
    액티비티: "per_person",
    "호텔/리조트": "per_night",
  },
  nightlife: {
    클럽: "cover_charge",
    "바/펍": "per_person_avg",
    라운지: "minimum_spend",
    가라오케: "minimum_spend",
    이벤트: "ticket",
    심야식당: "per_person_avg",
  },
};

export function getDefaultBudgetUnit(mode: SpotMode, category: unknown): BudgetUnit {
  const normalized = normalizeSpotCategory(mode, category);
  if (!normalized) return "per_person_avg";
  return CATEGORY_TO_BUDGET_UNIT[mode]?.[normalized] ?? "per_person_avg";
}

// --------------------------------------------
// ✅ Category 정규화 (legacy alias 흡수)
// --------------------------------------------

const CATEGORY_ALIAS: Record<string, string> = {
  // explorer (legacy code -> ko)
  restaurant: "맛집",
  food: "맛집",
  cafe: "카페",
  attraction: "관광지",
  sightseeing: "관광지",
  shopping: "쇼핑",
  spa: "스파/마사지",
  massage: "스파/마사지",
  activity: "액티비티",
  hotel: "호텔/리조트",
  resort: "호텔/리조트",

  // nightlife (legacy code -> ko)
  club: "클럽",
  bar: "바/펍",
  pub: "바/펍",
  lounge: "라운지",
  karaoke: "가라오케",
  event: "이벤트",
  restaurant_late: "심야식당",
  latefood: "심야식당",
};

export function normalizeSpotCategory(mode: SpotMode, category: unknown): string {
  const raw = String(category ?? "").trim();
  if (!raw) return "";

  if (raw === "전체" || raw.toUpperCase() === "ALL") return "";

  if (SPOT_CATEGORIES[mode].includes(raw)) return raw;

  const lower = raw.toLowerCase();
  const aliased = CATEGORY_ALIAS[lower];
  if (aliased && SPOT_CATEGORIES[mode].includes(aliased)) return aliased;

  const anyMode = (Object.keys(SPOT_CATEGORIES) as SpotMode[]).find((m) => SPOT_CATEGORIES[m].includes(raw));
  if (anyMode) return raw;

  return raw;
}

// --------------------------------------------
// ✅ “보이는 값” 규칙 (표시용) — 단일 소스
// --------------------------------------------

export function formatVnd(amount: number): string {
  try {
    return `₫${new Intl.NumberFormat("vi-VN").format(amount)}`;
  } catch {
    return `₫${amount}`;
  }
}

export type SpotPriceDisplay = {
  /** 카드/상세 상단에 바로 노출할 메인 문구 */
  primary: string;
  /** 추가 설명(선택): budgetText 등 */
  secondary?: string;
  /** 어떤 타입으로 표시되었는지 */
  source: "budget" | "priceLevel" | "none";
};

/**
 * ✅ 예산(budget+unit) 우선 → 없으면 priceLevel 라벨 fallback
 * - SpotCard/SpotDetail/Slider/Related 등 어디서든 이 함수 하나로 통일 가능
 */
export function getSpotPriceDisplay(spot: any): SpotPriceDisplay {
  const budgetNum =
    typeof spot?.budget === "number" && Number.isFinite(spot.budget) ? (spot.budget as number) : null;
  const unitLabel = getBudgetUnitLabel(spot?.budgetUnit);
  const budgetText = String(spot?.budgetText ?? "").trim();

  if (budgetNum !== null && unitLabel) {
    return {
      primary: `${formatVnd(budgetNum)} · ${unitLabel}`,
      secondary: budgetText || "",
      source: "budget",
    };
  }

  const plRaw = spot?.priceLevel;
  if (isPriceLevel(plRaw)) {
    const label = PRICE_LEVEL_LABELS[Math.trunc(plRaw) as PriceLevel];
    return { primary: `가격대 · ${label}`, source: "priceLevel" };
  }

  return { primary: "", source: "none" };
}

// --------------------------------------------
// ✅ Spot 썸네일 추출 규칙(프론트 공통)
// --------------------------------------------

export function getSpotThumbnailUrl(spot: any): string | null {
  if (!spot) return null;

  const direct =
    (typeof spot.thumbnailUrl === "string" && spot.thumbnailUrl) ||
    (typeof spot.heroImage === "string" && spot.heroImage) ||
    (typeof spot.imageUrl === "string" && spot.imageUrl) ||
    (typeof spot.image === "string" && spot.image) ||
    null;
  if (direct) return String(direct);

  const images = spot.images;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string" && first) return first;
    if (first && typeof first === "object" && typeof first.url === "string" && first.url) return first.url;
  }

  const imageUrls = spot.imageUrls;
  if (Array.isArray(imageUrls) && imageUrls[0]) return String(imageUrls[0]);

  const gallery = spot.gallery;
  if (Array.isArray(gallery) && gallery[0]) return String(gallery[0]);

  return null;
}

export const REGION_TABS: { id: RegionType | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "north", label: "북부" },
  { id: "central", label: "중부" },
  { id: "south", label: "남부" },
  { id: "island", label: "섬" },
];

export const filterOptions = {
  sort: [
    { value: "popular", label: "인기순" },
    { value: "rating", label: "평점순" },
    { value: "newest", label: "최신순" },
  ],
};

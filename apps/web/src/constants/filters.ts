// apps/web/src/constants/filters.ts
// 공용 필터/지역 상수. UI 컴포넌트에서 교차 의존 없이 import해 사용한다.

export type SelectOption = {
  value: string;
  label: string;
};

export const regionOptions: SelectOption[] = [
  { value: "hanoi", label: "Hà Nội" },
  { value: "hcmc", label: "TP. Hồ Chí Minh" },
  { value: "danang", label: "Đà Nẵng" },
  { value: "hoian", label: "Hội An" },
  { value: "dalat", label: "Đà Lạt" },
  { value: "halong", label: "Hạ Long" },
  { value: "sapa", label: "Sa Pa" },
  { value: "ninhbinh", label: "Ninh Bình" },
];

export type FilterGroups = {
  sort: SelectOption[];
  price: SelectOption[];
  tags: SelectOption[];
};

export const filterOptions: FilterGroups = {
  sort: [
    { value: "popular", label: "인기순" },
    { value: "rating", label: "평점순" },
    { value: "newest", label: "최신순" },
    { value: "nearby", label: "가까운순" },
  ],
  price: [
    { value: "budget", label: "저가" },
    { value: "mid", label: "중간" },
    { value: "premium", label: "고가" },
  ],
  tags: [
    { value: "family", label: "패밀리" },
    { value: "nightlife", label: "나이트라이프" },
    { value: "food", label: "미식" },
    { value: "scenic", label: "경치" },
    { value: "history", label: "역사" },
  ],
};

// 기본값 헬퍼
export const getDefaultFilters = () => ({
  region: null as string | null,
  sort: "popular",
  price: null as string | null,
  tags: [] as string[],
});

export type FiltersState = ReturnType<typeof getDefaultFilters>;

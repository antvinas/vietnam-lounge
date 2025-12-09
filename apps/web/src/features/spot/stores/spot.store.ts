import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Spot } from "@/types/spot";

/** 한글 라벨 ↔ API 키 매핑 */
const REGION_MAP: Record<string, string> = {
  "북부": "north",
  "중부": "central",
  "남부": "south",
  "전체": "all",
};

const CITY_MAP: Record<string, string> = {
  // 북부
  "하노이": "Hanoi",
  "하이퐁": "Haiphong",
  "닌빈": "Ninh Binh",
  // 중부
  "다낭": "Da Nang",
  "호이안": "Hoi An",
  "후에": "Hue",
  // 남부
  "호치민": "Ho Chi Minh City",
  "나트랑": "Nha Trang",
  "푸꾸옥": "Phu Quoc",
  // 전체
  "전체": "all",
};

export const toApiRegion = (label: string) => REGION_MAP[label] ?? label;
export const toApiCity = (label: string) => CITY_MAP[label] ?? label;
export const toApiCategory = (label: string) => (label === "전체" ? "all" : label);

interface SpotStore {
  spots: Spot[];
  selectedSpotId: string | null;
  hoveredSpotId: string | null;

  region: string;     // 한글 라벨
  city: string;       // 한글 라벨
  category: string;   // 한글 라벨
  page: number;

  // 추가 필터
  amenitiesFilter: string[];

  setSpots: (spots: Spot[]) => void;
  setSelectedSpotId: (id: string | null) => void;
  setHoveredSpotId: (id: string | null) => void;
  setRegion: (region: string) => void;
  setCity: (city: string) => void;
  setCategory: (category: string) => void;
  setPage: (page: number) => void;
  setAmenitiesFilter: (list: string[]) => void;

  clearFilters: () => void;
  clearAll: () => void;

  /** API 쿼리용 정규화 키 반환 */
  selectQueryFilters: () => { region: string; city: string; category: string };
}

const useSpotStore = create<SpotStore>()(
  persist(
    (set, get) => ({
      spots: [],
      selectedSpotId: null,
      hoveredSpotId: null,

      region: "북부",
      city: "전체",
      category: "전체",
      page: 1,

      amenitiesFilter: [],

      setSpots: (spots) => set({ spots }),
      setSelectedSpotId: (id) => set({ selectedSpotId: id }),
      setHoveredSpotId: (id) => set({ hoveredSpotId: id }),
      setRegion: (region) => set({ region }),
      setCity: (city) => set({ city }),
      setCategory: (category) => set({ category }),
      setPage: (page) => set({ page }),
      setAmenitiesFilter: (list) => set({ amenitiesFilter: list }),

      clearFilters: () =>
        set({
          region: "북부",
          city: "전체",
          category: "전체",
          page: 1,
          amenitiesFilter: [],
        }),

      clearAll: () =>
        set({
          spots: [],
          selectedSpotId: null,
          hoveredSpotId: null,
          region: "북부",
          city: "전체",
          category: "전체",
          page: 1,
          amenitiesFilter: [],
        }),

      selectQueryFilters: () => {
        const s = get();
        return {
          region: toApiRegion(s.region),
          city: toApiCity(s.city),
          category: toApiCategory(s.category),
        };
      },
    }),
    { name: "spot-store" }
  )
);

export default useSpotStore;

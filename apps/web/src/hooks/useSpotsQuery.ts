// src/hooks/useSpotsQuery.ts

import { useQuery } from "@tanstack/react-query";
import {
  fetchSpots,
  searchSpotsByText,
} from "@/api/spots.api";
import type { Spot } from "@/types/spot";

/**
 * useSpotsQuery — React Query 기반 Spot 데이터 훅
 * Explorer / Nightlife 모드 분기 + 필터 기반 캐싱 지원
 */
export const useSpotsQuery = (
  mode: "explorer" | "nightlife" = "explorer",
  filters?: {
    region?: string;
    city?: string;
    category?: string;
    theme?: string;
    page?: number;
  }
) => {
  return useQuery<Spot[]>({
    queryKey: ["spots", mode, filters],
    queryFn: () => fetchSpots(mode, filters),
    staleTime: 1000 * 60 * 5, // 5분 캐싱
    gcTime: 1000 * 60 * 10, // 10분 가비지콜렉션
  });
};

/**
 * useSpotSearchQuery — 텍스트 검색용 훅
 * Plan에서 쓰지 않아도 되고, 나중에 Explorer 검색에도 재사용 가능
 */
export const useSpotSearchQuery = (
  mode: "explorer" | "nightlife" = "explorer",
  queryText: string,
  filters?: {
    region?: string;
    city?: string;
    category?: string;
  }
) => {
  return useQuery<Spot[]>({
    queryKey: [
      "spots",
      "search",
      mode,
      queryText,
      filters,
    ],
    queryFn: () =>
      queryText.trim()
        ? searchSpotsByText(
            mode,
            queryText,
            filters
          )
        : Promise.resolve([]),
    enabled: !!queryText.trim(),
    staleTime: 1000 * 60 * 1, // 검색 결과는 1분 정도만 캐싱
    gcTime: 1000 * 60 * 5,
  });
};

export default useSpotsQuery;

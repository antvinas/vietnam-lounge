// src/features/spot/hooks/useSpotsQuery.ts

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  fetchSpots,
  searchSpotsByText,
} from "@/api/spots.api";
import type { Spot } from "@/types/spot";

/**
 * useSpotsQuery — React Query 기반 Spot 데이터 훅
 */
export const useSpotsQuery = (
  mode: "explorer" | "nightlife" = "explorer",
  filters?: any
) => {
  const queryInfo = useQuery<Spot[]>({
    queryKey: ["spots", mode, filters],
    queryFn: async () => {
      const response = await fetchSpots({ mode, ...filters });
      // API 응답이 { items: Spot[] } 형태일 수 있으므로 배열로 변환 보장
      if ('items' in response && Array.isArray(response.items)) {
        return response.items as Spot[];
      }
      if (Array.isArray(response)) {
        return response as Spot[];
      }
      return [];
    },
    staleTime: 1000 * 60 * 5, 
  });

  return {
    ...queryInfo,
    // ✅ [필수 수정] spots를 항상 배열로 보장하여 .filter() 오류 방지
    spots: Array.isArray(queryInfo.data) ? queryInfo.data : [], 
  };
};

export const useSpotSearchQuery = (
  mode: "explorer" | "nightlife" = "explorer",
  queryText: string
) => {
  return useQuery<Spot[]>({
    queryKey: ["spots-search", mode, queryText],
    queryFn: () => searchSpotsByText(mode, queryText),
    enabled: !!queryText, 
    staleTime: 1000 * 60 * 1,
  });
};
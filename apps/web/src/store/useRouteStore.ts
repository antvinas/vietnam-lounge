// src/store/useRouteStore.ts
import { create } from "zustand";

/**
 * 경로 요약 타입
 * - id: 칩 구분용 식별자
 * - etaText: 예상 소요 시간 텍스트(예: "1시간 20분")
 * - distanceText: 거리 텍스트(예: "12.4km")
 * - transfers: 환승 횟수 등 추가 요약 수치
 * - fareText: 요금 텍스트(예: "₫120,000")
 */
export type RouteSummary = {
  id: string;
  etaText?: string;
  distanceText?: string;
  transfers?: number;
  fareText?: string;
};

/**
 * 출발/도착 포인트
 * - DualPlaceSearch, SearchDock 등에서 공유
 */
export type PlacePick = {
  placeId?: string;
  label: string;
  location: { lat: number; lng: number };
};

type RouteState = {
  /** 요약 칩 목록 — 반드시 배열 초기값 보장 */
  summaries: RouteSummary[];

  /** 전체 교체(set) — 잘못된 값이 들어와도 배열로 강제 */
  setSummaries: (list: RouteSummary[] | undefined | null) => void;

  /** 한 건 추가(옵션) */
  pushSummary: (s: RouteSummary) => void;

  /** 특정 id 업데이트(옵션) */
  updateSummary: (id: string, patch: Partial<RouteSummary>) => void;

  /** 초기화 */
  reset: () => void;

  /** 출발/도착 지점 (경로 모드) */
  start: PlacePick | null;
  end: PlacePick | null;
  setStart: (p: PlacePick | null) => void;
  setEnd: (p: PlacePick | null) => void;
  swapEnds: () => void;
};

/**
 * 경로 요약 + 출발/도착 전용 상태 저장소
 * - summaries: [] 기본값 → length 접근 안전
 * - start/end: SearchDock, DualPlaceSearch 등에서 공유
 */
export const useRouteStore = create<RouteState>((set, get) => ({
  summaries: [],

  setSummaries: (list) =>
    set({
      summaries: Array.isArray(list) ? list : [],
    }),

  pushSummary: (s) =>
    set((prev) => ({
      summaries: [...prev.summaries, s],
    })),

  updateSummary: (id, patch) =>
    set((prev) => ({
      summaries: prev.summaries.map((it) =>
        it.id === id ? { ...it, ...patch } : it
      ),
    })),

  reset: () =>
    set({
      summaries: [],
      start: null,
      end: null,
    }),

  // 출발/도착 초기값
  start: null,
  end: null,

  setStart: (p) => set({ start: p }),
  setEnd: (p) => set({ end: p }),

  swapEnds: () =>
    set((prev) => ({
      start: prev.end,
      end: prev.start,
    })),
}));

export default useRouteStore;

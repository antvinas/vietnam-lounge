// apps/web/src/store/plan.ui.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type UIState = {
  /** 현재 좌측(또는 시트)에서 보고 있는 Day */
  currentDayId: string | null;
  /** 지도 Hover 하이라이트용 임시 상태 (비영속) */
  hoverSpotId: string | null;
  /** 모바일/좁은 화면에서 Bottom Sheet 열림 여부 */
  isPlanSheetOpen: boolean;
  /** Plan Wizard 열림 여부 (모달) */
  isWizardOpen: boolean;
  /** 방금 임포트한 샘플 Trip (페이지 벗어나면 비우는 용도, 비영속) */
  lastSampleTripId: string | null;

  /** 타임라인에서 드래그 중인 아이템 id (없으면 null) */
  draggingItemId: string | null;
  /** 지도 기준 중심 (없으면 MapPanel 기본값 사용) */
  mapCenter: { lat: number; lng: number } | null;
  /** 지도 줌 레벨 (없으면 라이브러리 기본값 사용) */
  mapZoom: number | null;

  /** 현재 상세 편집 중인 타임라인 아이템 id (없으면 null) */
  selectedItemId: string | null;

  setCurrentDayId: (id: string | null) => void;
  setHoverSpotId: (id: string | null) => void;
  setPlanSheetOpen: (open: boolean) => void;

  openWizard: () => void;
  closeWizard: () => void;

  setLastSampleTripId: (id: string | null) => void;
  clearLastSampleTripId: () => void;

  setDraggingItemId: (id: string | null) => void;
  setMapCenter: (center: { lat: number; lng: number } | null) => void;
  setMapZoom: (zoom: number | null) => void;

  setSelectedItemId: (id: string | null) => void;
  clearSelection: () => void;
};

export const usePlanUIStore = create<UIState>()(
  persist(
    (set) => ({
      currentDayId: null,
      hoverSpotId: null,
      isPlanSheetOpen: false,
      isWizardOpen: false,
      lastSampleTripId: null,
      draggingItemId: null,
      mapCenter: null,
      mapZoom: null,
      selectedItemId: null,

      setCurrentDayId: (id) => set({ currentDayId: id }),
      setHoverSpotId: (id) => set({ hoverSpotId: id }),
      setPlanSheetOpen: (open) => set({ isPlanSheetOpen: open }),

      openWizard: () => set({ isWizardOpen: true }),
      closeWizard: () => set({ isWizardOpen: false }),

      setLastSampleTripId: (id) => set({ lastSampleTripId: id }),
      clearLastSampleTripId: () => set({ lastSampleTripId: null }),

      setDraggingItemId: (id) => set({ draggingItemId: id }),
      setMapCenter: (center) => set({ mapCenter: center }),
      setMapZoom: (zoom) => set({ mapZoom: zoom }),

      setSelectedItemId: (id) => set({ selectedItemId: id }),
      clearSelection: () => set({ selectedItemId: null }),
    }),
    {
      name: "plan-ui",
      storage: createJSONStorage(() => localStorage),

      /**
       * 퍼시스트에는 꼭 필요한 안정 상태만 저장 (휘발성/임시 값 제외)
       * - hoverSpotId, lastSampleTripId, isWizardOpen, selectedItemId 등은 저장하지 않음
       * - draggingItemId, mapCenter, mapZoom 도 모두 비영속으로 둔다
       */
      partialize: (s) => ({
        currentDayId: s.currentDayId,
        isPlanSheetOpen: s.isPlanSheetOpen,
      }),

      /** 상태 스키마 버전 */
      version: 3,

      migrate: (persisted: any, _fromVersion: number) => {
        if (!persisted || typeof persisted !== "object") {
          return {
            currentDayId: null,
            isPlanSheetOpen: false,
          };
        }
        return {
          currentDayId: persisted.currentDayId ?? null,
          isPlanSheetOpen: persisted.isPlanSheetOpen ?? false,
        };
      },
    }
  )
);

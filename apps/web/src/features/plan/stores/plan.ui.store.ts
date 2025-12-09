// apps/web/src/features/plan/stores/plan.ui.store.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type PlanUIState = {
  currentDayId: string | null;
  selectedItemId: string | null;
  hoverSpotId: string | null;
  editingItemId: string | null;

  isPlanSheetOpen: boolean;
  isWizardOpen: boolean;

  // 오른쪽 일정 상세 패널 열림 여부
  isItemDetailOpen: boolean;
  
  // [UX/안전] 모바일 편집 모드 상태 (기본값 false = 읽기 전용)
  isMobileEditMode: boolean;

  lastSampleTripId: string | null;

  // Google Map 인스턴스 (직렬화 불가하므로 persist에 저장 안 함)
  map: google.maps.Map | null;
};

export interface PlanUIActions {
  setCurrentDayId: (id: string | null) => void;
  setSelectedItemId: (id: string | null) => void;
  setHoverSpotId: (id: string | null) => void;
  setEditingItemId: (id: string | null) => void;
  setPlanSheetOpen: (open: boolean) => void;
  setWizardOpen: (open: boolean) => void;
  setLastSampleTripId: (id: string | null) => void;
  
  // [UX/안전] 모바일 편집 모드 토글 액션
  toggleMobileEditMode: () => void;

  // 일정 상세 패널
  openItemDetail: (id: string) => void;
  closeItemDetail: () => void;

  // 지도 컨트롤
  setMap: (map: google.maps.Map | null) => void;
  centerOnLatLng: (lat: number, lng: number) => void;

  resetUI: () => void;
}

export const usePlanUIStore = create<PlanUIState & PlanUIActions>()(
  persist(
    (set, get) => ({
      currentDayId: null,
      selectedItemId: null,
      hoverSpotId: null,
      editingItemId: null,

      isPlanSheetOpen: false,
      isWizardOpen: false,
      isItemDetailOpen: false,
      
      // 초기엔 안전하게 닫힘 (읽기 전용)
      isMobileEditMode: false,

      lastSampleTripId: null,

      map: null,

      setCurrentDayId: (id) =>
        set({
          currentDayId: id,
        }),

      setSelectedItemId: (id) =>
        set({
          selectedItemId: id,
        }),

      setHoverSpotId: (id) =>
        set({
          hoverSpotId: id,
        }),

      setEditingItemId: (id) =>
        set({
          editingItemId: id,
        }),

      setPlanSheetOpen: (open) =>
        set({
          isPlanSheetOpen: open,
        }),

      setWizardOpen: (open) =>
        set({
          isWizardOpen: open,
        }),

      setLastSampleTripId: (id) =>
        set({
          lastSampleTripId: id,
        }),
        
      // [UX/안전] 편집 모드 토글 구현
      toggleMobileEditMode: () => 
        set((state) => ({ 
          isMobileEditMode: !state.isMobileEditMode 
        })),

      // 일정 상세 패널 열기
      openItemDetail: (id) =>
        set((prev) => ({
          ...prev,
          selectedItemId: id,
          editingItemId: id,
          isItemDetailOpen: true,
        })),

      // 일정 상세 패널 닫기
      closeItemDetail: () =>
        set((prev) => ({
          ...prev,
          isItemDetailOpen: false,
          editingItemId: null,
        })),

      // Map 인스턴스 저장
      setMap: (map) =>
        set({
          map,
        }),

      // 좌표로 지도 이동 + 필요 시 줌 보정
      centerOnLatLng: (lat, lng) => {
        const map = get().map;
        if (!map) return;

        map.panTo({ lat, lng });

        // 너무 멀리서 보이면 줌을 조금 올려줌
        const currentZoom =
          typeof map.getZoom === "function" ? map.getZoom() : null;
        if (currentZoom == null || currentZoom < 15) {
          if (typeof map.setZoom === "function") {
            map.setZoom(15);
          }
        }
      },

      resetUI: () => {
        set({
          currentDayId: null,
          selectedItemId: null,
          hoverSpotId: null,
          editingItemId: null,
          isPlanSheetOpen: false,
          isWizardOpen: false,
          isItemDetailOpen: false,
          isMobileEditMode: false, // 초기화 시 편집 모드도 해제
          lastSampleTripId: null,
          map: null,
        });
      },
    }),
    {
      name: "plan-ui", // 로컬스토리지 key
      storage: createJSONStorage(() => localStorage),
      // 직렬화 가능한 UI 상태만 저장 (map은 제외)
      partialize: (state) => ({
        currentDayId: state.currentDayId,
        selectedItemId: state.selectedItemId,
        hoverSpotId: state.hoverSpotId,
        editingItemId: state.editingItemId,
        isPlanSheetOpen: state.isPlanSheetOpen,
        isWizardOpen: state.isWizardOpen,
        isItemDetailOpen: state.isItemDetailOpen,
        lastSampleTripId: state.lastSampleTripId,
        // isMobileEditMode는 저장하지 않음 (항상 안전 모드로 시작)
      }),
      migrate: (persisted) => {
        if (!persisted || typeof persisted !== "object") {
          return {
            currentDayId: null,
            selectedItemId: null,
            hoverSpotId: null,
            editingItemId: null,
            isPlanSheetOpen: false,
            isWizardOpen: false,
            isItemDetailOpen: false,
            isMobileEditMode: false,
            lastSampleTripId: null,
            map: null,
          };
        }
        const p = persisted as any;
        return {
          currentDayId: p.currentDayId ?? null,
          selectedItemId: p.selectedItemId ?? null,
          hoverSpotId: p.hoverSpotId ?? null,
          editingItemId: p.editingItemId ?? null,
          isPlanSheetOpen: p.isPlanSheetOpen ?? false,
          isWizardOpen: p.isWizardOpen ?? false,
          isItemDetailOpen: p.isItemDetailOpen ?? false,
          isMobileEditMode: false, // 마이그레이션 시에도 기본 false
          lastSampleTripId: p.lastSampleTripId ?? null,
          map: null,
        };
      },
    },
  ),
);
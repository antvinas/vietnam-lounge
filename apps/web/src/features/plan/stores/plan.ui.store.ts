// apps/web/src/features/plan/stores/plan.ui.store.ts

import { create } from "zustand";
import type { Locale } from "./locales/strings";

export interface PlanUIState {
  isSidebarOpen: boolean;
  selectedDayId: string | null;
  currentDayId: string | null;

  selectedItemId: string | null;
  hoverSpotId: string | null;
  editingItemId: string | null;

  isMapFullscreen: boolean;
  activeTab: "schedule" | "search" | "budget";

  /** 현재 언어 */
  locale: Locale;

  isPlanSheetOpen: boolean;
  isWizardOpen: boolean;
  isItemDetailOpen: boolean;
  isMobileEditMode: boolean;

  lastSampleTripId: string | null;

  map: google.maps.Map | null;
}

export interface PlanUIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  setSelectedDayId: (dayId: string | null) => void;
  setCurrentDayId: (dayId: string | null) => void;

  setSelectedItemId: (itemId: string | null) => void;
  setHoverSpotId: (id: string | null) => void;
  setEditingItemId: (id: string | null) => void;

  setMapFullscreen: (full: boolean) => void;
  setActiveTab: (tab: "schedule" | "search" | "budget") => void;
  setLocale: (locale: Locale) => void;

  setPlanSheetOpen: (open: boolean) => void;

  setWizardOpen: (open: boolean) => void;
  closeWizard: () => void;

  setItemDetailOpen: (open: boolean) => void;
  closeItemDetail: () => void;

  setMobileEditMode: (edit: boolean) => void;

  setLastSampleTripId: (id: string | null) => void;

  /** canonical */
  setMapInstance: (map: google.maps.Map | null) => void;

  /** backward-compat (MapPanel이 setMap을 기대함) */
  setMap: (map: google.maps.Map | null) => void;

  reset: () => void;
  resetUI: () => void;
}

const initialState: PlanUIState = {
  isSidebarOpen: true,
  selectedDayId: null,
  currentDayId: null,
  selectedItemId: null,
  hoverSpotId: null,
  editingItemId: null,
  isMapFullscreen: false,
  activeTab: "schedule",
  locale: "ko",
  isPlanSheetOpen: false,
  isWizardOpen: false,
  isItemDetailOpen: false,
  isMobileEditMode: false,
  lastSampleTripId: null,
  map: null,
};

export const usePlanUIStore = create<PlanUIState & PlanUIActions>((set) => ({
  ...initialState,

  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  setSelectedDayId: (id) => set({ selectedDayId: id }),
  setCurrentDayId: (id) => set({ currentDayId: id }),

  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setHoverSpotId: (id) => set({ hoverSpotId: id }),
  setEditingItemId: (id) => set({ editingItemId: id }),

  setMapFullscreen: (f) => set({ isMapFullscreen: f }),
  setActiveTab: (t) => set({ activeTab: t }),
  setLocale: (locale) => set({ locale }),

  setPlanSheetOpen: (o) => set({ isPlanSheetOpen: o }),

  setWizardOpen: (o) => set({ isWizardOpen: o }),
  closeWizard: () => set({ isWizardOpen: false }),

  setItemDetailOpen: (o) => set({ isItemDetailOpen: o }),
  closeItemDetail: () => set({ isItemDetailOpen: false }),

  setMobileEditMode: (e) => set({ isMobileEditMode: e }),

  setLastSampleTripId: (id) => set({ lastSampleTripId: id }),

  setMapInstance: (map) => set({ map }),
  setMap: (map) => set({ map }), // ✅ MapPanel 호환

  reset: () => set(initialState),
  resetUI: () => set(initialState),
}));

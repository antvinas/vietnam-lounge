import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface UiState {
  contentMode: "explorer" | "nightlife"; // 모드 (여행/나이트)
  themeMode: "light" | "dark"; // 테마
  isGatePassed: boolean; // 성인 게이트 통과 여부

  // Spot 페이지 관련
  region: string;
  category: string;

  // 공통 UI 상태
  isSidebarOpen: boolean;
  isLoading: boolean;
  notification: string | null;

  // actions
  setContentMode: (mode: "explorer" | "nightlife") => void;
  toggleContentMode: () => void;

  setThemeMode: (mode: "light" | "dark") => void;
  toggleThemeMode: () => void;

  passGate: () => void;
  resetUi: () => void;

  setRegion: (region: string) => void;
  setCategory: (category: string) => void;

  setSidebarOpen: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  setNotification: (msg: string | null) => void;
}

const useUiStore = create<UiState>()(
  devtools(
    persist(
      (set, get) => ({
        contentMode: "explorer",
        themeMode: "light",
        isGatePassed: false,

        region: "all",
        category: "all",

        isSidebarOpen: false,
        isLoading: false,
        notification: null,

        setContentMode: (mode) => set({ contentMode: mode }),
        toggleContentMode: () =>
          set({ contentMode: get().contentMode === "explorer" ? "nightlife" : "explorer" }),

        setThemeMode: (mode) => set({ themeMode: mode }),
        toggleThemeMode: () => set({ themeMode: get().themeMode === "light" ? "dark" : "light" }),

        passGate: () => set({ isGatePassed: true }),
        resetUi: () =>
          set({
            contentMode: "explorer",
            themeMode: "light",
            isGatePassed: false,
            region: "all",
            category: "all",
            isSidebarOpen: false,
            isLoading: false,
            notification: null,
          }),

        setRegion: (region) => set({ region }),
        setCategory: (category) => set({ category }),

        setSidebarOpen: (v) => set({ isSidebarOpen: v }),
        setLoading: (v) => set({ isLoading: v }),
        setNotification: (msg) => set({ notification: msg }),
      }),
      { name: "ui-storage" }
    ),
    { name: "UiStore" }
  )
);

export default useUiStore;

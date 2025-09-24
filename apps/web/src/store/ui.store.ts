import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface UiState {
  contentMode: "explorer" | "nightlife";
  themeMode: "light" | "dark";
  isGatePassed: boolean;

  // 🔹 Spot 페이지 관련 추가 상태
  region: string;
  category: string;

  setContentMode: (mode: "explorer" | "nightlife") => void;
  setThemeMode: (mode: "light" | "dark") => void;
  toggleContentMode: () => void;
  toggleThemeMode: () => void;
  passGate: () => void;
  resetUi: () => void;

  // 🔹 Spot 페이지 상태 setter
  setRegion: (region: string) => void;
  setCategory: (category: string) => void;
}

const useUiStore = create<UiState>()(
  devtools(
    persist(
      (set, get) => ({
        contentMode: "explorer",
        themeMode: "light",
        isGatePassed: false,

        // 🔹 Spot 기본값
        region: "all",
        category: "all",

        setContentMode: (mode) => set({ contentMode: mode }),
        setThemeMode: (mode) => set({ themeMode: mode }),
        toggleContentMode: () =>
          set({
            contentMode:
              get().contentMode === "explorer" ? "nightlife" : "explorer",
          }),
        toggleThemeMode: () =>
          set({ themeMode: get().themeMode === "light" ? "dark" : "light" }),
        passGate: () => set({ isGatePassed: true }),
        resetUi: () =>
          set({
            contentMode: "explorer",
            themeMode: "light",
            isGatePassed: false,
            region: "all",
            category: "all",
          }),

        // 🔹 Spot 상태 setter
        setRegion: (region) => set({ region }),
        setCategory: (category) => set({ category }),
      }),
      {
        name: "ui-storage", // localStorage key
      }
    ),
    { name: "UiStore" }
  )
);

export default useUiStore;

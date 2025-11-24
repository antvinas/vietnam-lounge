import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  themeMode: "light" | "dark";
  contentMode: "explorer" | "nightlife";
  category: string;
  region: string | null;
  isWidgetOpen: boolean;

  setThemeMode: (mode: "light" | "dark") => void;
  setContentMode: (mode: "explorer" | "nightlife") => void;
  setCategory: (cat: string) => void;
  setRegion: (value: string | null) => void;
  setWidgetOpen: (open: boolean) => void;
}

const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      themeMode: "light",
      contentMode: "explorer",
      category: "전체",
      region: null,
      isWidgetOpen: false,

      setThemeMode: (mode) => {
        // DOM 조작 금지. App.tsx에서만 html.dark 토글
        set({ themeMode: mode });
      },

      setContentMode: (mode) => {
        if (get().isWidgetOpen) set({ isWidgetOpen: false });
        set({ contentMode: mode });
      },

      setCategory: (cat) => set({ category: cat }),
      setRegion: (value) => set({ region: value }),
      setWidgetOpen: (open) => set({ isWidgetOpen: open }),
    }),
    {
      name: "ui-storage",
      version: 3,
      partialize: (state) => ({
        themeMode: state.themeMode,
        contentMode: state.contentMode,
        category: state.category,
        region: state.region,
      }),
      onRehydrateStorage: () => () => {
        // 복원 시 DOM 직접 토글 금지
      },
    }
  )
);

export default useUiStore;

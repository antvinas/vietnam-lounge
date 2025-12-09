import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Adult Store
 * - Nightlife 진입 전 연령 확인 상태만 관리
 * - UI 테마와는 무관
 */
interface AdultState {
  isAgeVerified: boolean;
  setAgeVerified: (ok: boolean) => void;
  clear: () => void;
}

export const useStore = create<AdultState>()(
  persist(
    (set) => ({
      isAgeVerified: false,
      setAgeVerified: (ok) => set({ isAgeVerified: ok }),
      clear: () => set({ isAgeVerified: false }),
    }),
    { name: "adult-storage" }
  )
);

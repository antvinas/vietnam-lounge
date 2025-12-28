import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ModeState {
  /** 성인 게이트 통과 여부 */
  isGatePassed: boolean;
  /** Nightlife 모드 진입 여부 */
  nightlifeEntered: boolean;

  setGatePassed: (passed: boolean) => void;
  setNightlifeEntered: (entered: boolean) => void;
  resetMode: () => void;
}

const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      isGatePassed: false,
      nightlifeEntered: false,

      setGatePassed: (passed) => set({ isGatePassed: passed }),
      setNightlifeEntered: (entered) => set({ nightlifeEntered: entered }),
      resetMode: () => set({ isGatePassed: false, nightlifeEntered: false }),
    }),
    {
      name: "mode-storage",
      version: 1,
      partialize: (state) => ({
        isGatePassed: state.isGatePassed,
        nightlifeEntered: state.nightlifeEntered,
      }),
    }
  )
);

export default useModeStore;

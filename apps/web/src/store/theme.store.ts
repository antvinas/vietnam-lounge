import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ThemeState {
  mode: 'day' | 'night';
  isGatePassed: boolean;
  toggleMode: () => void;
  setMode: (mode: 'day' | 'night') => void;
  passGate: () => void;
}

const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        mode: 'day',
        isGatePassed: false,
        setMode: (mode) => set({ mode }),
        toggleMode: () => set((state) => ({ mode: state.mode === 'day' ? 'night' : 'day' })),
        passGate: () => set({ isGatePassed: true }),
      }),
      {
        name: 'theme-storage', // The name in localStorage
      }
    )
  )
);

export default useThemeStore;

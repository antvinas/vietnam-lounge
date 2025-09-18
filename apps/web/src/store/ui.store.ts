import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UiState {
  contentMode: 'explorer' | 'nightlife'
  themeMode: 'light' | 'dark'
  isGatePassed: boolean
  setContentMode: (mode: 'explorer' | 'nightlife') => void
  setThemeMode: (mode: 'light' | 'dark') => void
  passGate: () => void
}

const useUiStore = create<UiState>()(
  devtools(
    persist(
      (set) => ({
        contentMode: 'explorer',
        themeMode: 'light',
        isGatePassed: false,
        setContentMode: (mode) => set({ contentMode: mode }),
        setThemeMode: (mode) => set({ themeMode: mode }),
        passGate: () => set({ isGatePassed: true }),
      }),
      {
        name: 'ui-storage', // localStorage key
        // storage: createJSONStorage(() => localStorage), // 필요시 명시
      }
    ),
    { name: 'UiStore' } // devtools 이름
  )
)

export default useUiStore

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdultState {
  isNightlife: boolean;
  isAgeVerified: boolean;
  toggleNightlife: () => void;
  setAgeVerified: (isVerified: boolean) => void;
}

export const useStore = create<AdultState>()(
  persist(
    (set) => ({
      isNightlife: false,
      isAgeVerified: false,
      toggleNightlife: () => set((state) => ({ isNightlife: !state.isNightlife })),
      setAgeVerified: (isVerified) => set({ isAgeVerified: isVerified }),
    }),
    {
      name: 'adult-storage', // name of the item in the storage (must be unique)
    }
  )
);
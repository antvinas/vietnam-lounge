import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  token?: string;
  role?: string; // ✅ 추가
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,

      login: (user) => set({ isLoggedIn: true, user }),
      logout: () => set({ isLoggedIn: false, user: null }),
      setToken: (token) => {
        const u = get().user;
        if (u) set({ user: { ...u, token } });
      },
    }),
    { name: "auth-storage" }
  )
);

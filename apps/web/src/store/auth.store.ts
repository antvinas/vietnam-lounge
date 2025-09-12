import { create } from 'zustand';

// Define the shape of the user object
interface User {
  username: string;
  email: string;
  avatar?: string; // Optional avatar URL
}

// Define the state and actions for the auth store
interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

// Create the Zustand store
export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  login: (user) => set({ isLoggedIn: true, user }),
  logout: () => set({ isLoggedIn: false, user: null }),
}));

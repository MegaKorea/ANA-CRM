import { create } from 'zustand';
import type { CurrentUser } from '@/lib/services/auth.service';

interface UserState {
  user: CurrentUser | null;
  isLoading: boolean;
  setUser: (user: CurrentUser | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user: CurrentUser | null) => set({ user }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  clearUser: () => set({ user: null }),
}));

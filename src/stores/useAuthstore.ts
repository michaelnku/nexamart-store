import { create } from "zustand";

export type SafeUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "SELLER" | "RIDER" | "ADMIN" | "MODERATOR";
  image?: string | null;
};

type AuthState = {
  user: SafeUser | null;
  isAuthenticated: boolean;
  setUser: (user: SafeUser | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}));

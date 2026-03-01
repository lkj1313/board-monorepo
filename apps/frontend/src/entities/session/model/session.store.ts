import { create } from 'zustand';
import type { SessionUser } from './session.types';

type SessionState = {
  user: SessionUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (params: { user: SessionUser; accessToken: string }) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setSession: ({ user, accessToken }) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
    }),
  setAccessToken: (accessToken) =>
    set((state) => ({
      ...state,
      accessToken,
      isAuthenticated: Boolean(state.user),
    })),
  clearSession: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    }),
}));

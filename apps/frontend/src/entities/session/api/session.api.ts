import {
  AuthResponse,
  LoginRequest,
  SignupRequest,
} from '@reservation/shared-types';
import { createApiFetcher } from '@/shared/api/base';
import { useSessionStore } from '@/entities/session/model/session.store';
import type { SessionUser } from '@/entities/session/model/session.types';

type MeResponse = SessionUser & {
  createdAt: string;
  updatedAt: string;
};

const apiFetch = createApiFetcher({
  getAccessToken: () => useSessionStore.getState().accessToken,
  setAccessToken: (token) => {
    if (!token) {
      return;
    }
    useSessionStore.getState().setAccessToken(token);
  },
  clearAuth: () => useSessionStore.getState().clearSession(),
});

export const sessionApi = {
  signup: (input: SignupRequest) =>
    apiFetch<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: input,
      auth: false,
    }),
  login: (input: LoginRequest) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: input,
      auth: false,
    }),
  refresh: () =>
    apiFetch<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      auth: false,
    }),
  me: () =>
    apiFetch<MeResponse>('/auth/me', {
      method: 'GET',
      auth: true,
    }),
  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', {
      method: 'POST',
      auth: true,
    }),
};

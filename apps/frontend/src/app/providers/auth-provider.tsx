'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { sessionApi } from '@/entities/session/api/session.api';
import { useSessionStore } from '@/entities/session/model/session.store';

import { FullPageLoader } from '@/shared/ui/full-page-loader';

import { HttpError } from '@/shared/lib/http-error';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const refreshRes = await sessionApi.refresh();

        if (refreshRes.accessToken) {
          const user = await sessionApi.me();
          setSession({ user, accessToken: refreshRes.accessToken });
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
        clearSession();

        // 401 Unauthorized 에러는 로그인이 안 된 정상 상태이므로 무시합니다.
        const isUnauthorized = err instanceof HttpError && err.status === 401;

        if (!isUnauthorized) {
          setError(err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [setSession, clearSession]);

  if (error) {
    throw error;
  }

  if (isLoading) {
    return <FullPageLoader text="로그인 정보를 확인 중입니다..." />;
  }

  return <>{children}</>;
}

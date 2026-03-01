'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { sessionApi } from '@/entities/session/api/session.api';
import { useSessionStore } from '@/entities/session/model/session.store';

import { FullPageLoader } from '@/shared/ui/full-page-loader';

import { HttpError } from '@/shared/lib/http-error';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);

  useEffect(() => {
    const publicPaths = ['/login', '/signup'];
    const isPublicPath = publicPaths.includes(pathname);

    const initAuth = async () => {
      try {
        const refreshRes = await sessionApi.refresh();

        if (refreshRes.accessToken) {
          const user = await sessionApi.me();
          setSession({ user, accessToken: refreshRes.accessToken });

          // 로그인이 된 상태에서 로그인/회원가입 페이지에 접근하면 메인으로 리다이렉트
          if (isPublicPath) {
            router.replace('/');
          }
        } else {
          // 리프레시 토큰이 만료되었거나 없는 경우
          clearSession();
          if (!isPublicPath) {
            router.replace('/login');
          }
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
        clearSession();

        // 401 Unauthorized 등 인증 실패 시 로그인 페이지로 리다이렉트 (공개 페이지 제외)
        if (!isPublicPath) {
          router.replace('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [setSession, clearSession, pathname, router]);

  if (isLoading) {
    return <FullPageLoader text="로그인 정보를 확인 중입니다..." />;
  }

  return <>{children}</>;
}

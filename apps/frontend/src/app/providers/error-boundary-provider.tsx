'use client';

import { Button } from '@/shared/ui/button';
import type { ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';

type ErrorBoundaryProviderProps = {
  children: ReactNode;
};

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const message =
    error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">
        클라이언트 오류가 발생했습니다.
      </h1>
      <p className="text-sm text-muted-foreground">{message}</p>

      <Button type="button" variant="outline" onClick={resetErrorBoundary}>
        다시 시도
      </Button>
    </main>
  );
}

export function ErrorBoundaryProvider({
  children,
}: ErrorBoundaryProviderProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary FallbackComponent={Fallback} onReset={reset}>
      {children}
    </ErrorBoundary>
  );
}

'use client';

import { Loader } from './loader';
import { cn } from '@/shared/lib/utils';

interface FullPageLoaderProps {
  text?: string;
  className?: string;
  blur?: boolean;
}

export function FullPageLoader({
  text = '잠시만 기다려 주세요...',
  className,
  blur = true,
}: FullPageLoaderProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-background/80',
        blur && 'backdrop-blur-sm',
        className,
      )}
    >
      <Loader size="lg" text={text} />
    </div>
  );
}

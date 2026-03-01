'use client';

import Link from 'next/link';

import { useSignIn } from '@/features/auth-sign-in';
import { Button, FormField } from '@/shared/ui';
import { CardContent, CardFooter } from '@/shared/ui/card';
import { Loader } from '@/shared/ui/loader';
import { AuthCard } from '@/widgets/auth-card';

export default function LoginPage() {
  const { register, handleSubmit, errors, isPending, isValid } = useSignIn();

  return (
    <AuthCard
      title="로그인"
      description="서비스를 이용하려면 로그인해 주세요"
      footer={
        <p className="text-sm text-center text-muted-foreground mt-2">
          계정이 없으신가요?{' '}
          <Link
            href="/signup"
            className="text-primary hover:underline font-semibold"
          >
            회원가입하러 가기
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          <FormField
            id="email"
            label="이메일"
            type="email"
            placeholder="name@example.com"
            error={errors.email}
            {...register('email')}
          />
          <FormField
            id="password"
            label="비밀번호"
            type="password"
            placeholder="••••••••"
            error={errors.password}
            {...register('password')}
          />
        </CardContent>
        <CardFooter className="pt-0">
          <Button
            type="submit"
            className="w-full text-lg h-12 transition-all active:scale-95"
            disabled={!isValid || isPending}
          >
            {isPending ? <Loader className="mr-2" /> : null}
            {isPending ? '로그인 중...' : '로그인'}
          </Button>
        </CardFooter>
      </form>
    </AuthCard>
  );
}

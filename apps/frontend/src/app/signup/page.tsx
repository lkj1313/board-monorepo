'use client';

import Link from 'next/link';

import { useSignUp } from '@/features/auth-sign-up';
import { Button, CardContent, CardFooter, FormField } from '@/shared/ui';
import { Loader } from '@/shared/ui/loader';

import { AuthCard } from '@/widgets/auth-card';

export default function SignupPage() {
  const { register, handleSubmit, errors, isPending, isValid } = useSignUp();

  return (
    <AuthCard
      title="회원가입"
      description="새로운 여정을 시작하세요"
      footer={
        <p className="text-sm text-center text-muted-foreground mt-2">
          이미 계정이 있으신가요?{' '}
          <Link
            href="/login"
            className="text-primary hover:underline font-semibold"
          >
            로그인하러 가기
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          <FormField
            id="name"
            label="이름"
            placeholder="홍길동"
            error={errors.name}
            {...register('name')}
          />
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
          <FormField
            id="confirmPassword"
            label="비밀번호 확인"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </CardContent>
        <CardFooter className="pt-0">
          <Button
            type="submit"
            className="w-full text-lg h-12 transition-all active:scale-95"
            disabled={!isValid || isPending}
          >
            {isPending ? <Loader className="mr-2" /> : null}
            {isPending ? '처리 중...' : '가입하기'}
          </Button>
        </CardFooter>
      </form>
    </AuthCard>
  );
}

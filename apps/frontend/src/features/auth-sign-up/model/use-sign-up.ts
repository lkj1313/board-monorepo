import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { sessionApi } from '@/entities/session/api/session.api';
import { signupSchema, type SignupFormValues } from './signup.schema';

export function useSignUp() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
  });

  const signupMutation = useMutation({
    mutationFn: (data: SignupFormValues) =>
      sessionApi.signup({
        email: data.email,
        password: data.password,
        name: data.name,
      }),
    throwOnError: false,
    onSuccess: () => {
      toast.success('회원가입이 완료되었습니다. 로그인해 주세요!');
      router.push('/login');
    },
    onError: (err: any) => {
      console.error('Signup failed:', err);
      const message = err.message || '회원가입 중 오류가 발생했습니다.';
      setError('root', { message });
      toast.error(message);
    },
  });

  return {
    register,
    handleSubmit: handleSubmit((data) => signupMutation.mutate(data)),
    errors,
    isPending: signupMutation.isPending,
    isValid,
  };
}

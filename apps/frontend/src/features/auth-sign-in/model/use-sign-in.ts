import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { sessionApi } from '@/entities/session/api/session.api';
import { useSessionStore } from '@/entities/session/model/session.store';
import { signinSchema, type SigninFormValues } from './signin.schema';

export function useSignIn() {
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
    mode: 'onTouched',
  });

  const signinMutation = useMutation({
    mutationFn: (data: SigninFormValues) => sessionApi.login(data),
    throwOnError: false,
    onSuccess: (res) => {
      setSession({
        user: res.user,
        accessToken: res.accessToken,
      });
      toast.success('로그인에 성공했습니다. 환영합니다!');
      router.push('/');
    },
    onError: (err: any) => {
      console.error('Login failed:', err);
      const message =
        err.message ||
        '로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.';
      setError('root', { message });
      toast.error(message);
    },
  });

  return {
    register,
    handleSubmit: handleSubmit((data) => signinMutation.mutate(data)),
    errors,
    isPending: signinMutation.isPending,
    isValid,
  };
}

import { z } from 'zod';

export const signinSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});

export type SigninFormValues = z.infer<typeof signinSchema>;

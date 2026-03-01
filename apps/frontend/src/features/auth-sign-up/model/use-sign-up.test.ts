import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSignUp } from './use-sign-up';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';

// Mocking dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
}));

vi.mock('@/entities/session/api/session.api', () => ({
  sessionApi: {
    signup: vi.fn(),
  },
}));

describe('useSignUp', () => {
  const mockPush = vi.fn();
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (useMutation as any).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it('유효하지 않은 데이터를 입력하면 isValid는 false여야 한다', async () => {
    const { result } = renderHook(() => useSignUp());

    await act(async () => {
      // register()가 반환하는 onChange를 직접 호출하여 값을 시뮬레이션
      const emailField = result.current.register('email');
      await emailField.onChange({
        target: { name: 'email', value: 'invalid-email' },
        type: 'change',
      });
    });

    expect(result.current.isValid).toBe(false);
  });

  it('모든 필드가 유효할 때 handleSubmit을 호출하면 mutation.mutate가 호출되어야 한다', async () => {
    // 훅을 렌더링할 때 setValue도 가져옴
    const { result } = renderHook(() => useSignUp());

    // 1. 값 채우기 (react-hook-form 내부 상태 변경)
    // 훅 테스트에서는 setValue를 직접 쓰는 것이 가장 확실합니다.
    // 하지만 useSignUp이 setValue를 밖으로 꺼내주지 않으므로,
    // register가 반환하는 onChange를 다시 한 번 활용합니다.
    await act(async () => {
      const fields = ['name', 'email', 'password', 'confirmPassword'] as const;
      for (const field of fields) {
        const val = field === 'email' ? 'test@example.com' : 'password123';
        const { onChange } = result.current.register(field);
        await onChange({
          target: { name: field, value: field === 'name' ? '홍길동' : val },
          type: 'change',
        });
      }
    });

    // 2. 제출 실행
    await act(async () => {
      const fakeEvent = {
        preventDefault: vi.fn(),
        target: {},
      } as any;

      // handleSubmit이 반환한 함수에 우리가 정의한 onSubmit 함수가 이미 묶여 있음
      // 유효성 검사가 통과되었다면 내부적으로 mutate가 불릴 것임
      await result.current.handleSubmit(fakeEvent);
    });

    // 3. 검증
    expect(mockMutate).toHaveBeenCalled();
  });

  it('isPending 상태가 훅의 isPending으로 잘 전달되어야 한다', () => {
    (useMutation as any).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    });

    const { result } = renderHook(() => useSignUp());
    expect(result.current.isPending).toBe(true);
  });
});

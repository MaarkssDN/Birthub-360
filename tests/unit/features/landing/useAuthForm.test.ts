import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthForm } from '@/features/landing/hooks/useAuthForm';

describe('useAuthForm', () => {
  it('inicia com estado padrão', () => {
    const { result } = renderHook(() => useAuthForm());

    expect(result.current.formState).toEqual({
      email: '',
      rememberMe: true,
      isLoading: false,
      errorMessage: null,
    });
  });

  it('setEmail atualiza e-mail e limpa erro', () => {
    const { result } = renderHook(() => useAuthForm());

    act(() => {
      result.current.setEmail('a@b.com');
    });
    expect(result.current.formState.email).toBe('a@b.com');
    expect(result.current.formState.errorMessage).toBeNull();
  });

  it('setRememberMe alterna a preferência', () => {
    const { result } = renderHook(() => useAuthForm());

    act(() => {
      result.current.setRememberMe(false);
    });
    expect(result.current.formState.rememberMe).toBe(false);
  });

  it('handleLoginSubmit rejeita e-mail vazio com mensagem de erro', async () => {
    const { result } = renderHook(() => useAuthForm());

    await act(async () => {
      await result.current.handleLoginSubmit({
        preventDefault: () => {},
      } as React.FormEvent);
    });

    expect(result.current.formState.errorMessage).toMatch(
      /Informe um e-mail corporativo/i,
    );
    expect(result.current.formState.isLoading).toBe(false);
  });

  it('handleLoginSubmit com e-mail válido completa sem erro', async () => {
    const { result } = renderHook(() => useAuthForm());

    act(() => {
      result.current.setEmail('  gestor@empresa.com  ');
    });

    await act(async () => {
      await result.current.handleLoginSubmit({
        preventDefault: () => {},
      } as React.FormEvent);
    });

    expect(result.current.formState.isLoading).toBe(false);
    expect(result.current.formState.errorMessage).toBeNull();
  });
});

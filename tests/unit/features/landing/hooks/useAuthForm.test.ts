import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAuthForm } from '@/features/landing/hooks/useAuthForm';

describe('useAuthForm', () => {
  it('estado inicial: e-mail vazio, rememberMe ativo, sem loading/erro', () => {
    const { result } = renderHook(() => useAuthForm());
    expect(result.current.formState).toEqual({
      email: '',
      rememberMe: true,
      isLoading: false,
      errorMessage: null,
    });
  });

  it('setEmail atualiza e-mail e limpa erro anterior; setRememberMe alterna', () => {
    const { result } = renderHook(() => useAuthForm());

    act(() => result.current.setRememberMe(false));
    expect(result.current.formState.rememberMe).toBe(false);

    // força erro via submit vazio e depois limpa com setEmail
    act(() => {
      void result.current.handleLoginSubmit({
        preventDefault: () => {},
      } as React.FormEvent);
    });
    expect(result.current.formState.errorMessage).toBe(
      'Informe um e-mail corporativo válido.',
    );

    act(() => result.current.setEmail('ana@empresa.com.br'));
    expect(result.current.formState.email).toBe('ana@empresa.com.br');
    expect(result.current.formState.errorMessage).toBeNull();
  });

  it('submit com e-mail em branco não entra em loading e registra erro', async () => {
    const { result } = renderHook(() => useAuthForm());

    await act(async () => {
      await result.current.handleLoginSubmit({
        preventDefault: () => {},
      } as React.FormEvent);
    });

    expect(result.current.formState.errorMessage).toBe(
      'Informe um e-mail corporativo válido.',
    );
    expect(result.current.formState.isLoading).toBe(false);
  });

  it('submit com e-mail válido percorre loading e termina sem erro', async () => {
    const { result } = renderHook(() => useAuthForm());

    act(() => result.current.setEmail('  ana@empresa.com.br  '));
    await act(async () => {
      await result.current.handleLoginSubmit({
        preventDefault: () => {},
      } as React.FormEvent);
    });

    expect(result.current.formState.isLoading).toBe(false);
    expect(result.current.formState.errorMessage).toBeNull();
  });
});

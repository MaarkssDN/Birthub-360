import { useState } from 'react';

export interface AuthFormState {
  email: string;
  rememberMe: boolean;
  isLoading: boolean;
  errorMessage: string | null;
}

export function useAuthForm() {
  const [formState, setFormState] = useState<AuthFormState>({
    email: '',
    rememberMe: true,
    isLoading: false,
    errorMessage: null,
  });

  const setEmail = (email: string) => {
    setFormState((prev) => ({ ...prev, email, errorMessage: null }));
  };

  const setRememberMe = (rememberMe: boolean) => {
    setFormState((prev) => ({ ...prev, rememberMe }));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.email.trim()) {
      setFormState((prev) => ({ ...prev, errorMessage: 'Informe um e-mail corporativo válido.' }));
      return;
    }
    setFormState((prev) => ({ ...prev, isLoading: true, errorMessage: null }));
    try {
      // Disparo de autenticação
    } catch (err: unknown) {
      setFormState((prev) => ({
        ...prev,
        errorMessage: err instanceof Error ? err.message : 'Falha na autenticação.',
      }));
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return { formState, setEmail, setRememberMe, handleLoginSubmit };
}

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { isAuthorizedLoginEmail } from '@/config/access-policy';
import { useAuth } from '@/contexts/AuthContext';
import { authClient } from '@/lib/auth-client';
import { SoundFX } from '@/lib/soundEffects';

/**
 * Estado e handlers de autenticação da Landing360 (tela de login corporativo).
 * Extraído de pages/Landing360.tsx sem alteração de comportamento.
 */
export function useLanding360Auth() {
  const { currentUser, isPending: isAuthPending } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Destino pós-autenticação: o ProtectedRoute envia `state.from` ao redirecionar para
  // /login; sem honrá-lo toda autenticação caía em /app e a rota originalmente pedida
  // (ex.: /app/crm?filtro=x) era perdida. Só caminhos internos são aceitos.
  const postLoginTarget = (() => {
    const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
    if (!from?.pathname || !from.pathname.startsWith('/') || from.pathname.startsWith('//')) {
      return '/app';
    }
    return `${from.pathname}${from.search || ''}`;
  })();
  // Congela o alvo no mount: depois do primeiro navigate o state é limpo e o
  // fallback '/app' não deve sobrescrever o destino original num re-render.
  const postLoginTargetRef = useRef(postLoginTarget);

  // Form State para autenticação
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authMethod, setAuthMethod] = useState<'email' | 'sso'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Capturar erros passados por query string (ex: retorno de OAuth /login?error=...)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      if (errorParam === 'sso_failed' || errorParam === 'oauth_failed') {
        setErrorMessage(
          'Falha na autenticação via SSO Empresarial. Tente novamente ou use E-mail Corporativo.',
        );
      } else if (errorParam === 'unauthorized') {
        setErrorMessage('Acesso não autorizado para esta organização.');
      } else {
        setErrorMessage(decodeURIComponent(errorParam));
      }
    }
  }, [searchParams]);

  // Redirecionamento se já autenticado
  useEffect(() => {
    if (currentUser) {
      void navigate(postLoginTargetRef.current, { replace: true });
    }
  }, [currentUser, navigate]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Por favor, informe seu e-mail corporativo.');
      return;
    }

    if (!isAuthorizedLoginEmail(trimmedEmail)) {
      setErrorMessage(
        'Por favor, informe um endereço de e-mail corporativo válido (ex: nome@empresa.com.br).',
      );
      return;
    }

    if (authMode !== 'forgot' && !password.trim()) {
      setErrorMessage('Por favor, informe sua senha de acesso.');
      return;
    }

    if (authMode === 'signup' && password.trim().length < 8) {
      setErrorMessage('A senha de acesso corporativo deve conter pelo menos 8 caracteres.');
      return;
    }

    setIsSubmitting(true);
    SoundFX.play('confirm');

    try {
      if (authMode === 'signin') {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password: password.trim(),
          rememberMe,
          callbackURL: postLoginTarget,
        });

        if (result.error) {
          setErrorMessage(result.error.message || 'Credenciais inválidas. Tente novamente.');
          setIsSubmitting(false);
          return;
        }

        void navigate(postLoginTarget, { replace: true });
      } else if (authMode === 'signup') {
        const result = await authClient.signUp.email({
          email: email.trim(),
          password: password.trim(),
          name: name.trim() || email.split('@')[0],
          callbackURL: postLoginTarget,
        });

        if (result.error) {
          setErrorMessage(
            result.error.message || 'Erro ao solicitar provisionamento. Verifique os dados.',
          );
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage(
          'Solicitação de provisionamento enviada com sucesso! Verifique seu e-mail corporativo.',
        );
        setIsSubmitting(false);
      } else if (authMode === 'forgot') {
        const result = await authClient.requestPasswordReset({
          email: email.trim(),
          redirectTo: '/reset-password',
        });

        if (result.error) {
          setErrorMessage(result.error.message || 'Não foi possível enviar o link de redefinição.');
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage('Link de redefinição de senha enviado para seu e-mail corporativo.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro inesperado ao processar.');
      setIsSubmitting(false);
    }
  };

  const handleSsoSubmit = async () => {
    SoundFX.play('confirm');
    setErrorMessage('');
    setSuccessMessage('');

    const targetDomain = email.trim();
    if (!targetDomain) {
      setErrorMessage(
        'Por favor, informe o domínio corporativo da sua organização (ex: empresa.com.br).',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/sso-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: targetDomain }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error || 'Provedor SSO corporativo não configurado para este domínio.',
        );
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`Conectando ao provedor empresarial ${data.providerName}...`);
      await authClient.signIn.social({
        provider: data.provider,
        callbackURL: postLoginTarget,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao contatar serviço de autenticação SSO.');
      setIsSubmitting(false);
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: 'email' | 'sso') => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextTab = currentTab === 'email' ? 'sso' : 'email';
      setAuthMethod(nextTab);
    }
  };

  return {
    currentUser,
    isAuthPending,
    postLoginTarget,
    authMode,
    setAuthMode,
    authMethod,
    setAuthMethod,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    showPassword,
    setShowPassword,
    isSubmitting,
    setIsSubmitting,
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
    handleAuthSubmit,
    handleSsoSubmit,
    handleTabKeyDown,
  };
}

export type Landing360Auth = ReturnType<typeof useLanding360Auth>;

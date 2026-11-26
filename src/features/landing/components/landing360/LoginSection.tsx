import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Moon,
  Sun,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { SoundFX } from '@/lib/soundEffects';
import { BH360LogoMark } from './data.js';
import { LoginDossier } from './LoginDossier.js';
import type { Landing360Auth } from './useLanding360Auth.js';

interface Landing360LoginProps {
  theme: string;
  activeScreen: 'intro' | 'login';
  isFullscreen: boolean;
  auth: Landing360Auth;
  onBackToHome: () => void;
  onToggleTheme: () => void;
  onToggleFullscreen: () => void;
}

/** TELA 2: LOGIN — MODAL / TELA DE ACESSO CORPORATIVO (IMPECCABLE SPLIT-STAGE DESIGN). */
export function Landing360Login({
  theme,
  activeScreen,
  isFullscreen,
  auth,
  onBackToHome,
  onToggleTheme,
  onToggleFullscreen,
}: Landing360LoginProps) {
  const {
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
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
    handleAuthSubmit,
    handleSsoSubmit,
    handleTabKeyDown,
  } = auth;

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col items-center justify-start z-50 login-antessala-backdrop ${
        theme === 'dark' ? 'bg-[#060D19]' : 'bg-[#F4F6FA]'
      } px-4 py-4 sm:px-6 sm:py-8 lg:px-12 overflow-y-auto transition-all duration-500 ${
        activeScreen === 'login'
          ? 'opacity-100 pointer-events-auto'
          : 'hidden opacity-0 pointer-events-none'
      }`}
    >
      {/* Camada ambiente cinematográfica & mesh gradient com profundidade */}
      <div className="b360-ambient" aria-hidden="true">
        <div className="b360-orb b360-orb-a" />
        <div className="b360-orb b360-orb-b" />
        <div className="b360-orb b360-orb-c" />
        <div className="b360-orbit-ring" />
      </div>

      {/* Topo do Modal com navegação utilitária de alta precisão */}
      <div className="b360-login-rise b360-login-rise-1 w-full max-w-6xl flex items-center justify-between mb-4 sm:mb-8 z-10">
        <button
          id="btn-back"
          type="button"
          onClick={onBackToHome}
          className="text-slate-700 dark:text-slate-300 hover:text-[#00D4FF] dark:hover:text-[#00D4FF] transition-all flex items-center gap-2 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer px-4 py-2 rounded-xl bg-white/80 dark:bg-[#0C1526]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 shadow-sm hover:border-[#00D4FF]/40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleTheme}
            className="landing-theme-toggle-btn px-3 py-2 rounded-xl bg-white/80 dark:bg-[#0C1526]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 hover:border-[#00D4FF]/40 transition-all cursor-pointer"
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#F59E0B]" />
            ) : (
              <Moon className="w-4 h-4 text-[#00D4FF]" />
            )}
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Sair da tela cheia' : 'Ativar modo tela cheia'}
            title={isFullscreen ? 'Sair da tela cheia' : 'Ativar modo tela cheia'}
            className="text-slate-600 dark:text-slate-400 hover:text-[#00D4FF] transition-all font-mono text-xs cursor-pointer flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-[#0C1526]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 hover:border-[#00D4FF]/40"
          >
            <span>{isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid Principal Split-Stage (Dossiê Executivo à Esquerda, Cockpit de Acesso à Direita) */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start my-auto z-10 pb-12">
        {/* ═══ COLUNA ESQUERDA: DOSSIÊ EXECUTIVO DE REVENUE INTELLIGENCE (5 COLS) ═══ */}
        <LoginDossier />

        {/* ═══ COLUNA DIREITA: COCKPIT DE AUTENTICAÇÃO ELEVADO (7 COLS) ═══ */}
        <div className="col-span-1 lg:col-span-7 flex flex-col items-center">
          {/* Card Central Glassmórfico Elevado */}
          <div className="b360-login-rise b360-login-rise-2 w-full max-w-[500px] rounded-3xl bg-white/95 dark:bg-[#0C1526]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl p-6 sm:p-8 relative transition-all">
            {/* Header do Cockpit */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-3">
                <div className="absolute -inset-2 rounded-full bg-[#00D4FF]/20 blur-md pointer-events-none" />
                <BH360LogoMark size={46} />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#0284C7] dark:text-[#00D4FF] mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
                <span>Revenue Command Center · Antessala</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5 leading-tight text-center">
                <span>
                  {authMode === 'signup'
                    ? 'Solicitar Acesso Corporativo'
                    : authMode === 'forgot'
                      ? 'Redefinir Senha'
                      : 'Acessar o Command Center'}
                </span>
              </h2>
              <p className="font-sans text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-[380px] mx-auto leading-relaxed text-center">
                {authMode === 'signup'
                  ? 'Preencha suas informações corporativas para provisionamento de acesso seguro.'
                  : authMode === 'forgot'
                    ? 'Informe seu e-mail corporativo para receber o link de redefinição imediato.'
                    : 'Acesse o console unificado de Revenue Intelligence e Gestão 360°.'}
              </p>

              {/* Pill de preenchimento rápido para demonstração executiva */}
              {authMode === 'signin' && (
                <button
                  type="button"
                  onClick={() => {
                    setEmail('executivo@empresa.com.br');
                    setPassword('SenhaForte123!');
                    setErrorMessage('');
                    SoundFX.play('click');
                  }}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-[#00D4FF] dark:hover:text-[#00D4FF] bg-slate-100 dark:bg-slate-800/60 hover:bg-[#00D4FF]/10 dark:hover:bg-[#00D4FF]/10 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer"
                  title="Preencher com credenciais de demonstração homologadas"
                >
                  <span>⚡ Preencher demonstração</span>
                </button>
              )}
            </div>

            {/* Abas E-mail vs SSO (Segmented Switch de Alta Precisão) */}
            {authMode === 'signin' && (
              <div
                className="grid grid-cols-2 gap-1 mb-5 p-1 bg-slate-100 dark:bg-[#070D18] border border-slate-200 dark:border-slate-800 rounded-2xl"
                role="tablist"
                aria-label="Método de acesso"
              >
                <button
                  id="auth-tab-email"
                  type="button"
                  role="tab"
                  aria-selected={authMethod === 'email'}
                  aria-controls="auth-panel-email"
                  tabIndex={authMethod === 'email' ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, 'email')}
                  onClick={() => {
                    setAuthMethod('email');
                    SoundFX.play('click');
                  }}
                  className={`py-2 px-3 text-xs font-mono font-bold flex items-center justify-center gap-2 rounded-xl cursor-pointer transition-all ${
                    authMethod === 'email'
                      ? 'bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-[#0284C7] dark:text-[#00D4FF] shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>E-mail Corporativo</span>
                </button>
                <button
                  id="auth-tab-sso"
                  type="button"
                  role="tab"
                  aria-selected={authMethod === 'sso'}
                  aria-controls="auth-panel-sso"
                  tabIndex={authMethod === 'sso' ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, 'sso')}
                  onClick={() => {
                    setAuthMethod('sso');
                    SoundFX.play('click');
                  }}
                  className={`py-2 px-3 text-xs font-mono font-bold flex items-center justify-center gap-2 rounded-xl cursor-pointer transition-all ${
                    authMethod === 'sso'
                      ? 'bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-[#0284C7] dark:text-[#00D4FF] shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>SSO Empresarial</span>
                </button>
              </div>
            )}

            {/* Mensagens de Feedback com Alto Contraste & Acessibilidade */}
            {errorMessage && (
              <div
                id="auth-error-message"
                role="alert"
                className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-500/40 flex items-start gap-2.5 text-xs text-red-900 dark:text-red-200 animate-fadeIn"
              >
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <p className="font-medium font-sans">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div
                id="auth-status-message"
                role="status"
                className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/40 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 animate-fadeIn"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="font-medium font-sans">{successMessage}</p>
              </div>
            )}

            {/* Painel SSO Empresarial */}
            {authMethod === 'sso' && authMode === 'signin' ? (
              <div
                id="auth-panel-sso"
                role="tabpanel"
                aria-labelledby="auth-tab-sso"
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-slate-800 text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/10 text-[#00D4FF] flex items-center justify-center mx-auto mb-2.5 border border-[#00D4FF]/20">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Single Sign-On Corporativo
                  </h4>
                  <p className="font-sans text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3.5">
                    Autenticação federada OpenID Connect / SAML 2.0 (Google Workspace / Microsoft
                    Entra ID / Okta) com provisionamento Just-in-Time.
                  </p>
                  <div className="space-y-1.5 text-left">
                    <label
                      htmlFor="sso-domain"
                      className="block font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                    >
                      Domínio Corporativo
                    </label>
                    <input
                      id="sso-domain"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={Boolean(errorMessage)}
                      aria-describedby={errorMessage ? 'auth-error-message' : undefined}
                      className="w-full h-11 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:border-[#00D4FF] focus:ring-2 focus:ring-[#00D4FF]/20 rounded-xl px-4 text-sm font-sans outline-none placeholder:text-slate-400 transition-all"
                      placeholder="empresa.com.br"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSsoSubmit}
                  className="w-full h-12 rounded-xl font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all disabled:opacity-50 text-white bg-gradient-to-r from-[#0284C7] to-[#00D4FF] hover:from-[#0369A1] hover:to-[#0284C7] shadow-[#00D4FF]/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Continuar com SSO</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Formulário E-mail Padrão */
              <form
                id="auth-panel-email"
                role={authMode === 'signin' ? 'tabpanel' : undefined}
                aria-labelledby={authMode === 'signin' ? 'auth-tab-email' : undefined}
                onSubmit={handleAuthSubmit}
                className="space-y-4"
                noValidate
              >
                {authMode === 'signup' && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="login-name"
                      className="block font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                    >
                      Nome Completo
                    </label>
                    <input
                      id="login-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 bg-slate-50 dark:bg-[#070D18] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 focus:border-[#00D4FF] focus:ring-2 focus:ring-[#00D4FF]/20 rounded-xl px-4 text-sm font-sans outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="Seu nome completo"
                      autoComplete="name"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="login-email"
                      className="block font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                    >
                      E-mail Corporativo
                    </label>
                    <span className="font-mono text-[10px] text-[#0284C7] dark:text-[#00D4FF]">
                      Domínio empresarial
                    </span>
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(errorMessage)}
                    aria-describedby={errorMessage ? 'auth-error-message' : undefined}
                    className="w-full h-11 bg-slate-50 dark:bg-[#070D18] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 focus:border-[#00D4FF] focus:ring-2 focus:ring-[#00D4FF]/20 rounded-xl px-4 text-sm font-sans outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="nome@empresa.com.br"
                    required
                    autoComplete="email"
                  />
                </div>

                {authMode !== 'forgot' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="login-password"
                        className="block font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                      >
                        Senha de Acesso
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={Boolean(errorMessage)}
                        aria-describedby={errorMessage ? 'auth-error-message' : undefined}
                        className="w-full h-11 bg-slate-50 dark:bg-[#070D18] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 focus:border-[#00D4FF] focus:ring-2 focus:ring-[#00D4FF]/20 rounded-xl px-4 text-sm font-sans outline-none transition-all pr-11 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="••••••••"
                        required
                        autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowPassword(!showPassword);
                          SoundFX.play('click');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-[#00D4FF] transition-colors p-1.5 cursor-pointer rounded-lg"
                        aria-label="Mostrar ou ocultar senha"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Medidor de força de senha dinâmico para novo acesso */}
                    {password.length > 0 && (
                      <div className="pt-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-500 dark:text-slate-400">
                            Complexidade da Senha
                          </span>
                          <span
                            className={
                              password.length < 8
                                ? 'text-red-500 font-semibold'
                                : password.length < 10
                                  ? 'text-amber-500 font-semibold'
                                  : /[A-Z]/.test(password) &&
                                      /[0-9]/.test(password) &&
                                      /[^A-Za-z0-9]/.test(password)
                                    ? 'text-emerald-500 font-bold'
                                    : 'text-[#0284C7] dark:text-[#00D4FF] font-semibold'
                            }
                          >
                            {password.length < 8
                              ? 'Fraca'
                              : password.length < 10
                                ? 'Média'
                                : /[A-Z]/.test(password) &&
                                    /[0-9]/.test(password) &&
                                    /[^A-Za-z0-9]/.test(password)
                                  ? 'Excelente'
                                  : 'Forte'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                          <div
                            className={`h-full transition-all duration-300 ${password.length > 0 ? (password.length < 8 ? 'bg-red-500' : 'bg-emerald-500') : 'bg-transparent'}`}
                          />
                          <div
                            className={`h-full transition-all duration-300 ${password.length >= 8 ? (password.length < 10 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-transparent'}`}
                          />
                          <div
                            className={`h-full transition-all duration-300 ${password.length >= 10 ? 'bg-emerald-500' : 'bg-transparent'}`}
                          />
                          <div
                            className={`h-full transition-all duration-300 ${password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 'bg-emerald-400' : 'bg-transparent'}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {authMode === 'signin' && (
                  <div className="flex items-center justify-between pt-1 font-sans text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#070D18] text-[#0284C7] dark:text-[#00D4FF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>Manter conectado</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setErrorMessage('');
                        setSuccessMessage('');
                        SoundFX.play('click');
                      }}
                      className="font-medium text-[#0284C7] dark:text-[#00D4FF] hover:underline cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                )}

                {/* Botão de Envio Primário Impeccable (Calibrado WCAG 2.2 AA - D4) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl cursor-pointer shadow-lg transition-all duration-200 disabled:opacity-50 text-white dark:text-[#041c32] font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#0369A1] via-[#0284C7] to-[#0369A1] dark:from-[#00D4FF] dark:via-[#38BDF8] dark:to-[#00D4FF] hover:brightness-105 shadow-[#00D4FF]/20 hover:shadow-[#00D4FF]/35 active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white dark:text-[#041c32]" />
                  ) : (
                    <>
                      <span>
                        {authMode === 'signup'
                          ? 'Solicitar Acesso'
                          : authMode === 'forgot'
                            ? 'Enviar Link de Redefinição'
                            : 'Entrar na Plataforma'}
                      </span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Provedores Federados Corporativos */}
            {authMode === 'signin' && authMethod === 'email' && (
              <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="relative flex justify-center text-xs uppercase mb-3.5">
                  <span className="bg-white dark:bg-[#0C1526] px-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    Ou conecte via federação
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      SoundFX.play('confirm');
                      void authClient.signIn.social({
                        provider: 'google',
                        callbackURL: postLoginTarget,
                      });
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#070D18] hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google Workspace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      SoundFX.play('confirm');
                      void authClient.signIn.social({
                        provider: 'microsoft',
                        callbackURL: postLoginTarget,
                      });
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#070D18] hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 23 23">
                      <path fill="#f35325" d="M1 1h10v10H1z" />
                      <path fill="#81bc06" d="M12 1h10v10H12z" />
                      <path fill="#05a6f0" d="M1 12h10v10H1z" />
                      <path fill="#ffba08" d="M12 12h10v10H12z" />
                    </svg>
                    <span>Microsoft Entra</span>
                  </button>
                </div>
              </div>
            )}

            {/* Alternância de Modo (Criar / Entrar / Recuperar) */}
            <div className="mt-5 text-center">
              {authMode === 'signin' && (
                <button
                  type="button"
                  aria-label="Criar conta"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage('');
                    setSuccessMessage('');
                    SoundFX.play('click');
                  }}
                  className="font-sans text-xs text-slate-600 dark:text-slate-400 hover:text-[#00D4FF] transition-colors cursor-pointer"
                >
                  Não possui credenciais corporativas?{' '}
                  <span className="font-bold text-[#0284C7] dark:text-[#00D4FF] hover:underline">
                    Criar conta
                  </span>
                </button>
              )}

              {authMode === 'signup' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMessage('');
                    setSuccessMessage('');
                    SoundFX.play('click');
                  }}
                  className="font-sans text-xs text-slate-600 dark:text-slate-400 hover:text-[#00D4FF] transition-colors cursor-pointer"
                >
                  Já possui credenciais corporativas?{' '}
                  <span className="font-bold text-[#0284C7] dark:text-[#00D4FF] hover:underline">
                    Fazer login
                  </span>
                </button>
              )}

              {authMode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMessage('');
                    setSuccessMessage('');
                    SoundFX.play('click');
                  }}
                  className="font-sans text-xs text-slate-600 dark:text-slate-400 hover:text-[#00D4FF] transition-colors cursor-pointer"
                >
                  Voltar para{' '}
                  <span className="font-bold text-[#0284C7] dark:text-[#00D4FF] hover:underline">
                    Login Corporativo
                  </span>
                </button>
              )}
            </div>

            {/* Régua Técnica de Segurança e Conformidade (Arquitetura Real) */}
            <div className="mt-5 p-3 rounded-2xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="flex flex-col items-center">
                  <span className="font-mono text-[10px] font-bold text-[#0284C7] dark:text-[#00D4FF]">
                    Multi-Tenant
                  </span>
                  <span className="font-sans text-[9px] font-medium text-slate-600 dark:text-slate-400">
                    Isolamento RLS
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-mono text-[10px] font-bold text-[#0284C7] dark:text-[#00D4FF]">
                    Sessão Segura
                  </span>
                  <span className="font-sans text-[9px] font-medium text-slate-600 dark:text-slate-400">
                    Cookie HttpOnly
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-mono text-[10px] font-bold text-[#D97706] dark:text-[#F59E0B]">
                    LGPD / Art. 18
                  </span>
                  <span className="font-sans text-[9px] font-medium text-slate-600 dark:text-slate-400">
                    Privacidade Total
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Criptografia
                  </span>
                  <span className="font-sans text-[9px] font-medium text-slate-600 dark:text-slate-400">
                    AES-256-GCM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

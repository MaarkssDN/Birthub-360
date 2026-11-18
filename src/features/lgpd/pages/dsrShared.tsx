import type { ReactNode } from 'react';

/**
 * Casca visual comum das páginas públicas de privacidade (DSR/LGPD) — mesma
 * linguagem da `/privacy` (vancouver-card, tokens bg/ink). Sem dependência de
 * auth: são rotas públicas acessadas pelo titular via links de e-mail.
 */
export function DsrShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg py-12 px-4 sm:px-6 lg:px-8 font-sans text-ink">
      <div className="max-w-2xl mx-auto vancouver-card p-8 md:p-10 shadow-vancouver">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 font-display">
          <span className="vancouver-gradient-text">{title}</span>
        </h1>
        {children}
        <p className="mt-8 text-xs text-ink-2/70 leading-relaxed">
          Birth Hub 360º — Encarregado de Dados (DPO): marcelo.nascimento@birthub360.com. Este
          canal nunca altera seus dados sem confirmação enviada ao seu e-mail cadastrado.
        </p>
      </div>
    </div>
  );
}

export function DsrAlert({
  tone,
  children,
}: {
  tone: 'error' | 'info' | 'success';
  children: ReactNode;
}) {
  const toneClass =
    tone === 'error'
      ? 'border-red-300 bg-red-50 text-red-800'
      : tone === 'success'
        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
        : 'border-sky-300 bg-sky-50 text-sky-800';
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${toneClass}`}
    >
      {children}
    </div>
  );
}

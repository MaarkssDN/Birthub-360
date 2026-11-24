import * as React from 'react';

import { cn } from '../../lib/utils.js';

export interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** id do elemento de destino (ex.: o <main> do shell). Padrão: 'main-content'. */
  targetId?: string;
}

/**
 * SkipLink — WCAG 2.4.1 Bypass Blocks (nível A, incluído no AA).
 *
 * Primeiro elemento focável da página: permite a usuários de teclado e
 * leitor de tela pularem a navegação repetitiva (sidebar/topbar) e ir
 * direto ao conteúdo principal.
 *
 * Fica visualmente oculto até receber foco (`sr-only` → `not-sr-only`),
 * quando aparece como um botão flutuante com anel de foco visível
 * (`focus-visible:ring-*`, mesmo padrão dos demais componentes).
 *
 * No clique, rola até o alvo e move o foco de teclado para ele —
 * comportamento exigido para que o salto realmente reposicione o
 * contexto do usuário de teclado/leitor de tela (não basta o scroll
 * visual do âncora nativo). O alvo deve ser focável (`tabIndex={-1}`)
 * para `focus()` funcionar; ver handoff de adoção no MainLayout.
 */
export const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ targetId = 'main-content', className, onClick, children, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const target = document.getElementById(targetId);
      if (!target) return; // alvo ausente: deixa o comportamento padrão do âncora
      event.preventDefault();
      target.scrollIntoView();
      // Garante foco de teclado no destino (WCAG 2.4.3 Focus Order).
      // `tabIndex={-1}` no alvo é o caminho recomendado; setamos aqui como
      // fallback para alvos ainda sem o atributo, sem efeito colateral
      // visível (elemento não entra na ordem de tabulação).
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
      window.history.replaceState(null, '', `#${targetId}`);
    };

    return (
      <a
        ref={ref}
        href={`#${targetId}`}
        onClick={handleClick}
        className={cn(
          // Oculto até o foco: padrão "skip link" — sr-only esconde visualmente
          // mas mantém o elemento na ordem de tabulação e acessível a AT.
          'sr-only focus:not-sr-only',
          // Posição e aparência quando visível: topo esquerdo, acima de tudo,
          // com contraste garantido pelos tokens de superfície/tinta.
          'focus:absolute focus:left-4 focus:top-4 focus:z-[100]',
          'focus:rounded-[var(--radius-control)] focus:bg-surface-elevated focus:px-4 focus:py-2',
          'focus:text-sm focus:font-medium focus:text-ink focus:shadow-card',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          className,
        )}
        {...props}
      >
        {children ?? 'Pular para o conteúdo principal'}
      </a>
    );
  },
);
SkipLink.displayName = 'SkipLink';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Cobre o ErrorBoundary de nível de app (src/components/ErrorBoundary.tsx, montado em
 * App.tsx) — NÃO confundir com src/components/ui/ErrorBoundary.tsx, que tem fallback
 * próprio e teste dedicado em tests/unit/components/ui/ErrorBoundary.test.tsx.
 *
 * O fallback novo (P0 do #310) removeu o stack trace/mensagem de erro da tela — este
 * teste fixa esse contrato: nada de `error.message`/`error.stack` renderizado, e o
 * botão "Recarregar página" dispara window.location.reload().
 */

afterEach(cleanup);

function Bomb(): ReactNode {
  throw new Error('segredo-interno-xyz');
}

// componentDidCatch loga via clientLogger (console.*) propositalmente.
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('ErrorBoundary (app-level)', () => {
  it('renderiza children quando não há erro', () => {
    render(
      <ErrorBoundary>
        <div>conteúdo seguro</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('conteúdo seguro')).toBeInTheDocument();
  });

  it('fallback não expõe mensagem nem stack trace do erro', () => {
    const { container } = render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Algo deu errado. Tente recarregar a página.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recarregar página' })).toBeInTheDocument();
    // P0: stack trace e mensagem crua do erro não podem vazar para a UI.
    expect(screen.queryByText(/segredo-interno-xyz/)).not.toBeInTheDocument();
    expect(container.querySelector('pre')).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('botão Recarregar página chama window.location.reload', () => {
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...original, reload },
    });
    try {
      render(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Recarregar página' }));
      expect(reload).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original });
    }
  });
});

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Component, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

afterEach(cleanup);

function Bomb({ shouldThrow }: { shouldThrow: boolean }): ReactNode {
  if (shouldThrow) throw new Error('falha simulada');
  return <div>conteúdo seguro</div>;
}

// Silence esperado: componentDidCatch loga o erro propositalmente.
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('ErrorBoundary', () => {
  it('renderiza children quando não há erro', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('conteúdo seguro')).toBeInTheDocument();
  });

  it('captura erro e exibe fallback padrão com role=alert e mensagem', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Ocorreu um erro inesperado');
    expect(alert).toHaveTextContent('falha simulada');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('usa fallback customizado quando fornecido', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="fallback-custom">recuperado</div>}>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('fallback-custom')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

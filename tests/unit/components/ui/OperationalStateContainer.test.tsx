import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OperationalStateContainer } from '@/components/ui/OperationalStateContainer';

afterEach(cleanup);

describe('OperationalStateContainer', () => {
  it('renderiza skeleton de loading por padrão e customizado quando fornecido', () => {
    const { rerender } = render(
      <OperationalStateContainer state="loading">
        <div>conteúdo</div>
      </OperationalStateContainer>,
    );
    expect(screen.getByTestId('operational-loading-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument();

    rerender(
      <OperationalStateContainer state="loading" loadingSkeleton={<div data-testid="custom" />}>
        <div>conteúdo</div>
      </OperationalStateContainer>,
    );
    expect(screen.getByTestId('custom')).toBeInTheDocument();
  });

  it('renderiza empty state com defaults e com config customizada', () => {
    const onAction = vi.fn();
    const { rerender } = render(
      <OperationalStateContainer state="empty">
        <div>conteúdo</div>
      </OperationalStateContainer>,
    );
    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();

    rerender(
      <OperationalStateContainer
        state="empty"
        empty={{ title: 'Vazio custom', description: 'Desc', actionLabel: 'Criar', onAction }}
      >
        <div>conteúdo</div>
      </OperationalStateContainer>,
    );
    expect(screen.getByText('Vazio custom')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
  });

  it('renderiza error state com retry e sem retry', () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <OperationalStateContainer state="error" error={{ onRetry, retryLabel: 'Repetir' }}>
        <div>conteúdo</div>
      </OperationalStateContainer>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Repetir/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(
      <OperationalStateContainer state="error">
        <div>conteúdo</div>
      </OperationalStateContainer>,
    );
    expect(screen.getByText('Falha de comunicação operacional')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renderiza stale com timestamp e botão reconectar, e ready sem banner', () => {
    const onRefresh = vi.fn();
    const { rerender } = render(
      <OperationalStateContainer
        state="stale"
        stale={{ lastUpdated: '10:30', onRefresh, message: 'Cache offline' }}
      >
        <div data-testid="dados">dados preservados</div>
      </OperationalStateContainer>,
    );
    expect(screen.getByText(/Cache offline/)).toBeInTheDocument();
    expect(screen.getByText(/10:30/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reconectar/ }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('dados')).toBeInTheDocument();

    rerender(
      <OperationalStateContainer state="ready">
        <div data-testid="dados2">pronto</div>
      </OperationalStateContainer>,
    );
    expect(screen.getByTestId('dados2')).toBeInTheDocument();
    expect(screen.queryByText(/Dados em cache/)).not.toBeInTheDocument();
  });
});

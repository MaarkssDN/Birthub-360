import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmptyState } from '../EmptyState.js';
import { ErrorState } from '../ErrorState.js';
import { LoadingState } from '../LoadingState.js';
import { StaleDataIndicator } from '../StaleDataIndicator.js';

afterEach(() => {
  cleanup();
});

describe('LoadingState', () => {
  it('anuncia carregamento via role=status, aria-live e aria-busy', () => {
    render(React.createElement(LoadingState, { label: 'Carregando candidatos…' }));

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Carregando candidatos…')).toBeInTheDocument();
  });

  it('usa rótulo default quando label não é informado', () => {
    render(React.createElement(LoadingState, {}));
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
  });

  it('variant skeleton renderiza placeholder decorativo com rótulo sr-only', () => {
    const { container } = render(
      React.createElement(LoadingState, { variant: 'skeleton', label: 'Carregando lista' }),
    );

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    // Skeleton é aria-hidden; o rótulo visível para SR fica no span sr-only.
    expect(status.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
  });

  it('aceita skeleton customizado', () => {
    render(
      React.createElement(LoadingState, {
        variant: 'skeleton',
        skeleton: React.createElement('div', { 'data-testid': 'custom-skeleton' }),
      }),
    );
    expect(screen.getByTestId('custom-skeleton')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('usa role=alert (assertivo) e exibe título e mensagem', () => {
    render(
      React.createElement(ErrorState, {
        title: 'Falha ao carregar',
        message: 'Serviço indisponível.',
      }),
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Falha ao carregar');
    expect(alert).toHaveTextContent('Serviço indisponível.');
  });

  it('renderiza retry e dispara onRetry', () => {
    const onRetry = vi.fn();
    render(
      React.createElement(ErrorState, {
        title: 'Erro',
        onRetry,
        retryLabel: 'Tentar de novo',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: /Tentar de novo/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('não renderiza botão quando onRetry está ausente', () => {
    render(React.createElement(ErrorState, { title: 'Erro fatal' }));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('variant compact renderiza faixa inline com role=alert', () => {
    render(
      React.createElement(ErrorState, {
        title: 'Falha parcial',
        message: 'Fonte X indisponível',
        variant: 'compact',
      }),
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Falha parcial');
    expect(alert).toHaveTextContent('Fonte X indisponível');
  });
});

describe('StaleDataIndicator', () => {
  it('usa role=status (não interruptivo) e exibe mensagem e timestamp', () => {
    render(
      React.createElement(StaleDataIndicator, {
        message: 'Dados em cache local.',
        lastUpdated: '24/11/2026 10:30',
      }),
    );

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Dados em cache local.');
    expect(status).toHaveTextContent('Última sincronização: 24/11/2026 10:30');
  });

  it('formata Date em pt-BR', () => {
    render(
      React.createElement(StaleDataIndicator, {
        lastUpdated: new Date('2026-11-24T10:30:00'),
      }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Última sincronização:');
  });

  it('botão de refresh chama onRefresh e fica desabilitado enquanto sincroniza', () => {
    const onRefresh = vi.fn();
    const { rerender } = render(
      React.createElement(StaleDataIndicator, { onRefresh, isRefreshing: false }),
    );

    const btn = screen.getByRole('button', { name: /Sincronizar agora/ });
    fireEvent.click(btn);
    expect(onRefresh).toHaveBeenCalledTimes(1);

    rerender(React.createElement(StaleDataIndicator, { onRefresh, isRefreshing: true }));
    expect(screen.getByRole('button', { name: /Sincronizando…/ })).toBeDisabled();
  });

  it('sem onRefresh o indicador é somente informativo (sem botão)', () => {
    render(React.createElement(StaleDataIndicator, { lastUpdated: 'ontem' }));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('EmptyState (feedback)', () => {
  it('mantém role=status, testids canônicos e dispara onAction', () => {
    const onAction = vi.fn();
    render(
      React.createElement(EmptyState, {
        title: 'Nenhum registro',
        description: 'Comece adicionando o primeiro item.',
        actionLabel: 'Adicionar',
        onAction,
      }),
    );

    expect(screen.getByRole('status')).toHaveAttribute('data-testid', 'canonical-empty-state');
    fireEvent.click(screen.getByTestId('empty-state-primary-action'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('sem actionLabel/onAction não renderiza botão', () => {
    render(React.createElement(EmptyState, { title: 'Vazio', description: 'Nada aqui.' }));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('barrel index', () => {
  it('exporta os quatro estados', async () => {
    const mod = await import('../index.js');
    expect(mod.EmptyState).toBeDefined();
    expect(mod.LoadingState).toBeDefined();
    expect(mod.ErrorState).toBeDefined();
    expect(mod.StaleDataIndicator).toBeDefined();
  });
});

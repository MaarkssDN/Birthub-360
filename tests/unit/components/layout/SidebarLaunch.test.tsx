/**
 * Animação de abertura de módulo da navegação: o ícone clicado voa até o centro, gira revelando o
 * logo e só então a navegação acontece (`NavLaunchTransition`). Estes testes fixam o contrato que
 * não pode regredir: a navegação SEMPRE acontece (com ou sem animação) e há caminhos rápidos —
 * item já ativo, Ctrl/⌘ pressionado, movimento reduzido, Escape — que não seguram o usuário.
 *
 * Atualizado para a navegação modular (2026-11-10): os itens ficam no painel contextual do
 * módulo dono da rota — os testes navegam dentro do P01 (`/app/crm`), onde "Empresas" e
 * "Pipeline" são destinos reais do painel.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => useAuthMock() }));

let reduceMotion = false;
vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('framer-motion')>()),
  useReducedMotion: () => reduceMotion,
}));

import { Sidebar } from '@/components/layout/Sidebar';

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderSidebar(activeTab: 'crm' | 'companies' = 'crm') {
  useAuthMock.mockReturnValue({
    currentUser: { name: 'Usuária Teste', role: 'ADMIN', roleTitle: 'ADMIN' },
    isAdmin: true,
    canAccessCommercialIntelligence: true,
    canAccessCopilotoIa: true,
    logout: vi.fn(),
  });
  return render(
    <MemoryRouter initialEntries={['/app/crm']}>
      <Sidebar activeTab={activeTab} />
      <Where />
    </MemoryRouter>,
  );
}

// A transição expõe "Abrindo <módulo>" como role=status (anúncio p/ leitor de tela) — só existe
// enquanto ela está na tela. O rótulo visual repete o texto, por isso não se consulta por texto.
const overlay = () => screen.queryByRole('status');

beforeEach(() => {
  reduceMotion = false;
  // Animações instantâneas: o teste cobre a ORQUESTRAÇÃO (quando abre/navega), não a curva visual.
  MotionGlobalConfig.skipAnimations = true;
});

afterEach(() => {
  cleanup();
  MotionGlobalConfig.skipAnimations = false;
});

describe('Sidebar — transição de abertura de módulo', () => {
  it('mostra a transição ao clicar e navega para o destino escolhido quando ela termina', async () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Empresas' }));

    expect(overlay()).toHaveTextContent('Abrindo Empresas');
    expect(screen.getByTestId('where')).toHaveTextContent('/app/crm');

    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/app/companies'));
    await waitFor(() => expect(overlay()).not.toBeInTheDocument());
  });

  it('Ctrl/⌘ + clique vai direto ao destino, sem transição', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Empresas' }), { ctrlKey: true });

    expect(overlay()).not.toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/app/companies');
  });

  it('com movimento reduzido (prefers-reduced-motion) navega direto, sem transição', () => {
    reduceMotion = true;
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Empresas' }));

    expect(overlay()).not.toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/app/companies');
  });

  it('clicar no item já ativo não dispara a transição', () => {
    renderSidebar('crm');
    fireEvent.click(screen.getByRole('button', { name: 'Pipeline' }));

    expect(overlay()).not.toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/app/crm');
  });

  it('Escape encurta a transição e abre o destino na hora', async () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Empresas' }));
    expect(overlay()).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/app/companies'));
  });

  it('ignora cliques extras enquanto a transição está em andamento', async () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Empresas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Propostas' }));

    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/app/companies'));
    expect(screen.getByTestId('where')).not.toHaveTextContent('/app/propostas');
  });
});

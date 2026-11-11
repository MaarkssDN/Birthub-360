/**
 * Shell Impeccable Operate (Agente 02) + handoff 05: a navegação precisa levar a TODOS os
 * destinos reais do pilar de Inteligência de Mercado — LDR (`/app/market-intelligence`),
 * Hub de MI (`/app/market-intelligence/hub`) e Prospecção Inteligente
 * (`/app/prospect/inteligente`) —, que antes eram rotas órfãs.
 *
 * Atualizado para a navegação modular (2026-11-10): os destinos vivem no painel contextual
 * do P02 (`ModuleNavPanel`), com `aria-current` marcando o item ativo. O antigo rodapé com
 * CTA "Hub de IA"/contagem fabricada não existe mais — o painel do P06 cobre esse papel.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => useAuthMock() }));
vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('framer-motion')>()),
  useReducedMotion: () => true,
}));

import { Sidebar } from '@/components/layout/Sidebar';
import type { TabType } from '@/components/layout/tabMeta';

afterEach(cleanup);

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderAt(path: string, activeTab: TabType) {
  useAuthMock.mockReturnValue({
    currentUser: { name: 'Teste', role: 'GESTOR', roleTitle: 'GESTOR' },
    isAdmin: false,
    canAccessCommercialIntelligence: true,
    canAccessCopilotoIa: true,
    canManageOperations: undefined,
  });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar activeTab={activeTab} />
      <Where />
    </MemoryRouter>,
  );
}

// No painel modular os itens são <button> com o rótulo visível; o path vira parte do
// data-testid (`module-nav-<modulo>-<tab>[-<path-com-hifens>]`).
describe('Sidebar — destinos de MI e prospecção (handoff 05)', () => {
  it('em /app/market-intelligence/hub só o Hub de Inteligência fica ativo', () => {
    renderAt('/app/market-intelligence/hub', 'market-intelligence');
    const hub = screen.getByRole('button', { name: /Hub de Inteligência/ });
    const ldr = screen.getByRole('button', { name: 'Pesquisa LDR' });
    expect(hub).toHaveAttribute('aria-current', 'page');
    expect(ldr).not.toHaveAttribute('aria-current');
  });

  it('navega para /app/prospect/inteligente pelo item do P02', () => {
    renderAt('/app/prospect', 'prospect');
    fireEvent.click(screen.getByRole('button', { name: /Prospecção Inteligente/ }));
    expect(screen.getByTestId('where')).toHaveTextContent('/app/prospect/inteligente');
  });

  it('em /app/market-intelligence o LDR fica ativo e navega para o hub', () => {
    renderAt('/app/market-intelligence', 'market-intelligence');
    const ldr = screen.getByRole('button', { name: 'Pesquisa LDR' });
    expect(ldr).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('button', { name: /Hub de Inteligência/ }));
    expect(screen.getByTestId('where')).toHaveTextContent('/app/market-intelligence/hub');
  });

  it('no P06 o item Copiloto IA aparece para quem tem permissão', () => {
    renderAt('/app/intelligence', 'intelligence');
    expect(screen.getByRole('button', { name: 'Copiloto IA' })).toBeInTheDocument();
    expect(screen.queryByText(/7 sinais/)).not.toBeInTheDocument();
  });
});

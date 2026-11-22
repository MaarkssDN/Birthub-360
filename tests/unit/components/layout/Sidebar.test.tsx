/**
 * Antes desta correção, "Automações" e "Integrações" só apareciam na Sidebar para `isAdmin`,
 * mesmo o backend (automation.routes.ts `managementRoles`, Integrations.tsx `canManage`) já
 * autorizando GESTOR a gerenciar as duas — um GESTOR não tinha nenhum caminho de navegação até
 * telas que ele tem permissão real de usar (achado da auditoria Onda 1/Roadmap v2 — Agente 02).
 * "Equipe" e "Consumo de IA" continuam ADMIN-only (o primeiro porque o backend também é
 * ADMIN-only; o segundo porque o backend hoje não tem checagem de papel nenhuma — ver handoff
 * 02-para-01-rbac-ausente-usage-routes.md — então a Sidebar não deveria ampliar ainda mais quem
 * vê o item).
 *
 * Atualizado para a navegação modular (2026-11-10): os itens vivem no painel contextual do
 * módulo dono da rota — Automações/Integrações no P07 (`/app/integrations`), itens admin no
 * M09 (`/app/settings`). Os gates `requires: 'operations'|'admin'` do moduleRegistry são o
 * contrato testado aqui.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

afterEach(cleanup);

const useAuthMock = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => useAuthMock() }));

// A Sidebar não usa mais BrandContext/Logo/birthhub360Logo (marca única, ver
// src/components/brand/BirthHubLogo.tsx) — mocks removidos junto com a troca.
import { Sidebar } from '@/components/layout/Sidebar';

function renderSidebar(role: string, path = '/app/integrations') {
  useAuthMock.mockReturnValue({
    currentUser: { name: 'Usuária Teste', role, roleTitle: role },
    isAdmin: role === 'ADMIN',
    canAccessCommercialIntelligence: role === 'ADMIN' || role === 'GESTOR',
    canAccessCopilotoIa: false,
    logout: vi.fn(),
  });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar activeTab="dashboard" />
    </MemoryRouter>,
  );
}

describe('Sidebar — visibilidade de Automações/Integrações por papel', () => {
  it('GESTOR vê Automações e Integrações (permissão real de gerenciar, per backend), mas não Equipe', () => {
    renderSidebar('GESTOR');
    expect(screen.getByRole('button', { name: /Automações/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Integrações/ })).toBeInTheDocument();
    // Itens admin vivem no painel do M09 — GESTOR não os vê nem navegando para /app/settings.
    cleanup();
    renderSidebar('GESTOR', '/app/settings');
    expect(screen.queryByRole('button', { name: 'Equipe' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ajustes Globais/ })).toBeInTheDocument();
  });

  it('ADMIN vê os itens administrativos da governança', () => {
    renderSidebar('ADMIN', '/app/settings');
    expect(screen.getByRole('button', { name: 'Equipe' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Acesso a Módulos/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Consumo de IA/ })).toBeInTheDocument();
  });

  it('CLOSER não vê nenhum dos itens administrativos', () => {
    renderSidebar('CLOSER');
    expect(screen.queryByRole('button', { name: /Automações/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Integrações/ })).not.toBeInTheDocument();
    cleanup();
    renderSidebar('CLOSER', '/app/settings');
    expect(screen.queryByRole('button', { name: 'Equipe' })).not.toBeInTheDocument();
  });
});

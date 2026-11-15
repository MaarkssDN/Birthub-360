// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppBreadcrumbs } from '../AppBreadcrumbs.js';
import { AppTopbar } from '../AppTopbar.js';
import {
  deriveActiveTabFromPath,
  SETTINGS_PILLAR_LABEL,
  SETTINGS_PILLAR_SLUGS,
  SETTINGS_PILLAR_TAB,
} from '../settingsPillarNav.js';
import { TAB_META, type TabType } from '../tabMeta.js';

/**
 * Regressão do achado A1 da revisão independente (Agente 24) sobre MEL-30/31:
 * /app/settings/pillars/<slug> derivava activeTab='settings' e o shell inteiro
 * (topbar/H1, breadcrumbs, ModuleAgentWidget) exibia "Ajustes Globais".
 * Estes testes fixam o contrato: slug → TabType settings_<slug>, label do pilar
 * no H1 e breadcrumb final = nome do pilar (nunca "Hub de Inteligência",
 * que pertence a market-intelligence/hub).
 */

vi.mock('@/contexts/AuthContext.js', () => ({
  useAuth: () => ({
    currentUser: { id: 'u1', role: 'ADMIN', name: 'Admin' },
    logout: vi.fn(),
  }),
}));

vi.mock('@/contexts/ThemeContext.js', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('@/features/notifications/notifications.api.js', () => ({
  notificationsApi: { list: vi.fn().mockResolvedValue({ unread: 0 }) },
}));

afterEach(() => {
  cleanup();
});

describe('deriveActiveTabFromPath — /app/settings/pillars/<slug>', () => {
  it.each(SETTINGS_PILLAR_SLUGS)('resolve /app/settings/pillars/%s → settings_%s', (slug) => {
    expect(deriveActiveTabFromPath(`/app/settings/pillars/${slug}`)).toBe(
      SETTINGS_PILLAR_TAB[slug],
    );
  });

  it.each(['hub', 'market', 'ai'] as const)('caso explícito do achado: %s', (slug) => {
    expect(deriveActiveTabFromPath(`/app/settings/pillars/${slug}`)).toBe(`settings_${slug}`);
  });

  it('índice /app/settings/pillars (redirect → hub) resolve settings_hub', () => {
    expect(deriveActiveTabFromPath('/app/settings/pillars')).toBe('settings_hub');
  });

  it('slug inválido resolve settings_hub (mesmo destino do <Navigate>)', () => {
    expect(deriveActiveTabFromPath('/app/settings/pillars/inexistente')).toBe('settings_hub');
  });

  it.each([
    ['/app/crm', 'crm'],
    ['/app/settings', 'settings'],
    ['/app/market-intelligence/hub', 'market-intelligence'],
    ['/app', 'dashboard'],
    ['/app/dashboard', 'dashboard'],
  ])('não regride rotas comuns: %s → %s', (path, expected) => {
    expect(deriveActiveTabFromPath(path)).toBe(expected);
  });
});

describe('Topbar/H1 — label do pilar (não "Ajustes Globais")', () => {
  it.each(SETTINGS_PILLAR_SLUGS)(
    '/app/settings/pillars/%s renderiza H1 com meta do pilar',
    async (slug) => {
      const tab = deriveActiveTabFromPath(`/app/settings/pillars/${slug}`) as TabType;
      // O H1 do AppTopbar é literalmente TAB_META[activeTab].label.
      expect(TAB_META[tab].label).not.toBe('Ajustes Globais');
      expect(TAB_META[tab].label).toBe(TAB_META[SETTINGS_PILLAR_TAB[slug]].label);

      render(
        React.createElement(
          MemoryRouter,
          { initialEntries: [`/app/settings/pillars/${slug}`] },
          React.createElement(AppTopbar, { activeTab: tab }),
        ),
      );
      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
        TAB_META[tab].label,
      );
      // Nota: "Ajustes Globais" aparece legitimamente no breadcrumb intermediário
      // (Início › Ajustes Globais › <Pilar>) — a regressão era o H1/título, não o crumb.
    },
  );
});

describe('AppBreadcrumbs — trilha /app/settings/pillars/<slug>', () => {
  it.each(['hub', 'market', 'ai'] as const)('breadcrumb final de %s é o nome do pilar', (slug) => {
    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: [`/app/settings/pillars/${slug}`] },
        React.createElement(AppBreadcrumbs, null),
      ),
    );
    const nav = screen.getByRole('navigation', { name: /navegação estrutural/i });
    expect(nav).toHaveTextContent('Início');
    expect(nav).toHaveTextContent('Ajustes Globais');
    const current = nav.querySelector('[aria-current="page"]');
    expect(current).toHaveTextContent(SETTINGS_PILLAR_LABEL[slug]);
  });

  it('slug "hub" de settings NÃO renderiza "Hub de Inteligência"', () => {
    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/app/settings/pillars/hub'] },
        React.createElement(AppBreadcrumbs, null),
      ),
    );
    expect(screen.queryByText('Hub de Inteligência')).not.toBeInTheDocument();
    expect(screen.getByText('Hub Comercial')).toBeInTheDocument();
  });

  it('market-intelligence/hub continua renderizando "Hub de Inteligência"', () => {
    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/app/market-intelligence/hub'] },
        React.createElement(AppBreadcrumbs, null),
      ),
    );
    expect(screen.getByText('Hub de Inteligência')).toBeInTheDocument();
  });
});

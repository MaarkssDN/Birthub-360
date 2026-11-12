import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('../../../../src/contexts/AuthContext.js', () => ({
  useAuth: () => ({
    currentUser: { id: 'u-1', role: 'ADMIN', organizationId: 'org-1' },
    isAdmin: true,
    canAccessCommercialIntelligence: true,
    canAccessCopilotoIa: true,
  }),
}));

vi.mock('../../../../src/lib/soundEffects.js', () => ({
  SoundFX: { play: vi.fn() },
}));

import { ModuleRail } from '../../../../src/components/layout/ModuleRail.js';

function renderRail(path = '/app', panelCollapsed = false, onTogglePanel = vi.fn()) {
  return {
    onTogglePanel,
    ...render(
      <MemoryRouter initialEntries={[path]}>
        <ModuleRail panelCollapsed={panelCollapsed} onTogglePanel={onTogglePanel} />
      </MemoryRouter>,
    ),
  };
}

describe('ModuleRail', () => {
  beforeEach(() => {
    navigate.mockReset();
  });

  it('navega para o Hub Central e para um módulo interno', () => {
    renderRail('/app/analytics');
    fireEvent.click(screen.getByTestId('module-rail-hub'));
    expect(navigate).toHaveBeenCalledWith('/app');

    fireEvent.click(screen.getByTestId('module-rail-p01'));
    expect(navigate).toHaveBeenCalledWith('/app/crm');
  });

  it('não navega de novo quando o módulo já está ativo', () => {
    renderRail('/app/crm');
    fireEvent.click(screen.getByTestId('module-rail-p01'));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('abre módulo externo via window.location.assign', () => {
    const assign = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...original, assign },
    });
    try {
      renderRail('/app');
      fireEvent.click(screen.getByTestId('module-rail-m11'));
      expect(assign).toHaveBeenCalledWith('/social-selling');
      expect(navigate).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original });
    }
  });

  it('mantém o módulo mobile desabilitado e alterna o painel contextual', () => {
    const { onTogglePanel } = renderRail('/app', true);
    expect(screen.getByTestId('module-rail-m10')).toBeDisabled();
    fireEvent.click(screen.getByTestId('module-rail-toggle-panel'));
    expect(onTogglePanel).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Expandir navegação do módulo/i })).toBeInTheDocument();
  });
});

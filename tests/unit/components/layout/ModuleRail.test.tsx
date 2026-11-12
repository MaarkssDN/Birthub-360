import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { name: 'Usuária Teste', role: 'ADMIN', roleTitle: 'ADMIN' },
    isAdmin: true,
    canAccessCommercialIntelligence: true,
    canAccessCopilotoIa: true,
    logout: vi.fn(),
  }),
}));

vi.mock('../../../../src/contexts/AuthContext.js', () => ({
  useAuth: () => ({
    currentUser: { name: 'Usuária Teste', role: 'ADMIN', roleTitle: 'ADMIN' },
    isAdmin: true,
    canAccessCommercialIntelligence: true,
    canAccessCopilotoIa: true,
    logout: vi.fn(),
  }),
}));

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: { play: vi.fn() },
}));

vi.mock('../../../../src/lib/soundEffects.js', () => ({
  SoundFX: { play: vi.fn() },
}));

import { ModuleRail } from '@/components/layout/ModuleRail';

function renderRail(initialPath = '/app/prospect') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ModuleRail panelCollapsed={false} onTogglePanel={vi.fn()} />
    </MemoryRouter>,
  );
}

describe('ModuleRail', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('goHome chama navigate("/app") ao acionar o Hub Central', () => {
    renderRail('/app/crm');
    fireEvent.click(screen.getByTestId('module-rail-hub'));
    expect(navigateMock).toHaveBeenCalledWith('/app');
  });

  it('openModule chama navigate com o home do módulo quando ele não está ativo', () => {
    renderRail('/app');
    fireEvent.click(screen.getByTestId('module-rail-p01'));
    expect(navigateMock).toHaveBeenCalledWith('/app/crm');
  });

  it('openModule não navega de novo quando o módulo clicado já está ativo', () => {
    renderRail('/app/crm');
    fireEvent.click(screen.getByTestId('module-rail-p01'));
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

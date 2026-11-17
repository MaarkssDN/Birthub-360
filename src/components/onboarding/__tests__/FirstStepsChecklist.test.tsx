// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../../i18n/index.js';
import { FirstStepsChecklist } from '../FirstStepsChecklist.js';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseAuth = vi.fn();
vi.mock('../../../contexts/AuthContext.js', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderChecklist() {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <FirstStepsChecklist />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('FirstStepsChecklist', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockNavigate.mockReset();
    mockUseAuth.mockReturnValue({
      currentUser: { id: 'user-1', role: 'VISUALIZADOR' },
    });
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('não renderiza quando não há currentUser autenticado', () => {
    mockUseAuth.mockReturnValue({ currentUser: null });
    const { container } = renderChecklist();
    expect(container.firstChild).toBeNull();
  });

  it('não renderiza quando o tour já foi visto (@prospector:has_seen_tour)', () => {
    window.localStorage.setItem('@prospector:has_seen_tour', 'true');
    const { container } = renderChecklist();
    expect(container.firstChild).toBeNull();
  });

  it('não renderiza quando dispensado globalmente ou por chave do usuário', () => {
    window.localStorage.setItem('@birthhub360:first-steps:user-1:VISUALIZADOR:dismissed', 'true');
    const { container } = renderChecklist();
    expect(container.firstChild).toBeNull();
  });

  it('renderiza os passos do papel, permite marcar/desmarcar, navegar e dispensar', () => {
    renderChecklist();

    expect(screen.getByText('Primeiros passos')).toBeInTheDocument();
    expect(screen.getByText('0 de 5 concluídos')).toBeInTheDocument();

    const completeButtons = screen.getAllByRole('button', { name: 'Marcar como concluído' });
    expect(completeButtons).toHaveLength(5);

    fireEvent.click(completeButtons[0]);
    expect(screen.getByText('1 de 5 concluídos')).toBeInTheDocument();

    const completedBtn = screen.getByRole('button', { name: 'Concluído' });
    expect(completedBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(completedBtn);
    expect(screen.getByText('0 de 5 concluídos')).toBeInTheDocument();

    const openButtons = screen.getAllByRole('button', { name: /Abrir/i });
    fireEvent.click(openButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/app/workspace');

    const dismissBtn = screen.getByRole('button', { name: 'Dispensar checklist' });
    fireEvent.click(dismissBtn);
    expect(screen.queryByText('Primeiros passos')).not.toBeInTheDocument();
    expect(
      window.localStorage.getItem('@birthhub360:first-steps:user-1:VISUALIZADOR:dismissed'),
    ).toBe('true');
  });

  it('recupera estado salvo do localStorage, ignora JSON inválido e oculta quando tudo concluído', () => {
    window.localStorage.setItem(
      '@birthhub360:first-steps:anonymous:unknown:completed',
      '{json-invalido',
    );
    mockUseAuth.mockReturnValue({
      currentUser: { id: undefined, role: '' },
    });

    const { unmount } = renderChecklist();
    expect(screen.getByText('0 de 5 concluídos')).toBeInTheDocument();
    unmount();

    window.localStorage.setItem(
      '@birthhub360:first-steps:user-1:VISUALIZADOR:completed',
      JSON.stringify({ naoEhArray: true }),
    );
    mockUseAuth.mockReturnValue({
      currentUser: { id: 'user-1', role: 'VISUALIZADOR' },
    });
    const { unmount: unmountNonArray } = renderChecklist();
    expect(screen.getByText('0 de 5 concluídos')).toBeInTheDocument();
    unmountNonArray();

    window.localStorage.setItem(
      '@birthhub360:first-steps:user-1:VISUALIZADOR:completed',
      JSON.stringify(['workspace', 'crm', 'settings', 'dashboard', 'reports']),
    );
    const { container } = renderChecklist();
    expect(container.firstChild).toBeNull();
  });
});

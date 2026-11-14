// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CentralModulesHome } from '../../../../src/features/home/CentralModulesHome.js';

/**
 * Cobre o seletor de layouts (incluindo o badge "Pipeline" da Alternativa D
 * com classes de contraste corrigidas no fix de acessibilidade) e o Hub
 * Orbital (status "100% ONLINE"), garantindo que as linhas alteradas pelo
 * PR de correção de contraste permanecem renderizadas.
 */

vi.mock('../../../../src/contexts/AuthContext.js', () => ({
  useAuth: () => ({ currentUser: null, isPending: false, signOut: vi.fn() }),
}));
vi.mock('../../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({ currentUser: null, isPending: false, signOut: vi.fn() }),
}));

vi.mock('../../../../src/lib/soundEffects.js', () => ({
  SoundFX: { play: vi.fn() },
}));
vi.mock('../../../../src/lib/soundEffects', () => ({
  SoundFX: { play: vi.fn() },
}));

function renderHome(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <CentralModulesHome />
    </MemoryRouter>,
  );
}

describe('CentralModulesHome', () => {
  it('renderiza o cabeçalho e o badge Pipeline do layout flow no seletor de propostas', () => {
    renderHome();

    expect(screen.getByText(/Central de Módulos/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Alternativa D: Esteira de Ciclo de Vendas/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Pipeline')).toBeInTheDocument();
  });

  it('alterna para o layout hub e exibe o status 100% ONLINE do nó central', () => {
    renderHome('/?layout=hub');

    expect(screen.getByText('100% ONLINE')).toBeInTheDocument();
    expect(screen.getByText(/Cluster Comercial & Receita/i)).toBeInTheDocument();
  });

  it('alterna para o layout flow via botão e persiste a escolha', () => {
    renderHome();

    fireEvent.click(
      screen.getByRole('button', { name: /Alternativa D: Esteira de Ciclo de Vendas/i }),
    );

    expect(window.localStorage.getItem('@birthhub:home-layout')).toBe('flow');
  });
});

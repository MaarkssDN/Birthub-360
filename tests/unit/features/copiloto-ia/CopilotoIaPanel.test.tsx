import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({
  role: 'ADMIN' as string,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { name: 'Usuária Teste', role: authState.role, roleTitle: authState.role },
  }),
}));

vi.mock('../../../../src/contexts/AuthContext.js', () => ({
  useAuth: () => ({
    currentUser: { name: 'Usuária Teste', role: authState.role, roleTitle: authState.role },
  }),
}));

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: { play: vi.fn() },
}));

vi.mock('../../../../src/lib/soundEffects.js', () => ({
  SoundFX: { play: vi.fn() },
}));

vi.mock('@/features/copiloto-ia/components/ConversationsTab.js', () => ({
  ConversationsTab: ({ leadId }: { leadId?: string }) => (
    <div data-testid="conversas-tab">conversas:{leadId ?? 'none'}</div>
  ),
}));

vi.mock('@/features/copiloto-ia/components/BitrixMappingSettingsTab.js', () => ({
  BitrixMappingSettingsTab: () => <div data-testid="config-tab">configurações</div>,
}));

import { CopilotoIaPanel } from '@/features/copiloto-ia/components/CopilotoIaPanel';

describe('CopilotoIaPanel', () => {
  beforeEach(() => {
    authState.role = 'ADMIN';
  });

  it('renderiza o painel com a nav de abas e a aba Conversas por padrão', () => {
    render(<CopilotoIaPanel />);

    const nav = screen.getByRole('navigation', { name: 'Abas do Copiloto IA' });
    expect(nav).toHaveClass('flex', 'gap-1', 'border-b', 'border-line');
    expect(screen.getByRole('button', { name: 'Conversas' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('conversas-tab')).toHaveTextContent('conversas:none');
    expect(screen.getByRole('heading', { name: 'Copiloto IA' })).toBeInTheDocument();
  });

  it('alterna internamente para Configurações quando a aba não é controlada', () => {
    render(<CopilotoIaPanel leadId="lead-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Configurações' }));
    expect(screen.getByTestId('config-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('conversas-tab')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configurações' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('alterna para a aba Configurações quando o usuário pode gerenciar', () => {
    const onTabChange = vi.fn();
    render(<CopilotoIaPanel tab="conversas" onTabChange={onTabChange} leadId="lead-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Configurações' }));
    expect(onTabChange).toHaveBeenCalledWith('configuracoes');
  });

  it('mostra a aba Configurações e omite o chrome de página no modo embedded', () => {
    render(<CopilotoIaPanel embedded tab="configuracoes" />);

    expect(screen.queryByRole('heading', { name: 'Copiloto IA' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configurações' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByTestId('config-tab')).toBeInTheDocument();
  });

  it('esconde a aba Configurações para quem não tem papel de gestão', () => {
    authState.role = 'SDR';
    render(<CopilotoIaPanel />);

    expect(screen.getByRole('button', { name: 'Conversas' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Configurações' })).not.toBeInTheDocument();
  });
});

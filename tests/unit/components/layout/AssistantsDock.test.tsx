import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const authState = { canAccessCopilotoIa: true };

vi.mock('../../../../src/contexts/AuthContext.js', () => ({
  useAuth: () => authState,
}));

const recordState: { activeRecord: { type: string; id: string } | null } = {
  activeRecord: { type: 'lead', id: 'lead-42' },
};

vi.mock('../../../../src/hooks/useActiveRecord.js', () => ({
  useActiveRecord: () => recordState,
}));

vi.mock('../../../../src/lib/soundEffects.js', () => ({
  SoundFX: { play: vi.fn() },
}));

vi.mock('../../../../src/features/chatbook/components/FloatingChatbook.js', () => ({
  FloatingChatbook: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="floating-chatbook">
        <button type="button" data-testid="floating-chatbook-close" onClick={onClose}>
          Encerrar sessão Chatbook
        </button>
      </div>
    ) : (
      <div data-testid="floating-chatbook-hidden" />
    ),
}));

vi.mock('../../../../src/features/copiloto-ia/components/CopilotoIaPanel.js', () => ({
  CopilotoIaPanel: ({ leadId }: { leadId?: string }) => (
    <div data-testid="copiloto-ia-panel">lead:{leadId ?? 'none'}</div>
  ),
}));

import { AssistantsDock } from '../../../../src/components/layout/AssistantsDock.js';

const CHATBOOK_OPEN_KEY = '@birthhub:assistant-chatbook-open';
const COPILOTO_OPEN_KEY = '@birthhub:assistant-copiloto-open';

describe('AssistantsDock', () => {
  beforeEach(() => {
    sessionStorage.clear();
    authState.canAccessCopilotoIa = true;
    recordState.activeRecord = { type: 'lead', id: 'lead-42' };
  });

  it('abre e fecha o Chatbook, persistindo o estado', async () => {
    render(<AssistantsDock />);
    expect(screen.queryByTestId('floating-chatbook')).toBeNull();

    fireEvent.click(screen.getByTestId('assistant-chatbook-toggle'));
    expect(await screen.findByTestId('floating-chatbook')).toBeInTheDocument();
    expect(sessionStorage.getItem(CHATBOOK_OPEN_KEY)).toBe('true');

    fireEvent.click(screen.getByTestId('floating-chatbook-close'));
    await waitFor(() => expect(sessionStorage.getItem(CHATBOOK_OPEN_KEY)).toBe('false'));
  });

  it('abre o Copiloto IA com o lead ativo, fecha com Escape e com o X', async () => {
    render(<AssistantsDock />);
    fireEvent.click(screen.getByTestId('assistant-copiloto-toggle'));
    expect(await screen.findByTestId('copiloto-ia-panel')).toHaveTextContent('lead:lead-42');
    expect(screen.getByRole('complementary', { name: 'Copiloto IA' })).toBeInTheDocument();
    expect(sessionStorage.getItem(COPILOTO_OPEN_KEY)).toBe('true');

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(sessionStorage.getItem(COPILOTO_OPEN_KEY)).toBe('false'));

    fireEvent.click(screen.getByTestId('assistant-copiloto-toggle'));
    expect(await screen.findByTestId('copiloto-ia-panel')).toBeInTheDocument();
    const panel = screen.getByRole('complementary', { name: 'Copiloto IA' });
    fireEvent.click(within(panel).getByRole('button', { name: 'Fechar Copiloto IA' }));
    await waitFor(() => expect(sessionStorage.getItem(COPILOTO_OPEN_KEY)).toBe('false'));
  });

  it('esconde o Copiloto quando o papel não tem acesso', () => {
    authState.canAccessCopilotoIa = false;
    render(<AssistantsDock />);
    expect(screen.queryByTestId('assistant-copiloto-toggle')).toBeNull();
    expect(screen.getByTestId('assistant-chatbook-toggle')).toBeInTheDocument();
  });

  it('restaura o Chatbook aberto a partir do sessionStorage', async () => {
    sessionStorage.setItem(CHATBOOK_OPEN_KEY, 'true');
    render(<AssistantsDock />);
    expect(await screen.findByTestId('floating-chatbook')).toBeInTheDocument();
  });
});

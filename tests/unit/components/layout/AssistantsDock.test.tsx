import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let canAccessCopilotoIa = true;
let activeRecord: { type: string; id: string } | null = null;
const copilotoProps: Array<Record<string, unknown>> = [];

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ canAccessCopilotoIa }),
}));
vi.mock('@/hooks/useActiveRecord', () => ({
  useActiveRecord: () => ({ activeRecord }),
}));
vi.mock('@/lib/soundEffects', () => ({ SoundFX: { play: vi.fn() } }));
vi.mock('@/features/chatbook/components/FloatingChatbook', () => ({
  FloatingChatbook: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="floating-chatbook">
        <button type="button" onClick={onClose}>
          fechar-chatbook
        </button>
      </div>
    ) : null,
}));
vi.mock('@/features/copiloto-ia/components/CopilotoIaPanel', () => ({
  CopilotoIaPanel: (props: Record<string, unknown>) => {
    copilotoProps.push(props);
    return <div data-testid="copiloto-panel">copiloto</div>;
  },
}));

import { AssistantsDock } from '@/components/layout/AssistantsDock';

beforeEach(() => {
  canAccessCopilotoIa = true;
  activeRecord = null;
  copilotoProps.length = 0;
  window.sessionStorage.clear();
});

afterEach(cleanup);

describe('AssistantsDock', () => {
  it('renderiza os gatilhos de Chatbook e Copiloto IA', () => {
    render(<AssistantsDock />);
    expect(screen.getByTestId('assistant-chatbook-toggle')).toBeTruthy();
    expect(screen.getByTestId('assistant-copiloto-toggle')).toBeTruthy();
  });

  it('oculta o Copiloto quando o usuário não tem acesso', () => {
    canAccessCopilotoIa = false;
    render(<AssistantsDock />);
    expect(screen.queryByTestId('assistant-copiloto-toggle')).toBeNull();
    expect(screen.getByTestId('assistant-chatbook-toggle')).toBeTruthy();
  });

  it('abre e fecha o Chatbook persistindo em sessionStorage', async () => {
    render(<AssistantsDock />);
    fireEvent.click(screen.getByTestId('assistant-chatbook-toggle'));
    expect(await screen.findByTestId('floating-chatbook')).toBeTruthy();
    expect(window.sessionStorage.getItem('@birthhub:assistant-chatbook-open')).toBe('true');
    fireEvent.click(screen.getByLabelText('Fechar Chatbook'));
    await waitFor(() =>
      expect(window.sessionStorage.getItem('@birthhub:assistant-chatbook-open')).toBe('false'),
    );
  });

  it('abre o painel do Copiloto, fecha com Escape e envia leadId do registro ativo', async () => {
    activeRecord = { type: 'lead', id: 'lead-9' };
    render(<AssistantsDock />);
    fireEvent.click(screen.getByTestId('assistant-copiloto-toggle'));
    expect(await screen.findByTestId('copiloto-panel')).toBeTruthy();
    expect(screen.getByRole('complementary', { name: 'Copiloto IA' })).toBeTruthy();
    expect(copilotoProps.at(-1)?.leadId).toBe('lead-9');
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('copiloto-panel')).toBeNull());
  });

  it('não envia leadId quando o registro ativo não é lead', async () => {
    activeRecord = { type: 'company', id: 'c-1' };
    render(<AssistantsDock />);
    fireEvent.click(screen.getByTestId('assistant-copiloto-toggle'));
    await screen.findByTestId('copiloto-panel');
    expect(copilotoProps.at(-1)?.leadId).toBeUndefined();
  });
});

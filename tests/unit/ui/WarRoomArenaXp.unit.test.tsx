import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WarRoomArenaView } from '../../../src/features/gamification/components/WarRoomArenaView.js';

vi.mock('../../../src/contexts/AuthContext.js', () => ({
  useAuth: () => ({ currentUser: { id: 'usr-closer-01', name: 'Closer', role: 'CLOSER' } }),
}));
vi.mock('../../../src/lib/soundEffects.js', () => ({ SoundFX: { play: vi.fn() } }));
vi.mock('../../../src/lib/toast.js', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Respostas escolhidas para cair em cada faixa da heurística local de treino
// (nota composta >= 85 → 120 XP; 75..84 → 80 XP; < 75 → 50 XP).
const RESPOSTA_ALTA =
  'Entendo sua preocupação. Me conta qual o desafio hoje? Posso ajudar junto, como parceiro, com ROI, retorno, economia e resultado, com clareza e suporte.';
const RESPOSTA_MEDIA = 'Entendo o desafio, como posso ajudar? Veremos o retorno juntos com calma.';
const RESPOSTA_BAIXA = 'Ok.';

function startDuel() {
  render(<WarRoomArenaView />);
  fireEvent.click(screen.getByRole('button', { name: /Entrar na Arena Agora/i }));
}

function submitDefense(text: string) {
  fireEvent.change(screen.getByPlaceholderText(/Estruture sua resposta/i), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('button', { name: /Enviar Defesa/i }));
  act(() => {
    vi.advanceTimersByTime(1500);
  });
}

describe('WarRoomArenaView — XP por round e fechamento do duelo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['alta', RESPOSTA_ALTA, 120],
    ['média', RESPOSTA_MEDIA, 80],
    ['baixa', RESPOSTA_BAIXA, 50],
  ])('concede o XP da faixa correta para resposta %s', (_faixa, resposta, xp) => {
    startDuel();
    submitDefense(resposta);

    expect(screen.getAllByText(new RegExp(`\\+${xp} XP`)).length).toBeGreaterThan(0);
  });

  it('o lobby anuncia o teto de XP derivado de rounds x XP máximo por round', () => {
    render(<WarRoomArenaView />);
    const rounds = Number(screen.getByText(/\d+ Rounds · Feedback/).textContent?.match(/\d+/)?.[0]);
    expect(screen.getByText(`Até ${rounds * 120} XP/sessão`)).toBeInTheDocument();
  });

  it('ao concluir todos os rounds, a mensagem final usa a mesma contagem do lobby', () => {
    startDuel();
    const rounds = Number(
      screen.queryByText(/Round 1 de \d+/)?.textContent?.match(/de (\d+)/)?.[1],
    );
    expect(rounds).toBeGreaterThan(0);

    for (let i = 0; i < rounds; i++) {
      submitDefense(RESPOSTA_ALTA);
      const next = screen.getByRole('button', {
        name: i === rounds - 1 ? /Finalizar Duelo/i : /Próximo Round/i,
      });
      fireEvent.click(next);
    }

    expect(screen.getByText('Duelo Concluído com Sucesso!')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Você enfrentou ${rounds} rounds`))).toBeInTheDocument();
  });
});

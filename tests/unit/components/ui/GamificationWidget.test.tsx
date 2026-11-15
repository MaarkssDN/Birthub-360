import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SellerScore } from '@/features/gamification/domain/Gamification';
import { GamificationWidget } from '@/components/ui/GamificationWidget';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: {
    play: vi.fn(),
    isEnabled: vi.fn(() => true),
    toggleMute: vi.fn(() => false),
  },
}));

// WebGL indisponível em jsdom — o núcleo 3D é testado em Gamified3DOrb.test.tsx.
vi.mock('@/components/ui/Gamified3DOrb', () => ({
  Gamified3DOrb: () => <div data-testid="orb-mock" />,
}));

afterEach(cleanup);

const score: SellerScore = {
  sellerName: 'Ana',
  totalPoints: 450,
  level: 3,
  levelTitle: 'Closer',
  callsCount: 60,
  meetingsCount: 4,
  qualifiedCount: 7,
  dealsClosed: 2,
  wonRevenue: 150000,
  badges: [],
  streakDays: 5,
};

describe('GamificationWidget', () => {
  it('mostra estado vazio honesto sem perfil de gamificação', () => {
    render(<GamificationWidget sellerScore={null} />);
    expect(screen.getByText('Gamificação indisponível')).toBeInTheDocument();
    expect(screen.queryByTestId('orb-mock')).not.toBeInTheDocument();
  });

  it('renderiza nível, XP, streak e orb 3D com perfil real', () => {
    render(<GamificationWidget sellerScore={score} />);
    expect(screen.getByText(/Nível 3/)).toBeInTheDocument();
    expect(screen.getByText(/450/)).toBeInTheDocument();
    expect(screen.getByText(/5 Dias Seguidos/)).toBeInTheDocument();
    expect(screen.getByTestId('orb-mock')).toBeInTheDocument();
  });

  it('abre o painel de missões e alterna para conquistas', () => {
    render(<GamificationWidget sellerScore={score} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir missões e conquistas' }));

    expect(screen.getByText('Missões Diárias')).toBeInTheDocument();
    expect(screen.getByText('Qualificar 5 novos leads corporativos hoje')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Conquistas 3D' }));
    // Com badges:[] o widget cai nos BADGE_DEFINITIONS — ao menos uma conquista é renderizada.
    expect(screen.getAllByText(/Desbloqueada|Bloqueada/).length).toBeGreaterThan(0);
  });

  it('alterna o mute de som', async () => {
    const { SoundFX } = await import('@/lib/soundEffects');
    render(<GamificationWidget sellerScore={score} />);
    fireEvent.click(screen.getByRole('button', { name: 'Desativar efeitos sonoros' }));
    expect(SoundFX.toggleMute).toHaveBeenCalled();
  });

  it('sem streak não exibe o selo de dias seguidos', () => {
    render(<GamificationWidget sellerScore={{ ...score, streakDays: 0 }} />);
    expect(screen.queryByText(/Dias Seguidos/)).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MagneticButton } from '@/features/landing/luxury/components/MagneticButton';
import { SpotlightCard } from '@/features/landing/luxury/components/SpotlightCard';
import { SculpturalReveal } from '@/features/landing/luxury/components/SculpturalReveal';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: { play: vi.fn() },
}));

// useReducedMotion do framer-motion não é controlável via matchMedia stub no jsdom
// (o hook resolve a media query por conta própria) — controlamos via flag hoisted.
const { reducedMotionFlag } = vi.hoisted(() => ({ reducedMotionFlag: { value: false } }));

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    useReducedMotion: () => reducedMotionFlag.value,
  };
});

import { SoundFX } from '@/lib/soundEffects';

const playMock = vi.mocked(SoundFX.play);

beforeEach(() => {
  playMock.mockClear();
});

describe('MagneticButton', () => {
  it('renderiza children e dispara onClick + som de clique', () => {
    const onClick = vi.fn();
    render(<MagneticButton onClick={onClick}>Entrar</MagneticButton>);

    const btn = screen.getByRole('button', { name: 'Entrar' });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(playMock).toHaveBeenCalledWith('click');
  });

  it('playSound=false não toca sons; disabled bloqueia clique visualmente', () => {
    const onClick = vi.fn();
    render(
      <MagneticButton onClick={onClick} playSound={false} disabled>
        Travado
      </MagneticButton>,
    );

    const btn = screen.getByRole('button', { name: 'Travado' });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
    expect(playMock).not.toHaveBeenCalled();
  });

  it('mouse move/enter/leave atualizam posição magnética e tocam som de hover', () => {
    render(<MagneticButton onClick={vi.fn()}>Hover</MagneticButton>);
    const btn = screen.getByRole('button', { name: 'Hover' });

    fireEvent.mouseEnter(btn);
    expect(playMock).toHaveBeenCalledWith('hover');

    // jsdom retorna rect zerado — o cálculo ainda executa sem erro
    fireEvent.mouseMove(btn, { clientX: 30, clientY: 20 });
    fireEvent.mouseLeave(btn);
    expect(btn).toBeInTheDocument();
  });
});

describe('SpotlightCard', () => {
  it('renderiza children sem role=button quando não há onClick', () => {
    const { container } = render(<SpotlightCard>Conteúdo</SpotlightCard>);
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
    expect(container.firstChild).not.toHaveAttribute('role');
  });

  it('com onClick vira button acessível: clique, Enter e Espaço disparam', () => {
    const onClick = vi.fn();
    render(
      <SpotlightCard onClick={onClick} glowColor="rgba(1,2,3,0.5)">
        Card clicável
      </SpotlightCard>,
    );

    const card = screen.getByRole('button', { name: 'Card clicável' });
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    fireEvent.keyDown(card, { key: 'a' }); // tecla irrelevante não dispara
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('mousemove/enter/leave controlam o glow spotlight sem erro', () => {
    const { container } = render(<SpotlightCard>Glow</SpotlightCard>);
    const card = container.firstElementChild as HTMLElement;
    expect(card).not.toBeNull();

    fireEvent.mouseEnter(card);
    fireEvent.mouseMove(card, { clientX: 10, clientY: 10 });
    fireEvent.mouseLeave(card);
    expect(card).toBeInTheDocument();
  });
});

describe('SculpturalReveal', () => {
  beforeEach(() => {
    reducedMotionFlag.value = false;
  });

  it('renderiza via framer-motion no caminho padrão (com wrapper de overflow)', () => {
    const { container } = render(
      <SculpturalReveal delay={0.1} className="extra">
        <span>Revelado</span>
      </SculpturalReveal>,
    );
    expect(screen.getByText('Revelado')).toBeInTheDocument();
    expect(container.querySelector('.overflow-hidden.extra')).not.toBeNull();
  });

  it('prefers-reduced-motion renderiza elemento estático sem wrapper de animação', () => {
    reducedMotionFlag.value = true;

    const { container } = render(
      <SculpturalReveal as="h2" delay={0.2}>
        <span>Estático</span>
      </SculpturalReveal>,
    );

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Estático');
    expect(container.querySelector('.overflow-hidden')).toBeNull();
  });
});

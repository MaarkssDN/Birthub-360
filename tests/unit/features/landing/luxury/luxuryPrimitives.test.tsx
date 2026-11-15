import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MagneticButton } from '@/features/landing/luxury/components/MagneticButton';
import { SculpturalReveal } from '@/features/landing/luxury/components/SculpturalReveal';
import { SpotlightCard } from '@/features/landing/luxury/components/SpotlightCard';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

describe('MagneticButton', () => {
  it('renderiza children e dispara onClick com som de click', () => {
    const onClick = vi.fn();
    render(<MagneticButton onClick={onClick}>Entrar</MagneticButton>);

    const btn = screen.getByRole('button', { name: 'Entrar' });
    fireEvent.click(btn);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('reage a mouse enter/leave/move sem quebrar', () => {
    render(<MagneticButton>Flutuar</MagneticButton>);

    const btn = screen.getByRole('button', { name: 'Flutuar' });
    fireEvent.mouseEnter(btn);
    fireEvent.mouseMove(btn, { clientX: 10, clientY: 10 });
    fireEvent.mouseLeave(btn);

    expect(btn).toBeInTheDocument();
  });

  it('não toca som quando playSound é false', async () => {
    const { SoundFX } = await import('@/lib/soundEffects');
    vi.mocked(SoundFX.play).mockClear();
    render(
      <MagneticButton playSound={false} onClick={() => {}}>
        Silencioso
      </MagneticButton>,
    );

    const btn = screen.getByRole('button', { name: 'Silencioso' });
    fireEvent.mouseEnter(btn);
    fireEvent.click(btn);

    expect(SoundFX.play).not.toHaveBeenCalled();
  });

  it('respeita disabled', () => {
    const onClick = vi.fn();
    render(
      <MagneticButton disabled onClick={onClick}>
        Travado
      </MagneticButton>,
    );

    const btn = screen.getByRole('button', { name: 'Travado' });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('SculpturalReveal', () => {
  it('renderiza children dentro do wrapper de revelação', () => {
    render(
      <SculpturalReveal delay={0.1}>
        <h2>Título Monumental</h2>
      </SculpturalReveal>,
    );

    expect(screen.getByText('Título Monumental')).toBeInTheDocument();
  });

  it('renderiza com tag semântica customizada', () => {
    render(
      <SculpturalReveal as="h3" className="custom-class">
        Subtítulo
      </SculpturalReveal>,
    );

    const el = screen.getByText('Subtítulo');
    expect(el.tagName).toBe('H3');
  });
});

describe('SpotlightCard', () => {
  it('renderiza children sem role de botão quando não há onClick', () => {
    const { container } = render(<SpotlightCard>Conteúdo</SpotlightCard>);

    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
    expect(container.firstElementChild).not.toHaveAttribute('role');
  });

  it('vira botão acessível e dispara onClick por clique e teclado', () => {
    const onClick = vi.fn();
    render(
      <SpotlightCard onClick={onClick} glowColor="rgba(1,2,3,0.5)">
        Card clicável
      </SpotlightCard>,
    );

    const card = screen.getByRole('button', { name: /Card clicável/i });
    expect(card).toHaveAttribute('tabindex', '0');

    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(3);

    // Tecla irrelevante não dispara
    fireEvent.keyDown(card, { key: 'Escape' });
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('atualiza o spotlight ao mover e sair do cursor', () => {
    const { container } = render(<SpotlightCard>Spot</SpotlightCard>);

    const card = container.firstElementChild as HTMLElement;
    const glow = card.firstElementChild as HTMLElement;

    fireEvent.mouseEnter(card);
    expect(glow.style.opacity).toBe('1');

    fireEvent.mouseMove(card, { clientX: 30, clientY: 40 });
    fireEvent.mouseLeave(card);
    expect(glow.style.opacity).toBe('0');
  });
});

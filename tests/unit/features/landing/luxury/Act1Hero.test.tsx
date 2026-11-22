import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Act1Hero } from '@/features/landing/luxury/components/Act1Hero';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

// O hero 3D usa react-three-fiber/WebGL, indisponível em jsdom — mock do componente
// lazy para exercitar o restante do Act1Hero sem depender de GPU.
vi.mock('@/components/brand/BirthHubOrbit360', () => ({
  BirthHubOrbit360: () => <div data-testid="orbit-360-mock" />,
  default: () => <div data-testid="orbit-360-mock" />,
}));

describe('Act1Hero', () => {
  it('renderiza a tese de poder, CTAs e selos de conformidade', async () => {
    render(<Act1Hero />);

    expect(
      screen.getByText('Arquitetura de Comando 360º · 2026'),
    ).toBeInTheDocument();
    expect(screen.getByText('A inteligência de negócios.')).toBeInTheDocument();
    expect(screen.getByText('Unificada e soberana.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Solicitar Demonstração Executiva/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Compreender a Arquitetura/i }),
    ).toHaveAttribute('href', '#tese');
    expect(screen.getByText('Multi-Tenant RLS')).toBeInTheDocument();
    expect(screen.getByText('LGPD por design')).toBeInTheDocument();

    // Componente 3D lazy resolvido via mock
    expect(await screen.findByTestId('orbit-360-mock')).toBeInTheDocument();
  });

  it('dispara onOpenPrivateAccess e som ao clicar no CTA primário', async () => {
    const { SoundFX } = await import('@/lib/soundEffects');
    const onOpenPrivateAccess = vi.fn();
    render(<Act1Hero onOpenPrivateAccess={onOpenPrivateAccess} />);

    fireEvent.click(
      screen.getByRole('button', { name: /Solicitar Demonstração Executiva/i }),
    );

    expect(SoundFX.play).toHaveBeenCalledWith('confirm');
    expect(onOpenPrivateAccess).toHaveBeenCalledTimes(1);
  });

  it('toca som de foco ao pressionar o link secundário', async () => {
    const { SoundFX } = await import('@/lib/soundEffects');
    render(<Act1Hero />);

    fireEvent.pointerDown(
      screen.getByRole('link', { name: /Compreender a Arquitetura/i }),
    );

    expect(SoundFX.play).toHaveBeenCalledWith('focus');
  });
});

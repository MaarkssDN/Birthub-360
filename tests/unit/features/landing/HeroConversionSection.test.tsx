import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroConversionSection } from '@/features/landing/components/HeroConversionSection';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

vi.mock('@/lib/analytics/conversionTelemetry', () => ({
  trackHeroVariantImpression: vi.fn(),
  trackHeroVariantSwitched: vi.fn(),
  trackHeroCtaPrimaryClick: vi.fn(),
  trackHeroRoiSimulatorOpened: vi.fn(),
  trackRoiSimulatorConverted: vi.fn(),
}));

describe('HeroConversionSection', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('deve renderizar a variante inicial A e alternar para B ao clicar', () => {
    const onGoToLogin = vi.fn();
    render(<HeroConversionSection onGoToLogin={onGoToLogin} />);

    expect(screen.getByText(/REVENUE COMMAND CENTER/i)).toBeInTheDocument();

    const variantBBtn = screen.getByRole('button', { name: /B · Automação IA/i });
    fireEvent.click(variantBBtn);

    expect(screen.getByText(/AUTONOMOUS REVOPS PLATFORM/i)).toBeInTheDocument();
  });

  it('deve acionar onGoToLogin ao clicar no CTA primário', () => {
    const onGoToLogin = vi.fn();
    render(<HeroConversionSection onGoToLogin={onGoToLogin} />);

    const primaryCta = screen.getByRole('button', { name: /Ver Cockpit em Ação/i });
    fireEvent.click(primaryCta);

    expect(onGoToLogin).toHaveBeenCalledTimes(1);
  });

  it('deve abrir o modal de simulador ao clicar no CTA secundário', () => {
    render(<HeroConversionSection onGoToLogin={vi.fn()} />);

    const secondaryCta = screen.getByRole('button', { name: /Simular Previsibilidade/i });
    fireEvent.click(secondaryCta);

    expect(screen.getByText(/Simulador Executivo de Previsibilidade/i)).toBeInTheDocument();
  });
});

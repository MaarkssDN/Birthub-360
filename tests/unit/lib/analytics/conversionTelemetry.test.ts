import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  trackHeroVariantImpression,
  trackHeroCtaPrimaryClick,
  trackHeroRoiSimulatorOpened,
  trackRoiSimulatorConverted,
  trackHeroVariantSwitched,
} from '@/lib/analytics/conversionTelemetry';
import posthog from 'posthog-js';

vi.mock('posthog-js', () => ({
  default: {
    __loaded: true,
    capture: vi.fn(),
  },
}));

describe('conversionTelemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];
  });

  it('deve registrar impressão de variante e deduplicar na mesma sessão', () => {
    trackHeroVariantImpression('A');

    expect(posthog.capture).toHaveBeenCalledWith(
      'hero_variant_impression',
      expect.objectContaining({
        variant: 'A',
      }),
    );

    const gWindow = window as unknown as { dataLayer: Array<{ event: string; cro_variant: string }> };
    expect(gWindow.dataLayer.length).toBe(1);
    expect(gWindow.dataLayer[0].event).toBe('hero_variant_impression');
    expect(gWindow.dataLayer[0].cro_variant).toBe('A');

    // Chamar de novo com a mesma variante não deve duplicar o evento
    trackHeroVariantImpression('A');
    expect(gWindow.dataLayer.length).toBe(1);

    // Chamar com variante diferente deve registrar novo evento
    trackHeroVariantImpression('B');
    expect(gWindow.dataLayer.length).toBe(2);
    expect(gWindow.dataLayer[1].cro_variant).toBe('B');
  });

  it('deve registrar clique no CTA primário do Hero', () => {
    trackHeroCtaPrimaryClick('B', 'Agendar Demonstração');

    expect(posthog.capture).toHaveBeenCalledWith(
      'hero_cta_primary_click',
      expect.objectContaining({
        variant: 'B',
        ctaText: 'Agendar Demonstração',
        destination: 'login_or_platform',
      }),
    );

    const gWindow = window as unknown as { dataLayer: Array<{ event: string; ctaText: string }> };
    expect(gWindow.dataLayer[0].event).toBe('hero_cta_primary_click');
    expect(gWindow.dataLayer[0].ctaText).toBe('Agendar Demonstração');
  });

  it('deve registrar abertura do simulador de ROI com o trigger correto', () => {
    trackHeroRoiSimulatorOpened('C', 'problem_section_banner');

    expect(posthog.capture).toHaveBeenCalledWith(
      'hero_roi_simulator_opened',
      expect.objectContaining({
        variant: 'C',
        trigger: 'problem_section_banner',
      }),
    );
  });

  it('deve registrar conversão completa no simulador de ROI', () => {
    const simulationData = {
      dealsCount: 40,
      avgTicket: 15000,
      leakRate: 0.18,
      recoverableMonthly: 108000,
      annualRecoverable: 1296000,
    };

    trackRoiSimulatorConverted('A', simulationData);

    expect(posthog.capture).toHaveBeenCalledWith(
      'roi_simulator_converted',
      expect.objectContaining({
        variant: 'A',
        dealsCount: 40,
        annualRecoverable: 1296000,
      }),
    );
  });

  it('deve registrar alternância manual de variante', () => {
    trackHeroVariantSwitched('A', 'C');

    expect(posthog.capture).toHaveBeenCalledWith(
      'hero_variant_switched',
      expect.objectContaining({
        variant: 'C',
        fromVariant: 'A',
        toVariant: 'C',
      }),
    );
  });

  it('deve expor histórico em window.__getConversionEvents', () => {
    trackHeroCtaPrimaryClick('A', 'Iniciar');

    const getEvents = (
      window as unknown as { __getConversionEvents?: () => Array<{ eventName: string }> }
    ).__getConversionEvents;

    expect(getEvents).toBeDefined();
    if (getEvents) {
      const events = getEvents();
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events.some((e) => e.eventName === 'hero_cta_primary_click')).toBe(true);
    }
  });
});

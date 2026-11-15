import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHeroN1Motion } from '@/features/landing/components/hero-n1/HeroMotion';

const originalMatchMedia = window.matchMedia;

function stubMatchMedia(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduced && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  window.matchMedia = originalMatchMedia;
});

describe('useHeroN1Motion', () => {
  it('inicia reproduzindo e marca sequência concluída após 3200ms', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useHeroN1Motion());

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.isReducedMotion).toBe(false);
    expect(result.current.statusMessage).toBe(
      'Demonstração ilustrativa pronta · 5 etapas do pipeline comercial',
    );

    act(() => {
      vi.advanceTimersByTime(3300);
    });
    expect(result.current.statusMessage).toBe(
      'Sequência concluída · Oportunidade #1042 na etapa Proposta',
    );
  });

  it('replaySequence reinicia o ciclo: playing → concluído', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useHeroN1Motion());

    act(() => result.current.replaySequence());
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.statusMessage).toBe(
      'Reproduzindo sequência do centro de comando...',
    );

    // duplo rAF + timer de conclusão
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3300);
    });
    expect(result.current.statusMessage).toBe(
      'Sequência concluída · Oportunidade #1042 na etapa Proposta',
    );
  });

  it('prefers-reduced-motion desativa a sequência e replay vira no-op estático', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useHeroN1Motion());

    expect(result.current.isReducedMotion).toBe(true);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.statusMessage).toBe(
      'Modo de movimento reduzido ativo · demonstração estática',
    );

    act(() => result.current.replaySequence());
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.statusMessage).toBe(
      'Modo de movimento reduzido ativo · demonstração estática',
    );
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LuxuryHeaderHUD } from '@/features/landing/luxury/components/LuxuryHeaderHUD';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: { play: vi.fn() },
}));

import { SoundFX } from '@/lib/soundEffects';

const playMock = vi.mocked(SoundFX.play);

const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', { value, configurable: true, writable: true });
}

function renderHeader(onOpenPrivateAccess = vi.fn()) {
  render(
    <MemoryRouter>
      <LuxuryHeaderHUD onOpenPrivateAccess={onOpenPrivateAccess} />
    </MemoryRouter>,
  );
  return onOpenPrivateAccess;
}

beforeEach(() => {
  playMock.mockClear();
});

afterEach(() => {
  if (originalScrollY) {
    Object.defineProperty(window, 'scrollY', originalScrollY);
  }
  vi.useRealTimers();
});

describe('LuxuryHeaderHUD — interações', () => {
  it('alterna o estilo do header ao rolar além de 40px', () => {
    setScrollY(0);
    const { container } = render(
      <MemoryRouter>
        <LuxuryHeaderHUD />
      </MemoryRouter>,
    );
    const header = container.querySelector('header')!;
    expect(header.className).toContain('bg-transparent');

    setScrollY(120);
    fireEvent.scroll(window);
    expect(header.className).toContain('bg-[#0D0D0D]/85');
    expect(header.className).toContain('backdrop-blur-xl');
  });

  it('telemetria de latência oscila via intervalo e links da nav tocam som de foco', () => {
    vi.useFakeTimers();
    renderHeader();

    expect(screen.getByText(/LATÊNCIA:/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(4600);
    });
    // intervalo executou sem erro — valor continua renderizado
    expect(screen.getByText(/\d+(\.\d)?ms/)).toBeInTheDocument();

    for (const name of ['A Tese', 'Órbita 360º', 'Enxame IA', 'Métricas']) {
      const link = screen.getByRole('link', { name });
      fireEvent.pointerDown(link);
      expect(playMock).toHaveBeenCalledWith('focus');
    }

    // Link da marca toca som de navegação
    fireEvent.click(screen.getByRole('link', { name: /BIRTH HUB/i }));
    expect(playMock).toHaveBeenCalledWith('navigate');
  });
});

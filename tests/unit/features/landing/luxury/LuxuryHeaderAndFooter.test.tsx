import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LuxuryHeaderHUD } from '@/features/landing/luxury/components/LuxuryHeaderHUD';
import { LuxuryFooter } from '@/features/landing/luxury/components/LuxuryFooter';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

describe('LuxuryHeaderHUD & LuxuryFooter', () => {
  it('LuxuryHeaderHUD renderiza marca e dispara onOpenPrivateAccess', () => {
    const onOpenPrivateAccess = vi.fn();
    render(
      <MemoryRouter>
        <LuxuryHeaderHUD onOpenPrivateAccess={onOpenPrivateAccess} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/BIRTH HUB/i)).toBeInTheDocument();
    expect(screen.getByText(/Central de Comando/i)).toBeInTheDocument();

    const portalBtn = screen.getByRole('button', { name: /Acesso Reservado/i });
    fireEvent.click(portalBtn);
    expect(onOpenPrivateAccess).toHaveBeenCalledTimes(1);
  });

  it('LuxuryFooter renderiza links de compliance LGPD e termos', () => {
    render(
      <MemoryRouter>
        <LuxuryFooter />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Privacidade & LGPD/i)).toBeInTheDocument();
    expect(screen.getByText(/Termos de Uso/i)).toBeInTheDocument();
    expect(screen.getByText(/Acesso ao Sistema/i)).toBeInTheDocument();
    expect(screen.getByText(/Todos os direitos reservados/i)).toBeInTheDocument();
  });

  it('LuxuryHeaderHUD alterna estilo ao rolar e atualiza a telemetria de latência', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(
        <MemoryRouter>
          <LuxuryHeaderHUD onOpenPrivateAccess={vi.fn()} />
        </MemoryRouter>,
      );

      const header = container.querySelector('header') as HTMLElement;
      expect(header.className).toContain('py-6');

      Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 });
      act(() => {
        fireEvent.scroll(window);
      });
      expect(header.className).toContain('py-3');
      expect(header.className).toContain('backdrop-blur-xl');

      Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
      act(() => {
        fireEvent.scroll(window);
      });
      expect(header.className).toContain('py-6');

      // Intervalo de jitter de latência (4.5s) — Math.random fixo torna determinístico
      vi.spyOn(Math, 'random').mockReturnValue(0.9);
      const latencyEl = screen.getByText(/ms/);
      expect(latencyEl.textContent).toBe('11.4ms');
      act(() => {
        vi.advanceTimersByTime(4600);
      });
      // jitter = 0.9*1.8-0.9 = 0.72 → 11.4+0.72 = 12.12 → '12.1ms'
      expect(screen.getByText('12.1ms')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });
});

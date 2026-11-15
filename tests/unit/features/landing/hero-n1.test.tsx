import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LandingHero } from '@/features/landing/components/hero-n1/LandingHero';
import { HeroEditorialHeadline } from '@/features/landing/components/hero-n1/HeroEditorialHeadline';
import { HeroCommandCenter } from '@/features/landing/components/hero-n1/HeroCommandCenter';
import { useHeroN1Motion } from '@/features/landing/components/hero-n1/HeroMotion';
import { renderHook } from '@testing-library/react';

const baseProps = {
  abVariant: 'A' as const,
  onPrimaryCtaClick: vi.fn(),
  onSecondaryCtaClick: vi.fn(),
  onGoToLogin: vi.fn(),
  onOpenRoiSimulator: vi.fn(),
  onOpenCommandSandbox: vi.fn(),
};

const originalScrollIntoView = Element.prototype.scrollIntoView;

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterAll(() => {
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

describe('LandingHero (hero-n1)', () => {
  it('renderiza a manchete editorial e o centro de comando', () => {
    render(<LandingHero {...baseProps} />);

    expect(
      screen.getByRole('heading', { name: /Dados que conectam/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Centro de comando')).toBeInTheDocument();
    expect(screen.getByText('Pipeline comercial')).toBeInTheDocument();
    expect(screen.getByText('Copiloto IA')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/demonstração/i);
  });

  it('dispara os callbacks dos CTAs', () => {
    render(<LandingHero {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Simular ROI/i }));
    expect(baseProps.onOpenRoiSimulator).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Acessar Plataforma/i }));
    expect(baseProps.onGoToLogin).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Reproduzir sequência/i }));
    expect(screen.getByRole('status')).toHaveTextContent(
      /Reproduzindo sequência/i,
    );
  });

  it('mostra nota de variante B quando abVariant=B', () => {
    render(<LandingHero {...baseProps} abVariant="B" />);

    expect(
      screen.getByText(/Multiplique a capacidade de vendas/i),
    ).toBeInTheDocument();
  });
});

describe('HeroEditorialHeadline', () => {
  function renderHeadline(overrides = {}) {
    return render(
      <HeroEditorialHeadline
        abVariant="A"
        onPrimaryCtaClick={vi.fn()}
        onGoToLogin={vi.fn()}
        onOpenRoiSimulator={vi.fn()}
        {...overrides}
      />,
    );
  }

  it('rola suavemente até #demonstracao e foca o primeiro campo', () => {
    vi.useFakeTimers();
    try {
      const onPrimary = vi.fn();
      const { container } = renderHeadline({ onPrimaryCtaClick: onPrimary });

      const demoSection = document.createElement('div');
      demoSection.id = 'demonstracao';
      const leadInput = document.createElement('input');
      leadInput.id = 'lead-nome';
      demoSection.appendChild(leadInput);
      document.body.appendChild(demoSection);

      fireEvent.click(screen.getByRole('link', { name: /Agendar demonstração/i }));

      expect(onPrimary).toHaveBeenCalledTimes(1);
      expect(demoSection.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });

      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(document.activeElement).toBe(leadInput);

      document.body.removeChild(demoSection);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cai no comportamento padrão quando a âncora não existe', () => {
    renderHeadline();

    const link = screen.getByRole('link', { name: /Conhecer os 11 módulos/i });
    // Sem elemento #destaques no documento, o clique não deve quebrar
    expect(() => fireEvent.click(link)).not.toThrow();
  });
});

describe('HeroCommandCenter', () => {
  it('renderiza stepper acessível e dispara replay/sandbox', () => {
    const onReplay = vi.fn();
    const onSandbox = vi.fn();
    render(
      <HeroCommandCenter
        statusMessage="status de teste"
        onReplaySequence={onReplay}
        onOpenCommandSandbox={onSandbox}
      />,
    );

    expect(
      screen.getByRole('list', { name: /Etapas do pipeline comercial/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Oportunidade #1042')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('status de teste');

    fireEvent.click(screen.getByRole('button', { name: /Reproduzir sequência/i }));
    expect(onReplay).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Abrir Command Center/i }));
    expect(onSandbox).toHaveBeenCalledTimes(1);
  });

  it('omite o link do sandbox quando callback não é fornecido', () => {
    render(
      <HeroCommandCenter statusMessage="ok" onReplaySequence={vi.fn()} />,
    );

    expect(
      screen.queryByRole('button', { name: /Abrir Command Center/i }),
    ).not.toBeInTheDocument();
  });
});

describe('useHeroN1Motion', () => {
  it('inicia reproduzindo e conclui a sequência após o timeout', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useHeroN1Motion());

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.statusMessage).toMatch(/Demonstração ilustrativa/);

      act(() => {
        vi.advanceTimersByTime(3300);
      });
      expect(result.current.statusMessage).toMatch(/Sequência concluída/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('replaySequence reinicia a sequência e atualiza status', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useHeroN1Motion());

      act(() => {
        result.current.replaySequence();
      });
      expect(result.current.statusMessage).toMatch(/Reproduzindo sequência/);

      // Duplo rAF antes de voltar a tocar
      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(result.current.isPlaying).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

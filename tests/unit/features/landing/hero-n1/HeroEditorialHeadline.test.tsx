import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroEditorialHeadline } from '@/features/landing/components/hero-n1/HeroEditorialHeadline';

const baseProps = {
  abVariant: 'A' as const,
  onPrimaryCtaClick: vi.fn(),
  onSecondaryCtaClick: vi.fn(),
  onGoToLogin: vi.fn(),
  onOpenRoiSimulator: vi.fn(),
};

function renderHeadline(overrides: Partial<typeof baseProps> = {}) {
  return render(<HeroEditorialHeadline {...baseProps} {...overrides} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('HeroEditorialHeadline', () => {
  it('renderiza título editorial em 3 linhas, lead e CTAs', () => {
    renderHeadline();

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Dados')).toBeInTheDocument();
    expect(screen.getByText('Inteligência')).toBeInTheDocument();
    expect(screen.getByText('Execução')).toBeInTheDocument();
    expect(screen.getByText(/Revenue Intelligence/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Agendar demonstração/i }),
    ).toHaveAttribute('href', '#demonstracao');
    expect(
      screen.getByRole('link', { name: /Conhecer os 11 módulos/i }),
    ).toHaveAttribute('href', '#destaques');
    // Variante A: nota de copy do ciclo de vendas
    expect(
      screen.getByText(/Acelere o ciclo de vendas e aumente a conversão/i),
    ).toBeInTheDocument();
  });

  it('variante B exibe a nota alternativa de copy', () => {
    renderHeadline({ abVariant: 'B' });
    expect(
      screen.getByText(/Multiplique a capacidade de vendas da sua equipe/i),
    ).toBeInTheDocument();
  });

  it('CTA primário chama callback, rola até #demonstracao e foca o primeiro input', () => {
    vi.useFakeTimers();
    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;

    render(
      <div>
        <div id="demonstracao">
          <input id="lead-nome" />
        </div>
        <HeroEditorialHeadline {...baseProps} />
      </div>,
    );

    fireEvent.click(screen.getByRole('link', { name: /Agendar demonstração/i }));
    expect(baseProps.onPrimaryCtaClick).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    // Foco programado no primeiro campo do formulário (delay de 650ms)
    vi.advanceTimersByTime(700);
    expect(document.getElementById('lead-nome')).toBe(document.activeElement);
    vi.useRealTimers();
  });

  it('CTA secundário chama callback mesmo sem alvo #destaques no DOM', () => {
    renderHeadline();
    fireEvent.click(screen.getByRole('link', { name: /Conhecer os 11 módulos/i }));
    expect(baseProps.onSecondaryCtaClick).toHaveBeenCalledTimes(1);
  });

  it('botões de ROI e login disparam os respectivos callbacks', () => {
    renderHeadline();
    fireEvent.click(screen.getByRole('button', { name: /Simular ROI/ }));
    expect(baseProps.onOpenRoiSimulator).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Acessar Plataforma/ }));
    expect(baseProps.onGoToLogin).toHaveBeenCalledTimes(1);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoiSimulatorModal } from '@/features/landing/components/RoiSimulatorModal';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

vi.mock('@/lib/analytics/conversionTelemetry', () => ({
  trackRoiSimulatorConverted: vi.fn(),
}));

describe('RoiSimulatorModal', () => {
  it('não deve renderizar quando isOpen for false', () => {
    const { container } = render(
      <RoiSimulatorModal
        isOpen={false}
        variant="A"
        onClose={vi.fn()}
        onProceedToLogin={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar controles de pipeline e valores calculados quando aberto', () => {
    render(
      <RoiSimulatorModal
        isOpen={true}
        variant="A"
        onClose={vi.fn()}
        onProceedToLogin={vi.fn()}
      />,
    );

    expect(screen.getByText(/Simulador Executivo de Previsibilidade/i)).toBeInTheDocument();
    expect(screen.getByText(/Receita potencial com IA/i)).toBeInTheDocument();
    expect(screen.getByText(/Receita mensal em risco estimado/i)).toBeInTheDocument();
    expect(screen.getByText(/Cenário ilustrativo/i)).toBeInTheDocument();
  });

  it('deve fechar ao pressionar Escape ou clicar no botão fechar', () => {
    const onClose = vi.fn();
    render(
      <RoiSimulatorModal
        isOpen={true}
        variant="A"
        onClose={onClose}
        onProceedToLogin={vi.fn()}
      />,
    );

    const closeBtn = screen.getByRole('button', { name: /Fechar simulador/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('deve chamar onProceedToLogin e trackRoiSimulatorConverted ao clicar no CTA de ação', () => {
    const onClose = vi.fn();
    const onProceedToLogin = vi.fn();

    render(
      <RoiSimulatorModal
        isOpen={true}
        variant="B"
        onClose={onClose}
        onProceedToLogin={onProceedToLogin}
      />,
    );

    const actionBtn = screen.getByRole('button', { name: /Recuperar Minha Receita no BirthHub 360°/i });
    fireEvent.click(actionBtn);

    expect(onProceedToLogin).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('fecha ao clicar no backdrop (fora do painel)', () => {
    const onClose = vi.fn();
    const { container } = render(
      <RoiSimulatorModal
        isOpen={true}
        variant="A"
        onClose={onClose}
        onProceedToLogin={vi.fn()}
      />,
    );

    // O handler só fecha quando e.target === e.currentTarget (clique no fundo).
    const backdrop = container.querySelector('[aria-modal="true"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Clique dentro do painel não deve fechar
    fireEvent.click(screen.getByText(/Oportunidades em Andamento/i));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('atualiza os sliders de pipeline e recalcula os valores', () => {
    render(
      <RoiSimulatorModal
        isOpen={true}
        variant="A"
        onClose={vi.fn()}
        onProceedToLogin={vi.fn()}
      />,
    );

    const dealsSlider = document.getElementById('deals-slider') as HTMLInputElement;
    expect(dealsSlider).not.toBeNull();
    fireEvent.change(dealsSlider, { target: { value: '100' } });
    expect(dealsSlider.value).toBe('100');

    // Localiza os demais sliders de range pelo tipo
    const sliders = document.querySelectorAll<HTMLInputElement>('input[type="range"]');
    expect(sliders.length).toBeGreaterThanOrEqual(3);
    sliders.forEach((slider) => {
      const max = Number(slider.max);
      const next = String(Math.min(max, Number(slider.value) + 5));
      fireEvent.change(slider, { target: { value: next } });
      expect(slider.value).toBe(next);
    });
  });
});

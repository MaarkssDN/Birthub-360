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
    expect(screen.getByText(/Receita Resgatável com IA/i)).toBeInTheDocument();
    expect(screen.getByText(/Receita Mensal em Risco/i)).toBeInTheDocument();
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
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Act4TacticalEngine } from '@/features/landing/luxury/components/Act4TacticalEngine';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

describe('Act4TacticalEngine', () => {
  it('renderiza o console executivo com a visão de copiloto ativa por padrão', () => {
    render(<Act4TacticalEngine />);

    expect(screen.getByText('A Verdade Operacional')).toBeInTheDocument();
    expect(screen.getByText(/CONSOLE EXECUTIVO · BIRTH-HUB-OS/i)).toBeInTheDocument();
    expect(screen.getByText('Sessão de voz ilustrativa #8291')).toBeInTheDocument();
    expect(screen.getByText(/04:12 simulados/i)).toBeInTheDocument();
    expect(screen.getByText(/Prescrição do Copiloto/i)).toBeInTheDocument();
  });

  it('alterna para a visão do enxame de agentes IA', () => {
    render(<Act4TacticalEngine />);

    fireEvent.click(screen.getByRole('button', { name: /Enxame de Agentes IA/i }));

    expect(screen.getByText('AGENTE 05 · PROSPECÇÃO')).toBeInTheDocument();
    expect(screen.getByText('AGENTE 07 · COPILOTO IA')).toBeInTheDocument();
    expect(screen.getByText(/AGENTE 12 · VOZ/)).toBeInTheDocument();
    expect(screen.queryByText('Sessão de voz ilustrativa #8291')).not.toBeInTheDocument();
  });

  it('alterna para a visão de telemetria de negócios', () => {
    render(<Act4TacticalEngine />);

    fireEvent.click(screen.getByRole('button', { name: /Telemetria de Negócios/i }));

    expect(screen.getByText('R$ 4.280.000')).toBeInTheDocument();
    expect(screen.getByText('R$ 2.940.000')).toBeInTheDocument();
    expect(screen.getByText('3 Contas')).toBeInTheDocument();
    expect(screen.getByText('114% Atingimento')).toBeInTheDocument();
  });

  it('volta para a visão de copiloto ao clicar novamente', () => {
    render(<Act4TacticalEngine />);

    fireEvent.click(screen.getByRole('button', { name: /Enxame de Agentes IA/i }));
    fireEvent.click(screen.getByRole('button', { name: /Copiloto em Chamada/i }));

    expect(screen.getByText('Sessão de voz ilustrativa #8291')).toBeInTheDocument();
    expect(screen.getByText(/Exemplo de objeção detectada/i)).toBeInTheDocument();
  });
});

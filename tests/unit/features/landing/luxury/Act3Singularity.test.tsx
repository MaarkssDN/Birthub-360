import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Act3Singularity } from '@/features/landing/luxury/components/Act3Singularity';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

const SELECTED_CLASS = 'ring-1';

describe('Act3Singularity', () => {
  it('renderiza os 4 quadrantes da matriz contínua com seus títulos', () => {
    render(<Act3Singularity />);

    expect(screen.getByText(/A Matriz Contínua 360º/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /DADOS/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /INTELIGÊNCIA/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /DECISÃO/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /EXECUÇÃO/i })).toBeInTheDocument();
  });

  it('mantém DADOS como quadrante ativo por padrão', () => {
    render(<Act3Singularity />);

    expect(screen.getByRole('button', { name: /DADOS/i })).toHaveClass(SELECTED_CLASS);
    expect(screen.getByRole('button', { name: /EXECUÇÃO/i })).not.toHaveClass(SELECTED_CLASS);
  });

  it('troca o quadrante ativo ao clicar em cada cartão', () => {
    render(<Act3Singularity />);

    const execucaoBtn = screen.getByRole('button', { name: /EXECUÇÃO/i });
    fireEvent.click(execucaoBtn);
    expect(execucaoBtn).toHaveClass(SELECTED_CLASS);
    expect(screen.getByRole('button', { name: /DADOS/i })).not.toHaveClass(SELECTED_CLASS);

    const inteligenciaBtn = screen.getByRole('button', { name: /INTELIGÊNCIA/i });
    fireEvent.click(inteligenciaBtn);
    expect(inteligenciaBtn).toHaveClass(SELECTED_CLASS);
    expect(execucaoBtn).not.toHaveClass(SELECTED_CLASS);

    const decisaoBtn = screen.getByRole('button', { name: /DECISÃO/i });
    fireEvent.click(decisaoBtn);
    expect(decisaoBtn).toHaveClass(SELECTED_CLASS);

    const dadosBtn = screen.getByRole('button', { name: /DADOS/i });
    fireEvent.click(dadosBtn);
    expect(dadosBtn).toHaveClass(SELECTED_CLASS);
    expect(decisaoBtn).not.toHaveClass(SELECTED_CLASS);
  });
});

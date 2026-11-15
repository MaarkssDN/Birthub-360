import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Act3Singularity } from '@/features/landing/luxury/components/Act3Singularity';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: { play: vi.fn() },
}));

// Captura o callback de 'change' do useSpring para simular o progresso de scroll
// sem depender de layout real (jsdom não faz scroll/RAF de verdade).
let changeCb: ((latest: number) => void) | null = null;

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    useScroll: () => ({
      scrollYProgress: { get: () => 0, on: () => () => {} },
    }),
    useSpring: () => ({
      on: (_event: string, cb: (latest: number) => void) => {
        changeCb = cb;
        return () => {};
      },
    }),
  };
});

const SELECTED = 'ring-1';

describe('Act3Singularity — quadrante por progresso de scroll', () => {
  it('mapeia faixas de scrollYProgress para os 4 quadrantes', () => {
    render(<Act3Singularity />);
    expect(changeCb).not.toBeNull();

    const data = screen.getByRole('button', { name: /DADOS/i });
    const inteligencia = screen.getByRole('button', { name: /INTELIGÊNCIA/i });
    const decisao = screen.getByRole('button', { name: /DECISÃO/i });
    const execucao = screen.getByRole('button', { name: /EXECUÇÃO/i });

    act(() => changeCb?.(0.2));
    expect(data).toHaveClass(SELECTED);

    act(() => changeCb?.(0.4));
    expect(inteligencia).toHaveClass(SELECTED);
    expect(data).not.toHaveClass(SELECTED);

    act(() => changeCb?.(0.6));
    expect(decisao).toHaveClass(SELECTED);

    act(() => changeCb?.(0.9));
    expect(execucao).toHaveClass(SELECTED);
  });
});

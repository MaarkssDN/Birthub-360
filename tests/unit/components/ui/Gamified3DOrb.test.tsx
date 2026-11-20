import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Gamified3DOrb } from '@/components/ui/Gamified3DOrb';

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: vi.fn(),
}));

vi.mock('@react-three/drei', () => ({
  Float: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  MeshDistortMaterial: () => <div data-testid="distort-material" />,
  Sparkles: () => <div data-testid="sparkles" />,
}));

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

vi.mock('@/lib/soundEffects', () => ({ SoundFX: { play: vi.fn() } }));

afterEach(cleanup);

describe('Gamified3DOrb', () => {
  it('renderiza o botão com dimensões e estado desabilitado quando não interativo', () => {
    render(<Gamified3DOrb size={120} interactive={false} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveStyle({ width: '120px', height: '120px' });
    expect(btn).not.toHaveAttribute('title');
  });

  it('expõe nome acessível nos dois estados (axe button-name)', () => {
    const { rerender } = render(<Gamified3DOrb interactive />);
    expect(
      screen.getByRole('button', { name: 'Interagir com o cristal de energia 3D' }),
    ).toBeEnabled();

    rerender(<Gamified3DOrb interactive={false} />);
    expect(screen.getByRole('button', { name: 'Cristal de energia 3D' })).toBeDisabled();
  });

  it('clique dispara som, confete e callback quando interativo', async () => {
    const confetti = (await import('canvas-confetti')).default as ReturnType<typeof vi.fn>;
    const { SoundFX } = await import('@/lib/soundEffects');
    const onOrbClick = vi.fn();
    render(<Gamified3DOrb interactive onOrbClick={onOrbClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(SoundFX.play).toHaveBeenCalledWith('success');
    expect(confetti).toHaveBeenCalled();
    expect(onOrbClick).toHaveBeenCalledTimes(1);
  });

  it('clique sem callback não quebra', () => {
    render(<Gamified3DOrb interactive />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

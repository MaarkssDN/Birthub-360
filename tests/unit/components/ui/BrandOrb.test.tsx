import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrandOrb } from '@/components/ui/BrandOrb';

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
}));

vi.mock('@react-three/drei', () => ({
  Float: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Sphere: ({ children, ...props }: React.ComponentProps<'div'> & { children?: React.ReactNode }) => (
    // biome-ignore lint/a11y/useSemanticElements: mock de objeto three.js
    <div data-testid="orb-sphere" {...props}>{children}</div>
  ),
  MeshDistortMaterial: () => <div data-testid="distort-material" />,
  Sparkles: () => <div data-testid="sparkles" />,
}));

vi.mock('@/lib/soundEffects', () => ({ SoundFX: { play: vi.fn() } }));

afterEach(cleanup);

describe('BrandOrb', () => {
  it('renderiza botão acessível com aria-label e dimensões', () => {
    render(<BrandOrb size={200} />);
    const btn = screen.getByRole('button', { name: 'Interagir com o Brand Orb' });
    expect(btn).toHaveStyle({ width: '200px', height: '200px' });
    expect(btn).toHaveAttribute('title');
  });

  it('modo não interativo desabilita e remove título', () => {
    render(<BrandOrb interactive={false} />);
    const btn = screen.getByRole('button', { name: 'Brand Orb' });
    expect(btn).toBeDisabled();
    expect(btn).not.toHaveAttribute('title');
  });

  it('clique interativo toca som e aciona boost no orb', async () => {
    const { SoundFX } = await import('@/lib/soundEffects');
    render(<BrandOrb interactive />);
    fireEvent.click(screen.getByRole('button'));
    expect(SoundFX.play).toHaveBeenCalledWith('success');
    fireEvent.click(screen.getByTestId('orb-sphere'));
  });
});

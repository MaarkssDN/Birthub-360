import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BirthHubOrbit360 } from '@/components/brand/BirthHubOrbit360';

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="r3f-canvas-mock" />,
  useFrame: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  useReducedMotion: () => false,
}));

describe('BirthHubOrbit360', () => {
  it('deve renderizar container com role img e label de acessibilidade', () => {
    render(<BirthHubOrbit360 size={200} />);

    const emblem = screen.getByRole('img', { name: /Emblema Orbital Birth Hub 360/i });
    expect(emblem).toBeInTheDocument();
  });

  it('deve exibir o glifo B estilizado central', () => {
    render(<BirthHubOrbit360 size={240} />);

    expect(screen.getByText('B')).toBeInTheDocument();
  });
});

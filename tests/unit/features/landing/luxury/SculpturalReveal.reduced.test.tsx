import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SculpturalReveal } from '@/features/landing/luxury/components/SculpturalReveal';

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return { ...actual, useReducedMotion: () => true };
});

afterEach(cleanup);

describe('SculpturalReveal — prefers-reduced-motion', () => {
  it('renderiza children direto na tag semântica, sem wrapper animado', () => {
    const { container } = render(
      <SculpturalReveal as="section" className="minha-classe">
        <p>conteúdo estático</p>
      </SculpturalReveal>,
    );
    const el = screen.getByText('conteúdo estático').closest('section');
    expect(el).toHaveClass('minha-classe');
    // Caminho reduced-motion retorna <Component> puro — sem o div overflow-hidden animado.
    expect(container.querySelector('.overflow-hidden')).toBeNull();
  });
});

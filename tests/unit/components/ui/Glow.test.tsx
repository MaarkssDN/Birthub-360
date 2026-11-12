import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Glow } from '../../../../src/components/ui/Glow.js';

describe('Glow', () => {
  it('renderiza variantes e cores sem poluir a árvore acessível', () => {
    const { container, rerender } = render(<Glow variant="top" color="lime" blur="xl" />);
    expect(container.querySelector('[data-slot="glow"]')).toHaveAttribute('aria-hidden', 'true');
    rerender(<Glow variant="bottom" color="cyan" blur="sm" />);
    rerender(<Glow variant="center" color="pink" blur="2xl" />);
    rerender(<Glow variant="above" color="gold" blur="md" />);
    rerender(<Glow variant="below" color="subtle" />);
    expect(container.querySelectorAll('[data-slot="glow"]').length).toBe(1);
  });
});

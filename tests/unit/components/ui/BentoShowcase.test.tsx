import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BentoShowcase } from '../../../../src/components/ui/BentoShowcase.js';

describe('BentoShowcase', () => {
  it('apresenta os cards do enxame, orquestração e conformidade', () => {
    render(<BentoShowcase />);
    expect(screen.getByText(/Enxame de Agentes IA/i)).toBeInTheDocument();
    expect(screen.getByText(/Agente NBA/i)).toBeInTheDocument();
    expect(screen.getByText(/Pilar 06/i)).toBeInTheDocument();
  });
});

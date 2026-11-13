import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PricingSection } from '../../../../src/components/ui/PricingSection.js';

describe('PricingSection', () => {
  it('mostra os três planos padrão e permite escolher o ciclo de faturamento', () => {
    const onSelectPlan = vi.fn();
    render(<PricingSection onSelectPlan={onSelectPlan} />);

    expect(screen.getByText('Growth Core')).toBeInTheDocument();
    expect(screen.getByText('Enterprise OS')).toBeInTheDocument();
    expect(screen.getByText(/Swarm Dedicated|Dedicated/i)).toBeInTheDocument();

    // Default é anual
    expect(screen.getByText('R$ 1.990')).toBeInTheDocument();
    expect(screen.getByText('R$ 4.720')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Faturamento Mensal/i }));
    expect(screen.getByText('R$ 2.490')).toBeInTheDocument();
    expect(screen.getByText('R$ 5.900')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Anual/i }));
    expect(screen.getByText('R$ 1.990')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Iniciar com Growth/i }));
    expect(onSelectPlan).toHaveBeenCalledWith('starter');

    fireEvent.click(screen.getByRole('button', { name: /Acelerar com Enterprise OS/i }));
    expect(onSelectPlan).toHaveBeenCalledWith('scale');
  });
});

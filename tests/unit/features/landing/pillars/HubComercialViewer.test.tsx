import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  HubComercialViewer,
  VisualizerHubComercial,
} from '@/features/landing/components/pillars/viewers/index.js';

describe('HubComercialViewer — Pilar 01 (Orbit / CRM)', () => {
  it('exporta HubComercialViewer e o alias retrocompatível VisualizerHubComercial', () => {
    expect(HubComercialViewer).toBeDefined();
    expect(VisualizerHubComercial).toBe(HubComercialViewer);
  });

  it('renderiza o visualizador com acessibilidade (role="region" e aria-label)', () => {
    render(<HubComercialViewer theme="dark" />);

    const region = screen.getByRole('region', {
      name: /Simulação do Pipeline Comercial — Hub Comercial/i,
    });
    expect(region).toBeInTheDocument();
  });

  it('renderiza as 3 etapas do pipeline comercial com deals e métricas', () => {
    render(<HubComercialViewer theme="dark" />);

    // Título e resumo do pipeline
    expect(screen.getByText(/Pipeline Ativo • R\$ 1\.040\.000/i)).toBeInTheDocument();
    expect(screen.getByText(/3 Negócios em Foco/i)).toBeInTheDocument();

    // 3 Colunas
    expect(screen.getByText('QUALIFICAÇÃO')).toBeInTheDocument();
    expect(screen.getByText('R$ 180k')).toBeInTheDocument();
    expect(screen.getByText('Indústria Alfa S/A')).toBeInTheDocument();

    expect(screen.getByText('PROPOSTA')).toBeInTheDocument();
    expect(screen.getByText('R$ 340k')).toBeInTheDocument();
    expect(screen.getByText('Varejo Global Ltda')).toBeInTheDocument();

    expect(screen.getByText('FECHAMENTO')).toBeInTheDocument();
    expect(screen.getByText('R$ 520k')).toBeInTheDocument();
    expect(screen.getByText('FinTech Horizons')).toBeInTheDocument();
  });

  it('aplica estilização coerente no modo Dark', () => {
    const { container } = render(<HubComercialViewer theme="dark" />);
    const root = container.firstElementChild;

    expect(root).toHaveClass('bg-slate-900/80');
    expect(root).toHaveClass('border-sky-500/30');
  });

  it('aplica estilização coerente e contraste adequado no modo Light', () => {
    const { container } = render(<HubComercialViewer theme="light" />);
    const root = container.firstElementChild;

    expect(root).toHaveClass('bg-sky-50/50');
    expect(root).toHaveClass('border-sky-300');
    expect(screen.getByText('QUALIFICAÇÃO')).toHaveClass('text-slate-500');
  });

  it('garante grid responsivo que colapsa em telas móveis e expande a partir de sm', () => {
    const { container } = render(<HubComercialViewer theme="dark" />);
    const grid = container.querySelector('.grid');

    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('sm:grid-cols-3');
  });
});

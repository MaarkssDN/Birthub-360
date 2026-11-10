import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  MercadoViewer,
  VisualizerMercado,
} from '@/features/landing/components/pillars/viewers/index.js';

describe('MercadoViewer — Pilar 02 (Nexus / Inteligência de Mercado)', () => {
  it('exporta MercadoViewer e o alias retrocompatível VisualizerMercado', () => {
    expect(MercadoViewer).toBeDefined();
    expect(VisualizerMercado).toBe(MercadoViewer);
  });

  it('renderiza o visualizador com acessibilidade (role="region" e aria-label)', () => {
    render(<MercadoViewer theme="dark" />);

    const region = screen.getByRole('region', {
      name: /Simulação de Enriquecimento B2B — Inteligência de Mercado/i,
    });
    expect(region).toBeInTheDocument();
  });

  it('renderiza os dados de enriquecimento B2B, score ICP e sinais de compra', () => {
    render(<MercadoViewer theme="dark" />);

    // Cabeçalho e Score ICP
    expect(screen.getByText(/Enriquecimento CNPJ • Receita & QSA/i)).toBeInTheDocument();
    expect(screen.getByText(/ICP Score: 96\/100/i)).toBeInTheDocument();

    // Dados da Empresa
    expect(screen.getByText('TechLog Logística Integrada S/A')).toBeInTheDocument();
    expect(screen.getByText(/CNPJ: 14\.288\.901\/0001-44 • Matriz São Paulo\/SP/i)).toBeInTheDocument();
    expect(screen.getByText(/Receita Presumida: R\$ 50M a R\$ 100M/i)).toBeInTheDocument();

    // Detalhes cadastrais e de contato
    expect(screen.getByText('CNAE Principal')).toBeInTheDocument();
    expect(screen.getByText('4930-2 (Cargas)')).toBeInTheDocument();
    expect(screen.getByText('Decisor no QSA')).toBeInTheDocument();
    expect(screen.getByText('Diretor Comercial')).toBeInTheDocument();
    expect(screen.getByText('Canal Corporativo')).toBeInTheDocument();
    expect(screen.getByText('E-mail Validado ✓')).toBeInTheDocument();

    // Sinal de Compra
    expect(screen.getByText(/Sinal de Compra:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Contratação ativa de 8 executivos de vendas/i),
    ).toBeInTheDocument();
  });

  it('aplica estilização coerente no modo Dark', () => {
    const { container } = render(<MercadoViewer theme="dark" />);
    const root = container.firstElementChild;

    expect(root).toHaveClass('bg-slate-900/80');
    expect(root).toHaveClass('border-pink-500/30');
  });

  it('aplica estilização coerente e contraste adequado no modo Light', () => {
    const { container } = render(<MercadoViewer theme="light" />);
    const root = container.firstElementChild;

    expect(root).toHaveClass('bg-pink-50/40');
    expect(root).toHaveClass('border-pink-300');
    expect(screen.getByText('Decisor no QSA')).toHaveClass('text-slate-400');
  });

  it('garante grid responsivo adaptado para mobile e desktop', () => {
    const { container } = render(<MercadoViewer theme="dark" />);
    const grid = container.querySelector('.grid');

    expect(grid).toHaveClass('grid-cols-2');
    expect(grid).toHaveClass('sm:grid-cols-3');
  });
});

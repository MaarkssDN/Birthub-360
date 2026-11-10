import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  OrquestracaoViewer,
  VisualizerOrquestracao,
} from '@/features/landing/components/pillars/viewers/index.js';

describe('OrquestracaoViewer — Pilar 03 (Aria / Orquestração de Vendas)', () => {
  it('exporta OrquestracaoViewer e o alias retrocompatível VisualizerOrquestracao', () => {
    expect(OrquestracaoViewer).toBeDefined();
    expect(VisualizerOrquestracao).toBe(OrquestracaoViewer);
  });

  it('renderiza o visualizador com acessibilidade (role="region" e aria-label)', () => {
    render(<OrquestracaoViewer theme="dark" />);

    const region = screen.getByRole('region', {
      name: /Simulação de Cadência Executiva — Orquestração de Vendas/i,
    });
    expect(region).toBeInTheDocument();
  });

  it('renderiza passos da cadência executiva, SLA e Next Best Action', () => {
    render(<OrquestracaoViewer theme="dark" />);

    // Cabeçalho e SLA
    expect(screen.getByText(/Cadência Executiva • Passo 3 de 5/i)).toBeInTheDocument();
    expect(screen.getByText(/SLA Restante: 25 min/i)).toBeInTheDocument();

    // Passo 1 (concluído)
    expect(screen.getByText(/D\+0 • E-mail de Apresentação de Valor/i)).toBeInTheDocument();
    expect(screen.getByText(/Entregue • Aberto 2x pelo lead/i)).toBeInTheDocument();

    // Passo 3 (Next Best Action / ativo)
    expect(
      screen.getByText(/D\+2 • Ligação VoiceHub \+ Follow-up WhatsApp/i),
    ).toBeInTheDocument();
    expect(screen.getByText('NEXT BEST ACTION')).toBeInTheDocument();
    expect(
      screen.getByText(/Roteiro tático: validar dor de controle do Diretor de Operações/i),
    ).toBeInTheDocument();

    // Passo 4 (futuro)
    expect(
      screen.getByText(/D\+4 • Passagem de Bastão \(Handover SDR → Closer com Checklist BANT\)/i),
    ).toBeInTheDocument();
  });

  it('aplica estilização coerente no modo Dark', () => {
    const { container } = render(<OrquestracaoViewer theme="dark" />);
    const root = container.firstElementChild;

    expect(root).toHaveClass('bg-slate-900/80');
    expect(root).toHaveClass('border-amber-500/30');
  });

  it('aplica estilização coerente e contraste adequado no modo Light', () => {
    const { container } = render(<OrquestracaoViewer theme="light" />);
    const root = container.firstElementChild;

    expect(root).toHaveClass('bg-amber-50/40');
    expect(root).toHaveClass('border-amber-300');
    expect(screen.getByText(/Cadência Executiva • Passo 3 de 5/i)).toHaveClass('text-amber-700');
  });

  it('destaca visualmente o passo ativo (Next Best Action)', () => {
    const { container } = render(<OrquestracaoViewer theme="dark" />);
    const activeBadge = screen.getByText('NEXT BEST ACTION');
    expect(activeBadge).toBeInTheDocument();

    const activeStep = activeBadge.closest('.rounded-xl');
    expect(activeStep).toHaveClass('border-amber-500/50');
  });
});

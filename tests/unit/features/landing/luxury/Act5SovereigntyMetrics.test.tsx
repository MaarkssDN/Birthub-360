import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Act5SovereigntyMetrics } from '@/features/landing/luxury/components/Act5SovereigntyMetrics';

describe('Act5SovereigntyMetrics', () => {
  it('renderiza o cabeçalho do Índice de Soberania', () => {
    render(<Act5SovereigntyMetrics />);

    expect(screen.getByText(/O Índice de Soberania/i)).toBeInTheDocument();
    expect(screen.getByText(/Cenários ilustrativos e conformidade/i)).toBeInTheDocument();
  });

  it('renderiza as 4 métricas de soberania', () => {
    render(<Act5SovereigntyMetrics />);

    expect(screen.getByText('Cenário')).toBeInTheDocument();
    expect(screen.getByText('Baixa')).toBeInTheDocument();
    expect(screen.getByText('RLS')).toBeInTheDocument();
    expect(screen.getByText('360°')).toBeInTheDocument();
    expect(screen.getByText(/Projeção de velocidade no pipeline/i)).toBeInTheDocument();
    expect(screen.getByText(/Isolamento multi-tenant/i)).toBeInTheDocument();
  });

  it('renderiza os selos de conformidade enterprise', () => {
    render(<Act5SovereigntyMetrics />);

    expect(screen.getByText(/Criptografia AES-256-GCM/i)).toBeInTheDocument();
    expect(screen.getByText(/Conformidade LGPD Nativa/i)).toBeInTheDocument();
    expect(screen.getByText(/PostgreSQL com RLS/i)).toBeInTheDocument();
    expect(screen.getByText(/Observabilidade de eventos/i)).toBeInTheDocument();
  });
});

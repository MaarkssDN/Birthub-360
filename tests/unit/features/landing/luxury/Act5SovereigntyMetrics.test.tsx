import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Act5SovereigntyMetrics } from '@/features/landing/luxury/components/Act5SovereigntyMetrics';

describe('Act5SovereigntyMetrics', () => {
  it('renderiza o cabeçalho do Índice de Soberania', () => {
    render(<Act5SovereigntyMetrics />);

    expect(screen.getByText(/O Índice de Soberania/i)).toBeInTheDocument();
    expect(screen.getByText(/Autoridade corporativa em números/i)).toBeInTheDocument();
  });

  it('renderiza as 4 métricas de soberania', () => {
    render(<Act5SovereigntyMetrics />);

    expect(screen.getByText('+42%')).toBeInTheDocument();
    expect(screen.getByText('< 12ms')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('360º')).toBeInTheDocument();
    expect(
      screen.getByText(/Isolamento Multi-Tenant \(RLS\)/i),
    ).toBeInTheDocument();
  });

  it('renderiza os selos de conformidade enterprise', () => {
    render(<Act5SovereigntyMetrics />);

    expect(screen.getByText(/Criptografia Ponta a Ponta/i)).toBeInTheDocument();
    expect(screen.getByText(/Conformidade LGPD Nativa/i)).toBeInTheDocument();
    expect(screen.getByText(/PostgreSQL com RLS/i)).toBeInTheDocument();
    expect(screen.getByText(/Infraestrutura de Baixa Latência/i)).toBeInTheDocument();
  });
});

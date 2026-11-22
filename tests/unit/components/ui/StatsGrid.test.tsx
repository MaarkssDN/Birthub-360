import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsGrid } from '../../../../src/components/ui/StatsGrid.js';

describe('StatsGrid', () => {
  it('mostra as métricas padrão do ecossistema', () => {
    render(<StatsGrid />);
    expect(screen.getByText('R$ 48.5M+')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Gerado e Auditado')).toBeInTheDocument();
    expect(screen.getByText('3.8x')).toBeInTheDocument();
    expect(screen.getByText('99.4%')).toBeInTheDocument();
    expect(screen.getByText('< 100ms')).toBeInTheDocument();
  });

  it('aceita estatísticas customizadas', () => {
    render(
      <StatsGrid
        stats={[
          {
            value: '12',
            label: 'Pilares ativos',
            description: 'Cobertura completa',
            trend: '+2',
            highlightColor: '#00D4FF',
            titleColor: 'text-cyan-500',
            descColor: 'text-slate-500',
          },
        ]}
      />,
    );
    expect(screen.getByText('Pilares ativos')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardBuilderModal } from '@/features/dashboard/components/DashboardBuilderModal';

describe('DashboardBuilderModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentRole: 'GESTOR' as const,
    onSelectRole: vi.fn(),
    activeWidgets: ['realtimeCockpit', 'productivityHeatmap'] as any,
    visibleKpis: ['pipelineValue', 'winRate'] as any,
    isCustomized: false,
    onSave: vi.fn(),
    onReset: vi.fn(),
  };

  it('não renderiza nada quando isOpen é false', () => {
    const { container } = render(
      <DashboardBuilderModal {...defaultProps} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza título, abas e roles quando aberto', () => {
    render(<DashboardBuilderModal {...defaultProps} />);

    expect(screen.getByText(/Dashboard Builder & Personalização por Cargo/i)).toBeDefined();
    expect(screen.getByText('GESTOR')).toBeDefined();
    expect(screen.getByText('SDR')).toBeDefined();
    expect(screen.getByText('CLOSER')).toBeDefined();
  });

  it('chama onSelectRole ao clicar em outro cargo', () => {
    const onSelectRole = vi.fn();
    render(<DashboardBuilderModal {...defaultProps} onSelectRole={onSelectRole} />);

    const sdrBtn = screen.getByText('SDR');
    fireEvent.click(sdrBtn);

    expect(onSelectRole).toHaveBeenCalledWith('SDR');
  });

  it('permite alternar KPIs clicando nos botões de KPI', () => {
    render(<DashboardBuilderModal {...defaultProps} />);

    expect(screen.getByText(/Indicadores Chave no Topo/i)).toBeDefined();
    const kpiBtn = screen.getByText(/Volume em Pipeline/i);
    fireEvent.click(kpiBtn);
  });

  it('chama onSave ao salvar alterações', () => {
    const onSave = vi.fn();
    render(<DashboardBuilderModal {...defaultProps} onSave={onSave} />);

    const saveBtn = screen.getByText(/Salvar e Aplicar/i);
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalled();
  });

  it('chama onReset ao resetar layout', () => {
    const onReset = vi.fn();
    render(<DashboardBuilderModal {...defaultProps} onReset={onReset} isCustomized={true} />);

    const resetBtn = screen.getByText(/Restaurar Padrão/i);
    fireEvent.click(resetBtn);

    expect(onReset).toHaveBeenCalled();
  });
});

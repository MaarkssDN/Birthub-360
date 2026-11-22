// @vitest-environment jsdom
//
// Component coverage for the presentational widgets extracted from Dashboard/Overview.tsx
// (TAREFA-SANEAMENTO-008 / BT360-DT-0063): RealStatCard (loading/error/ready), PendingAlert and
// ChecklistItem interaction handlers.

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChecklistItem, PendingAlert, RealStatCard } from './overviewWidgets.js';

describe('RealStatCard', () => {
  const base = {
    title: 'Agentes Cadastrados',
    value: '7',
    caption: '3 com telefonia',
    tooltip: 'tooltip de teste',
  };

  it('shows a skeleton while loading — never a placeholder number', () => {
    const { container } = render(<RealStatCard {...base} status="loading" />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
    expect(screen.queryByText('7')).not.toBeInTheDocument();
  });

  it('shows an explicit error affordance on error status', () => {
    render(<RealStatCard {...base} status="error" />);
    expect(screen.getByText('Erro')).toBeInTheDocument();
    expect(screen.getByText('Tentar novamente ao atualizar a página')).toBeInTheDocument();
  });

  it('renders the real value and caption when ready, and fires onClick', () => {
    const onClick = vi.fn();
    render(<RealStatCard {...base} status="ready" onClick={onClick} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('3 com telefonia')).toBeInTheDocument();
    // Card promotes itself to role=button when onClick is provided.
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('PendingAlert', () => {
  it('renders title/description and fires onAction (default red tone)', () => {
    const onAction = vi.fn();
    render(
      <PendingAlert
        title="Pendência X"
        description="detalhe"
        actionLabel="Resolver"
        onAction={onAction}
      />,
    );
    expect(screen.getByText('Pendência X')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Resolver'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('supports the amber tone variant', () => {
    const { container } = render(
      <PendingAlert
        title="Amarelo"
        description="d"
        actionLabel="Ir"
        onAction={() => {}}
        tone="amber"
      />,
    );
    expect(container.innerHTML).toContain('amber');
  });
});

describe('ChecklistItem', () => {
  it('fires onChange from the checkbox and onClick from both buttons', () => {
    const onChange = vi.fn();
    const onClick = vi.fn();
    render(
      <ChecklistItem label="Organização" checked={false} onChange={onChange} onClick={onClick} />,
    );

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Organização'));
    fireEvent.click(screen.getByText('Ir'));
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('applies strikethrough styling when checked', () => {
    render(<ChecklistItem label="Feito" checked onChange={() => {}} onClick={() => {}} />);
    expect(screen.getByText('Feito').className).toContain('line-through');
  });
});

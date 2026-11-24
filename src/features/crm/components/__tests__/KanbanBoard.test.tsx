// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanbanBoard } from '../KanbanBoard.js';

const deals = [
  { id: 'd1', title: 'Negócio Alpha', stage: 'Proposta', value: 1000 },
  { id: 'd2', title: 'Negócio Beta', stage: 'Negociação', value: 2500 },
];

describe('crm/components/KanbanBoard (compartilhado)', () => {
  it('renderiza os títulos dos negócios', () => {
    render(<KanbanBoard deals={deals} />);
    expect(screen.getByText('Negócio Alpha')).toBeInTheDocument();
    expect(screen.getByText('Negócio Beta')).toBeInTheDocument();
  });

  it('não expõe cards como role="button" sem handler (WCAG 4.1.2)', () => {
    const { container } = render(<KanbanBoard deals={deals} />);
    // O board é uma região nomeada; os cards internos são puramente informativos.
    expect(screen.getByRole('region', { name: 'Quadro Kanban de Negócios' })).toBeInTheDocument();
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
  });

  it('renderiza vazio sem erro quando deals não é informado', () => {
    const { container } = render(<KanbanBoard />);
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
  });
});

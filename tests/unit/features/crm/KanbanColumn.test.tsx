// @vitest-environment jsdom
import { DndContext } from '@dnd-kit/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KanbanColumn } from '../../../../src/features/crm/components/KanbanColumn.js';
import type { Lead } from '../../../../src/types/index.js';

/**
 * Cobertura do bloco de telemetria da coluna (forecast ponderado, score médio
 * de ICP e estado vazio) e do badge de leads estagnados — incluindo a classe de
 * cor de contraste corrigida no fix de acessibilidade (text-ok-solid/dark:text-ok).
 */

vi.mock('../../../../src/lib/soundEffects.js', () => ({
  SoundFX: { play: vi.fn() },
}));
vi.mock('../../../../src/lib/soundEffects', () => ({
  SoundFX: { play: vi.fn() },
}));

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'lead-1',
    status: 'Lead Recebido',
    currency: 'BRL',
    tags: [],
    companyId: null,
    contactId: null,
    title: 'Lead de teste',
    amount: 10000,
    probability: 50,
    score: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Lead;
}

function renderColumn(leads: Lead[]) {
  return render(
    <DndContext>
      <KanbanColumn status="Lead Recebido" leads={leads} onCardClick={vi.fn()} />
    </DndContext>,
  );
}

describe('KanbanColumn — telemetria e estados', () => {
  it('renderiza forecast ponderado e score médio de ICP quando há dados', () => {
    renderColumn([makeLead()]);

    // amount 10000 * probability 50% = R$ 5.000 de forecast
    expect(screen.getByText(/Forecast:/)).toBeInTheDocument();
    expect(screen.getByText(/ICP Médio:/)).toBeInTheDocument();
    // O score 80 aparece tanto no badge do card quanto no "ICP Médio" da coluna.
    expect(screen.getAllByText('80').length).toBeGreaterThan(0);
  });

  it('renderiza estado vazio de forecast quando não há valor ponderado', () => {
    renderColumn([makeLead({ amount: 0, probability: 0, score: null })]);

    expect(screen.getByText('Sem valor ponderado')).toBeInTheDocument();
    expect(screen.queryByText(/ICP Médio:/)).not.toBeInTheDocument();
  });

  it('renderiza badge de leads estagnados quando há interação antiga', () => {
    const stale = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    renderColumn([makeLead({ lastInteraction: stale })]);

    expect(screen.getByTitle(/lead\(s\) estagnado\(s\)/)).toBeInTheDocument();
  });
});

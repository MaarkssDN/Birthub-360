// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { KanbanColumn } from '../../../../src/features/crm/components/KanbanColumn.js';
import { KanbanCard } from '../../../../src/features/crm/components/KanbanCard.js';

describe('CrmBoard Modular Architecture (DIV-AGENTE-02-002)', () => {
  it('exporta subcomponentes KanbanColumn e KanbanCard desacoplados para renderizacao memoizada', () => {
    expect(KanbanColumn).toBeDefined();
    expect(KanbanCard).toBeDefined();
  });
});

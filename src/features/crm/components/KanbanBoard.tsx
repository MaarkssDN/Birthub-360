import type React from 'react';
import './KanbanCard.js';
import './KanbanColumn.js';

export interface KanbanBoardProps {
  deals?: Array<{ id: string; title: string; stage: string; value: number }>;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ deals = [] }) => {
  return (
    // <section> carrega o landmark "region" nativamente; cards internos são puramente
    // informativos (sem role/tabIndex — ver correção do handoff 42→40, onda-3).
    <section aria-label="Quadro Kanban de Negócios" className="flex gap-4 overflow-x-auto p-4">
      <div className="flex gap-4">
        {deals.map((d) => (
          // Card não-interativo: sem onClick/onKeyDown, role="button" + tabIndex criavam um
          // alvo de teclado sem ativação (WCAG 4.1.2, handoff 42→40 onda-3).
          <div key={d.id} className="rounded-lg border border-line px-3 py-2">
            <span className="font-semibold">{d.title}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default KanbanBoard;

import React, { useCallback, useState } from 'react';

export interface KanbanCardItem {
  id: string;
  title: string;
  stageId: string;
  valueCents: number;
}

export interface KanbanStageColumn {
  id: string;
  name: string;
}

export interface KanbanBoardProps {
  initialCards: readonly KanbanCardItem[];
  stages: readonly KanbanStageColumn[];
  onPersistStageMove: (cardId: string, fromStageId: string, toStageId: string) => Promise<void>;
}

export function applyOptimisticStageMove(
  cards: readonly KanbanCardItem[],
  cardId: string,
  targetStageId: string,
): { nextCards: KanbanCardItem[]; previousStageId: string | null } {
  let previousStageId: string | null = null;
  const nextCards = cards.map((card) => {
    if (card.id === cardId) {
      previousStageId = card.stageId;
      return { ...card, stageId: targetStageId };
    }
    return card;
  });
  return { nextCards, previousStageId };
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  initialCards,
  stages,
  onPersistStageMove,
}) => {
  const [cards, setCards] = useState<KanbanCardItem[]>(() => [...initialCards]);
  const [rollbackError, setRollbackError] = useState<string | null>(null);

  const moveCard = useCallback(
    async (cardId: string, targetStageId: string) => {
      setRollbackError(null);
      let snapshotPreviousStageId: string | null = null;

      setCards((current) => {
        const { nextCards, previousStageId } = applyOptimisticStageMove(
          current,
          cardId,
          targetStageId,
        );
        snapshotPreviousStageId = previousStageId;
        return nextCards;
      });

      if (!snapshotPreviousStageId || snapshotPreviousStageId === targetStageId) {
        return;
      }

      try {
        await onPersistStageMove(cardId, snapshotPreviousStageId, targetStageId);
      } catch (err) {
        const revertToStage = snapshotPreviousStageId;
        setCards((current) =>
          current.map((c) => (c.id === cardId ? { ...c, stageId: revertToStage } : c)),
        );
        const msg =
          err instanceof Error && err.message
            ? err.message
            : 'Falha ao persistir mudança de estágio. Posição restaurada automaticamente.';
        setRollbackError(msg);
      }
    },
    [onPersistStageMove],
  );

  return (
    <div data-testid="crm-kanban-board" className="space-y-4">
      {rollbackError && (
        <div
          role="alert"
          data-testid="kanban-rollback-alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800"
        >
          {rollbackError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stages.map((stage) => {
          const stageCards = cards.filter((c) => c.stageId === stage.id);
          return (
            <section
              key={stage.id}
              aria-label={stage.name}
              data-testid={`kanban-stage-${stage.id}`}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-3"
            >
              <h4 className="font-semibold text-sm mb-2">{stage.name}</h4>
              <div className="space-y-2">
                {stageCards.map((card) => (
                  <article
                    key={card.id}
                    data-testid={`kanban-card-${card.id}`}
                    data-stage-id={card.stageId}
                    className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-xs"
                  >
                    <div className="font-medium">{card.title}</div>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {stages
                        .filter((s) => s.id !== stage.id)
                        .map((target) => (
                          <button
                            key={target.id}
                            type="button"
                            onClick={() => void moveCard(card.id, target.id)}
                            className="rounded border px-2 py-0.5 text-[11px]"
                          >
                            Mover para {target.name}
                          </button>
                        ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

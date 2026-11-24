import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

/** Coluna sintética renderizada quando existe card cujo `stageId` não corresponde a nenhum
 * estágio conhecido do pipeline (dado inconsistente vinda do backend). Sem ela o card
 * simplesmente desapareceria de todas as colunas — perda visual de dado real. */
export const UNASSIGNED_STAGE_ID = '__unassigned__';

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

function sameCardSnapshot(a: readonly KanbanCardItem[], b: readonly KanbanCardItem[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ca = a[i];
    const cb = b[i];
    if (
      ca.id !== cb.id ||
      ca.stageId !== cb.stageId ||
      ca.title !== cb.title ||
      ca.valueCents !== cb.valueCents
    ) {
      return false;
    }
  }
  return true;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  initialCards,
  stages,
  onPersistStageMove,
}) => {
  const [cards, setCards] = useState<KanbanCardItem[]>(() => [...initialCards]);
  // Espelho síncrono do estado commitado. Necessário porque o updater de `setCards` pode ser
  // adiado pelo React (fila de atualizações pendente / StrictMode) — ler `previousStageId`
  // de dentro dele deixava a variável `null` e a persistência NUNCA era chamada: o card
  // mudava de coluna na tela mas o servidor nunca era notificado (dessincronia silenciosa).
  const cardsRef = useRef<KanbanCardItem[]>(cards);
  // CardIds com persistência de estágio em voo. Usado no re-sync de props para não apagar
  // um movimento otimista que o servidor ainda não confirmou.
  const pendingMovesRef = useRef(new Map<string, number>());
  const [rollbackError, setRollbackError] = useState<string | null>(null);

  const stageIdSet = useMemo(() => new Set(stages.map((s) => s.id)), [stages]);

  // Re-sincroniza quando o pai entrega um novo snapshot (refetch, polling, SSE).
  // Preserva o estágio otimista de cards com movimento ainda não confirmado.
  useEffect(() => {
    const pendingIds = pendingMovesRef.current;
    const optimisticStageById = new Map<string, string>();
    if (pendingIds.size > 0) {
      for (const card of cardsRef.current) {
        if (pendingIds.has(card.id)) {
          optimisticStageById.set(card.id, card.stageId);
        }
      }
    }
    const synced = initialCards.map((card) => {
      const optimisticStage = optimisticStageById.get(card.id);
      return optimisticStage ? { ...card, stageId: optimisticStage } : { ...card };
    });
    if (sameCardSnapshot(cardsRef.current, synced)) return;
    cardsRef.current = synced;
    setCards(synced);
  }, [initialCards]);

  const beginPendingMove = useCallback((cardId: string) => {
    pendingMovesRef.current.set(cardId, (pendingMovesRef.current.get(cardId) ?? 0) + 1);
  }, []);

  const endPendingMove = useCallback((cardId: string) => {
    const count = (pendingMovesRef.current.get(cardId) ?? 1) - 1;
    if (count <= 0) {
      pendingMovesRef.current.delete(cardId);
    } else {
      pendingMovesRef.current.set(cardId, count);
    }
  }, []);

  const moveCard = useCallback(
    async (cardId: string, targetStageId: string) => {
      setRollbackError(null);

      const current = cardsRef.current;
      const card = current.find((c) => c.id === cardId);
      if (!card || card.stageId === targetStageId) {
        return;
      }
      const previousStageId = card.stageId;

      const { nextCards } = applyOptimisticStageMove(current, cardId, targetStageId);
      cardsRef.current = nextCards;
      setCards(nextCards);
      beginPendingMove(cardId);

      try {
        await onPersistStageMove(cardId, previousStageId, targetStageId);
      } catch (err) {
        // Só reverte se o card ainda estiver no estágio cuja persistência falhou. Se o
        // usuário já moveu o card de novo (outra persistência em voo), reverter para
        // `previousStageId` apagaria o movimento mais recente — dessincronia pior que o erro.
        const latest = cardsRef.current;
        const stillOnFailedTarget = latest.find((c) => c.id === cardId)?.stageId === targetStageId;
        if (stillOnFailedTarget) {
          const reverted = latest.map((c) =>
            c.id === cardId ? { ...c, stageId: previousStageId } : c,
          );
          cardsRef.current = reverted;
          setCards(reverted);
        }
        const msg =
          err instanceof Error && err.message
            ? err.message
            : 'Falha ao persistir mudança de estágio. Posição restaurada automaticamente.';
        setRollbackError(msg);
      } finally {
        endPendingMove(cardId);
      }
    },
    [onPersistStageMove, beginPendingMove, endPendingMove],
  );

  // Colunas visíveis: os estágios reais + bucket "Sem estágio" quando houver card órfão
  // (stageId que não existe em `stages`). Garante que nenhum deal suma do quadro.
  const columns = useMemo<readonly KanbanStageColumn[]>(() => {
    const hasOrphans = cards.some((c) => !stageIdSet.has(c.stageId));
    if (!hasOrphans) return stages;
    return [...stages, { id: UNASSIGNED_STAGE_ID, name: 'Sem estágio' }];
  }, [stages, cards, stageIdSet]);

  const cardsInColumn = useCallback(
    (columnId: string): KanbanCardItem[] => {
      if (columnId === UNASSIGNED_STAGE_ID) {
        return cards.filter((c) => !stageIdSet.has(c.stageId));
      }
      return cards.filter((c) => c.stageId === columnId);
    },
    [cards, stageIdSet],
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
        {columns.map((stage) => {
          const stageCards = cardsInColumn(stage.id);
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
                        .filter((s) => s.id !== card.stageId)
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

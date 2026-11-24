// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  type DealRecord,
  type DealRepositoryPort,
  DealsService,
  type DealUpdatePatch,
  InvalidDealPatchError,
} from '../../deals/deals.service.js';
import {
  KanbanBoard,
  type KanbanCardItem,
  type KanbanStageColumn,
  UNASSIGNED_STAGE_ID,
} from '../KanbanBoard.js';

const STAGES: KanbanStageColumn[] = [
  { id: 'qualificacao', name: 'Qualificação' },
  { id: 'proposta', name: 'Proposta' },
];

const CARDS: KanbanCardItem[] = [
  { id: 'c-1', title: 'Clínica São Lucas', stageId: 'qualificacao', valueCents: 120_000 },
  { id: 'c-2', title: 'Hospital Norte', stageId: 'proposta', valueCents: 80_000 },
];

function renderBoard(overrides?: {
  initialCards?: KanbanCardItem[];
  onPersistStageMove?: (cardId: string, from: string, to: string) => Promise<void>;
}) {
  return render(
    <KanbanBoard
      initialCards={overrides?.initialCards ?? CARDS}
      stages={STAGES}
      onPersistStageMove={overrides?.onPersistStageMove ?? vi.fn().mockResolvedValue(undefined)}
    />,
  );
}

describe('[42 · Lívia] KanbanBoard — sincronização, rollback e consistência de estágios', () => {
  it('persiste a movimentação com from/to corretos e move o card de coluna', async () => {
    const onPersist = vi.fn().mockResolvedValue(undefined);
    renderBoard({ onPersistStageMove: onPersist });

    fireEvent.click(screen.getByRole('button', { name: 'Mover para Proposta' }));

    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledWith('c-1', 'qualificacao', 'proposta');
    });
    await waitFor(() => {
      expect(screen.getByTestId('kanban-card-c-1').getAttribute('data-stage-id')).toBe('proposta');
    });
  });

  it('re-sincroniza os cards quando initialCards muda (refetch do servidor)', () => {
    const { rerender } = render(
      <KanbanBoard
        initialCards={CARDS}
        stages={STAGES}
        onPersistStageMove={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const updated = CARDS.map((c) =>
      c.id === 'c-1' ? { ...c, stageId: 'proposta', title: 'Clínica Renomeada' } : c,
    );
    rerender(
      <KanbanBoard
        initialCards={updated}
        stages={STAGES}
        onPersistStageMove={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByTestId('kanban-card-c-1').getAttribute('data-stage-id')).toBe('proposta');
    expect(screen.getByText('Clínica Renomeada')).toBeTruthy();
  });

  it('mantém o movimento otimista durante o refetch enquanto a persistência está em voo', async () => {
    let resolvePersist: (() => void) | null = null;
    const onPersist = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePersist = resolve;
        }),
    );

    const { rerender } = render(
      <KanbanBoard initialCards={CARDS} stages={STAGES} onPersistStageMove={onPersist} />,
    );

    // Move c-1 para proposta (otimista) — persistência fica pendente
    fireEvent.click(screen.getByRole('button', { name: 'Mover para Proposta' }));
    await waitFor(() => {
      expect(screen.getByTestId('kanban-card-c-1').getAttribute('data-stage-id')).toBe('proposta');
    });

    // Refetch chega ANTES do servidor confirmar: snapshot antigo (c-1 ainda em qualificacao)
    rerender(<KanbanBoard initialCards={CARDS} stages={STAGES} onPersistStageMove={onPersist} />);

    // O movimento otimista não pode ser apagado pelo snapshot antigo
    expect(screen.getByTestId('kanban-card-c-1').getAttribute('data-stage-id')).toBe('proposta');

    resolvePersist?.();
    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledTimes(1);
    });
  });

  it('não reverte um movimento mais recente quando uma persistência anterior falha', async () => {
    // 1ª persistência (qualificacao -> proposta) falha DEPOIS que o usuário já moveu
    // o card para um 3º estágio... aqui só temos 2 estágios, então simulamos:
    // falha da 1ª e sucesso imediato não é possível sem 3ª coluna. Usamos duas
    // persistências: move p/ proposta (pendente), depois persiste resolve e um
    // segundo move não existe — então testamos o cenário real possível:
    // falha com card ainda no alvo => reverte (já coberto no teste de squad).
    // Aqui validamos o caso inverso: se entre o erro e o catch o card mudou,
    // não reverte. Simulamos com persist que falha e move concorrente.
    const deferred: Array<{ resolve: () => void; reject: (e: Error) => void }> = [];
    const onPersist = vi.fn(
      () =>
        new Promise<void>((resolve, reject) => {
          deferred.push({ resolve, reject });
        }),
    );

    const threeStages: KanbanStageColumn[] = [...STAGES, { id: 'negociacao', name: 'Negociação' }];
    render(
      <KanbanBoard initialCards={CARDS} stages={threeStages} onPersistStageMove={onPersist} />,
    );

    // Move 1: qualificacao -> proposta (persist pendente)
    const card = screen.getByTestId('kanban-card-c-1');
    const btnProposta = Array.from(card.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Proposta'),
    ) as HTMLButtonElement;
    fireEvent.click(btnProposta);

    // Move 2 (card já está em proposta): proposta -> negociacao (persist pendente)
    await waitFor(() => {
      expect(screen.getByTestId('kanban-card-c-1').getAttribute('data-stage-id')).toBe('proposta');
    });
    const card2 = screen.getByTestId('kanban-card-c-1');
    const btnNeg = Array.from(card2.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Negociação'),
    ) as HTMLButtonElement;
    fireEvent.click(btnNeg);

    await waitFor(() => {
      expect(screen.getByTestId('kanban-card-c-1').getAttribute('data-stage-id')).toBe(
        'negociacao',
      );
    });
    expect(onPersist).toHaveBeenCalledTimes(2);
    expect(onPersist).toHaveBeenLastCalledWith('c-1', 'proposta', 'negociacao');

    // Persistência do move 1 falha AGORA — card já está em negociacao, não pode reverter p/ qualificacao
    deferred[0].reject(new Error('falha move 1'));
    await waitFor(() => {
      expect(screen.getByTestId('kanban-rollback-alert')).toBeTruthy();
    });
    expect(screen.getByTestId('kanban-card-c-1').getAttribute('data-stage-id')).toBe('negociacao');

    // Persistência do move 2 sucede
    deferred[1].resolve();
    await waitFor(() => {
      expect(screen.getByTestId('kanban-card-c-1').getAttribute('data-stage-id')).toBe(
        'negociacao',
      );
    });
  });

  it('exibe card com stageId inexistente na coluna "Sem estágio" em vez de escondê-lo', () => {
    const orphan: KanbanCardItem[] = [
      { id: 'c-9', title: 'Deal Órfão', stageId: 'stage-que-nao-existe', valueCents: 10_000 },
    ];
    renderBoard({ initialCards: orphan });

    const section = screen.getByTestId(`kanban-stage-${UNASSIGNED_STAGE_ID}`);
    expect(section).toBeTruthy();
    expect(screen.getByText('Deal Órfão')).toBeTruthy();
    // Card órfão pode ser movido para qualquer estágio real
    expect(screen.getByRole('button', { name: 'Mover para Qualificação' })).toBeTruthy();
  });
});

describe('[42 · Lívia] DealsService — validação de patch e lote', () => {
  function makeRepo(): DealRepositoryPort {
    const store = new Map<string, DealRecord>();
    return {
      async findById(tenantId, dealId) {
        const item = store.get(dealId);
        return item && item.tenantId === tenantId ? item : null;
      },
      async updateIfVersionMatches({ tenantId, dealId, expectedVersion, patch }) {
        const current = store.get(dealId);
        if (!current || current.tenantId !== tenantId || current.version !== expectedVersion) {
          return null;
        }
        const updated: DealRecord = {
          ...current,
          ...patch,
          version: current.version + 1,
          updatedAt: new Date(),
        };
        store.set(dealId, updated);
        return updated;
      },
      async runInTransaction(fn) {
        const snapshot = new Map(store);
        try {
          return await fn(this);
        } catch (err) {
          store.clear();
          for (const [k, v] of snapshot) store.set(k, v);
          throw err;
        }
      },
    };
  }

  it('rejeita patch vazio sem tocar no repositório', async () => {
    const repo = makeRepo();
    const spy = vi.spyOn(repo, 'updateIfVersionMatches');
    const service = new DealsService(repo);

    await expect(
      service.updateDealWithOptimisticLock({
        tenantId: 't-1',
        dealId: 'd-1',
        expectedVersion: 1,
        patch: {},
      }),
    ).rejects.toBeInstanceOf(InvalidDealPatchError);
    expect(spy).not.toHaveBeenCalled();
  });

  it('rejeita patch nulo/não-objeto e campos com tipo errado sem TypeError', async () => {
    const repo = makeRepo();
    const spy = vi.spyOn(repo, 'updateIfVersionMatches');
    const service = new DealsService(repo);
    const base = { tenantId: 't-1', dealId: 'd-1', expectedVersion: 1 };

    await expect(
      service.updateDealWithOptimisticLock({
        ...base,
        patch: null as unknown as DealUpdatePatch,
      }),
    ).rejects.toBeInstanceOf(InvalidDealPatchError);
    await expect(
      service.updateDealWithOptimisticLock({
        ...base,
        patch: { title: 42 as unknown as string },
      }),
    ).rejects.toBeInstanceOf(InvalidDealPatchError);
    await expect(
      service.updateDealWithOptimisticLock({
        ...base,
        patch: { stageId: {} as unknown as string },
      }),
    ).rejects.toBeInstanceOf(InvalidDealPatchError);
    expect(spy).not.toHaveBeenCalled();
  });

  it('rejeita valueCents negativo/não inteiro e stageId vazio', async () => {
    const service = new DealsService(makeRepo());
    const base = { tenantId: 't-1', dealId: 'd-1', expectedVersion: 1 };

    await expect(
      service.updateDealWithOptimisticLock({ ...base, patch: { valueCents: -5 } }),
    ).rejects.toBeInstanceOf(InvalidDealPatchError);
    await expect(
      service.updateDealWithOptimisticLock({ ...base, patch: { valueCents: 10.5 } }),
    ).rejects.toBeInstanceOf(InvalidDealPatchError);
    await expect(
      service.updateDealWithOptimisticLock({ ...base, patch: { stageId: '   ' } }),
    ).rejects.toBeInstanceOf(InvalidDealPatchError);
  });

  it('rejeita lote com dealId duplicado e targetStageId vazio antes da transação', async () => {
    const repo = makeRepo();
    const txSpy = vi.spyOn(repo, 'runInTransaction');
    const service = new DealsService(repo);

    await expect(
      service.batchUpdateDealStagesAtomically({
        tenantId: 't-1',
        targetStageId: 'won',
        deals: [
          { dealId: 'd-1', expectedVersion: 1 },
          { dealId: 'd-1', expectedVersion: 2 },
        ],
      }),
    ).rejects.toBeInstanceOf(InvalidDealPatchError);

    await expect(
      service.batchUpdateDealStagesAtomically({
        tenantId: 't-1',
        targetStageId: '  ',
        deals: [{ dealId: 'd-1', expectedVersion: 1 }],
      }),
    ).rejects.toThrow(/targetStageId/);

    await expect(
      service.batchUpdateDealStagesAtomically({
        tenantId: 't-1',
        targetStageId: 'won',
        deals: [],
      }),
    ).rejects.toThrow(/vazia/);

    expect(txSpy).not.toHaveBeenCalled();
  });
});

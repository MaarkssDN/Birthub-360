/**
 * RN-CRM-02 — continuação do handoff `.agents/handoffs/onda-00/04-para-00-alcada-desconto-deal-items.md`:
 * `addDealItem` (`CrmDealItem`, itens de um negócio/lead — NÃO `CrmCommercialDocument`) passou a
 * reusar a mesma trava transacional de alçada de desconto dos documentos comerciais
 * (`assertDiscountAuthorityWithinTransaction` dentro de `runInTransaction`), avaliando o item
 * isolado. Antes da correção, um CLOSER/SDR conseguia gravar `discountPercent` arbitrário — o
 * valor entra em `calculateItem` → `CrmDealItem.total` → soma de `Lead.amount`.
 *
 * Harness in-memory no mesmo padrão de `discountAuthorityLock.test.ts`: `runInTransaction` é
 * mockado para executar `fn` com um `tx` fake que implementa só o que `addDealItem` + a guarda
 * tocam (`user.findFirst`, `setting.findMany`, `crmDealItem.create/aggregate`, `lead.update`).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => {
  interface DealItemRow {
    id: string;
    organizationId: string;
    leadId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    taxPercent: number;
    total: number;
    sortOrder: number;
    productId: string | null;
    sku: string | null;
    product: null;
  }
  const state = {
    items: [] as DealItemRow[],
    leads: new Map<string, { id: string; organizationId: string; amount: number }>(),
    users: new Map<string, { id: string; organizationId: string; role: string }>(),
    settings: [] as Array<{
      organizationId: string;
      userId: string | null;
      key: string;
      value: unknown;
    }>,
    seq: 0,
  };

  function makeTx() {
    return {
      user: {
        async findFirst(args: {
          where: { id: string; organizationId: string };
          select?: { role?: boolean };
        }) {
          const u = state.users.get(args.where.id);
          if (!u || u.organizationId !== args.where.organizationId) return null;
          return args.select?.role ? { role: u.role } : u;
        },
      },
      setting: {
        async findMany(args: { where: { organizationId: string; key: string } }) {
          return state.settings.filter(
            (s) => s.organizationId === args.where.organizationId && s.key === args.where.key,
          );
        },
      },
      crmDealItem: {
        async create(args: { data: Record<string, unknown> }) {
          const item: DealItemRow = {
            id: `item-${++state.seq}`,
            product: null,
            productId: null,
            sku: null,
            sortOrder: 0,
            ...(args.data as Omit<DealItemRow, 'id' | 'product'>),
          } as DealItemRow;
          state.items.push(item);
          return item;
        },
        async aggregate(args: { where: { organizationId: string; leadId: string } }) {
          const total = state.items
            .filter(
              (i) => i.organizationId === args.where.organizationId && i.leadId === args.where.leadId,
            )
            .reduce((acc, i) => acc + i.total, 0);
          return { _sum: { total } };
        },
      },
      lead: {
        async update(args: {
          where: { id: string; organizationId: string };
          data: { amount?: number };
        }) {
          const lead = state.leads.get(args.where.id);
          if (!lead || lead.organizationId !== args.where.organizationId) {
            const err = new Error('P2025: lead não encontrado') as Error & { code?: string };
            err.code = 'P2025';
            throw err;
          }
          if (args.data.amount !== undefined) lead.amount = args.data.amount;
          return lead;
        },
      },
    };
  }

  return { state, makeTx };
});

vi.mock('../../../../../src/lib/prisma.js', () => ({
  prisma: {},
  isInActiveTransaction: () => false,
  runInTransaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(h.makeTx()),
}));

const { PrismaCrm360Repository } = await import(
  '../../../../../src/features/crm360/infra/PrismaCrm360Repository.js'
);

const ORG = 'org-deal-item-discount';
const LEAD = 'lead-1';
const repo = new PrismaCrm360Repository({} as never);

const itemInput = (over: Record<string, unknown> = {}) =>
  ({
    name: 'Consultoria',
    quantity: 1,
    unitPrice: 1000,
    discountPercent: 0,
    taxPercent: 0,
    sortOrder: 0,
    ...over,
  }) as never;

function seedUser(id: string, role: string) {
  h.state.users.set(id, { id, organizationId: ORG, role });
}

beforeEach(() => {
  h.state.items.length = 0;
  h.state.leads.clear();
  h.state.users.clear();
  h.state.settings.length = 0;
  h.state.seq = 0;
  h.state.leads.set(LEAD, { id: LEAD, organizationId: ORG, amount: 0 });
  seedUser('user-admin', 'ADMIN');
  seedUser('user-gestor', 'GESTOR');
  seedUser('user-closer', 'CLOSER');
});

describe('RN-CRM-02 — alçada de desconto em addDealItem (itens de negócio)', () => {
  it('CLOSER com discountPercent 15 no item é rejeitado (403) e nada persiste', async () => {
    await expect(
      repo.addDealItem(ORG, LEAD, itemInput({ discountPercent: 15 }), 'user-closer'),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(h.state.items).toHaveLength(0);
    expect(h.state.leads.get(LEAD)?.amount).toBe(0);
  });

  it('ator sem usuário reconhecido cai na menor alçada (fail-closed): 15% rejeitado', async () => {
    await expect(
      repo.addDealItem(ORG, LEAD, itemInput({ discountPercent: 15 }), 'user-inexistente'),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(h.state.items).toHaveLength(0);
  });

  it('CLOSER dentro da alçada (10%) persiste item e atualiza Lead.amount na mesma tx', async () => {
    const item = await repo.addDealItem(
      ORG,
      LEAD,
      itemInput({ discountPercent: 10, quantity: 2 }),
      'user-closer',
    );

    expect(item.discountPercent).toBe(10);
    expect(h.state.items).toHaveLength(1);
    // qty 2 × R$1000 × (1 - 10%) = R$1800
    expect(h.state.leads.get(LEAD)?.amount).toBe(1800);
  });

  it('GESTOR com 15% passa (limite 20%); ADMIN com 50% passa (sem teto)', async () => {
    await expect(
      repo.addDealItem(ORG, LEAD, itemInput({ discountPercent: 15 }), 'user-gestor'),
    ).resolves.toBeDefined();
    await expect(
      repo.addDealItem(ORG, LEAD, itemInput({ discountPercent: 50 }), 'user-admin'),
    ).resolves.toBeDefined();
    expect(h.state.items).toHaveLength(2);
  });

  it('thresholds da organização (Setting approval_thresholds) sobrescrevem o default', async () => {
    h.state.settings.push({
      organizationId: ORG,
      userId: null,
      key: 'approval_thresholds',
      value: { closerMaxPercent: 5, managerMaxPercent: 12 },
    });

    // CLOSER com 8%: passa no default (10%), falha no threshold da org (5%).
    await expect(
      repo.addDealItem(ORG, LEAD, itemInput({ discountPercent: 8 }), 'user-closer'),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(h.state.items).toHaveLength(0);
  });
});

/**
 * RN-CRM-02 / MOD-01 (JOR-08) — trava TRANSACIONAL da alçada de desconto em propostas
 * comerciais. Antes da correção, `createDocument`/`updateDocumentContent` não aplicavam
 * nenhuma verificação de alçada, e a edição lia as versões + escrevia versão/documento fora de
 * uma única transação — duas requisições concorrentes podiam intercalar leitura-validação-
 * escrita (race condition real: versionNumber podia colidir e a validação, quando existir,
 * corria fora do tx).
 *
 * Estes testes rodam contra um harness in-memory que emula o contrato do Postgres que a
 * correção depende:
 *  - `runInTransaction` executa `fn` com um `tx` fake e só "comita" (libera locks) no fim;
 *  - `tx.$queryRaw ... FOR UPDATE` vira um mutex por documento — a segunda transação só
 *    prossegue depois que a primeira terminou, e aí enxerga as versões já commitadas;
 *  - `crmCommercialDocumentVersion.create` rejeita (documentId, versionNumber) duplicado,
 *    igual à `@@unique` real do schema — se o lock sumir, o teste de concorrência falha.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => {
  interface DocRow {
    id: string;
    organizationId: string;
    [key: string]: unknown;
  }
  interface VersionRow {
    id: string;
    organizationId: string;
    documentId: string;
    versionNumber: number;
    snapshot: unknown;
    changedBy: string | null;
    changeReason: string | null;
    createdAt: Date;
  }
  const state = {
    docs: [] as DocRow[],
    versions: [] as VersionRow[],
    users: new Map<string, { id: string; organizationId: string; role: string }>(),
    settings: [] as Array<{ organizationId: string; userId: string | null; key: string; value: unknown }>,
    docLocks: new Map<string, Promise<void>>(),
    seq: 0,
  };

  function acquireDocLock(documentId: string) {
    const prev = state.docLocks.get(documentId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    state.docLocks.set(
      documentId,
      prev.then(() => current),
    );
    return { wait: prev, release };
  }

  function makeTx(releases: Array<() => void>) {
    return {
      async $queryRaw(strings: TemplateStringsArray, ...values: unknown[]) {
        const sql = strings.join(' ');
        if (!sql.includes('FOR UPDATE')) throw new Error(`SQL não suportado no harness: ${sql}`);
        const [documentId, organizationId] = values as [string, string];
        const lock = acquireDocLock(documentId);
        releases.push(lock.release);
        await lock.wait; // serializa: segunda tx espera a primeira "commitar"
        const found = state.docs.find(
          (d) => d.id === documentId && d.organizationId === organizationId,
        );
        return found ? [{ id: found.id }] : [];
      },
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
      crmCommercialDocument: {
        async create(args: { data: Record<string, unknown> }) {
          const now = new Date();
          const doc = {
            id: `doc-${++state.seq}`,
            publicToken: `token-${state.seq}`,
            sentAt: null,
            firstViewedAt: null,
            lastViewedAt: null,
            viewCount: 0,
            paymentReconciledAt: null,
            createdAt: now,
            updatedAt: now,
            lead: null,
            company: null,
            contact: null,
            ...args.data,
          };
          state.docs.push(doc);
          return doc;
        },
        async update(args: { where: { id: string; organizationId: string }; data: Record<string, unknown> }) {
          const doc = state.docs.find(
            (d) => d.id === args.where.id && d.organizationId === args.where.organizationId,
          );
          if (!doc) throw new Error('P2025: documento não encontrado');
          Object.assign(doc, args.data, { updatedAt: new Date() });
          return doc;
        },
      },
      crmCommercialDocumentVersion: {
        async findMany(args: { where: { organizationId: string; documentId: string } }) {
          return state.versions
            .filter(
              (v) => v.organizationId === args.where.organizationId && v.documentId === args.where.documentId,
            )
            .sort((a, b) => a.versionNumber - b.versionNumber);
        },
        async create(args: {
          data: {
            organizationId: string;
            documentId: string;
            versionNumber: number;
            snapshot: unknown;
            changedBy: string | null;
            changeReason: string | null;
          };
        }) {
          // @@unique([documentId, versionNumber]) do schema.prisma — sem o FOR UPDATE, duas
          // transações concorrentes calculam o mesmo versionNumber e uma explode aqui.
          const dup = state.versions.find(
            (v) => v.documentId === args.data.documentId && v.versionNumber === args.data.versionNumber,
          );
          if (dup) {
            const err = new Error('Unique constraint failed') as Error & { code?: string };
            err.code = 'P2002';
            throw err;
          }
          const row: VersionRow = {
            id: `ver-${++state.seq}`,
            createdAt: new Date(),
            ...args.data,
          };
          state.versions.push(row);
          return row;
        },
      },
    };
  }

  return { state, makeTx, acquireDocLock };
});

vi.mock('../../../../../src/lib/prisma.js', () => ({
  prisma: {},
  isInActiveTransaction: () => false,
  runInTransaction: async (fn: (tx: unknown) => Promise<unknown>) => {
    const releases: Array<() => void> = [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await fn(h.makeTx(releases));
    } finally {
      // COMMIT/ROLLBACK: locks do FOR UPDATE só são soltos no fim da transação.
      for (const release of releases) release();
    }
  },
}));

const { PrismaCrm360Repository } = await import(
  '../../../../../src/features/crm360/infra/PrismaCrm360Repository.js'
);

const ORG = 'org-discount-lock';
const repo = new PrismaCrm360Repository({} as never);

const ITEM_1000 = { name: 'Consultoria', quantity: 1, unitPrice: 1000, discountPercent: 0, taxPercent: 0 };
const docInput = (over: Record<string, unknown> = {}) =>
  ({
    type: 'Proposta',
    title: 'Proposta teste',
    currency: 'BRL',
    status: 'Rascunho',
    lineItems: [ITEM_1000],
    ...over,
  }) as never;
const updateInput = (over: Record<string, unknown> = {}) =>
  ({
    title: 'Proposta editada',
    currency: 'BRL',
    lineItems: [ITEM_1000],
    ...over,
  }) as never;

function seedUser(id: string, role: string) {
  h.state.users.set(id, { id, organizationId: ORG, role });
}

async function seedDocument() {
  const doc = await repo.createDocument(ORG, docInput(), 'user-admin');
  return doc.id;
}

beforeEach(() => {
  h.state.docs.length = 0;
  h.state.versions.length = 0;
  h.state.users.clear();
  h.state.settings.length = 0;
  h.state.docLocks.clear();
  h.state.seq = 0;
  seedUser('user-admin', 'ADMIN');
  seedUser('user-gestor', 'GESTOR');
  seedUser('user-closer', 'CLOSER');
});

describe('RN-CRM-02 — alçada de desconto na criação de documento', () => {
  it('CLOSER com desconto de 15% no item é rejeitado (403) e nada é persistido', async () => {
    await expect(
      repo.createDocument(
        ORG,
        docInput({ lineItems: [{ ...ITEM_1000, discountPercent: 15 }] }),
        'user-closer',
      ),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(h.state.docs).toHaveLength(0);
    expect(h.state.versions).toHaveLength(0);
  });

  it('duas criações concorrentes acima da alçada do CLOSER: ambas rejeitadas, zero documentos gravados', async () => {
    const payload = docInput({ lineItems: [{ ...ITEM_1000, discountPercent: 15 }] });
    const results = await Promise.allSettled([
      repo.createDocument(ORG, payload, 'user-closer'),
      repo.createDocument(ORG, payload, 'user-closer'),
    ]);

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    for (const r of results) {
      expect((r as PromiseRejectedResult).reason).toMatchObject({ statusCode: 403 });
    }
    expect(h.state.docs).toHaveLength(0);
    expect(h.state.versions).toHaveLength(0);
  });

  it('GESTOR com 15% passa (limite 20%); ADMIN com 50% passa (sem teto)', async () => {
    await expect(
      repo.createDocument(
        ORG,
        docInput({ lineItems: [{ ...ITEM_1000, discountPercent: 15 }] }),
        'user-gestor',
      ),
    ).resolves.toBeDefined();
    await expect(
      repo.createDocument(
        ORG,
        docInput({ title: 'Doc admin', lineItems: [{ ...ITEM_1000, discountPercent: 50 }] }),
        'user-admin',
      ),
    ).resolves.toBeDefined();
    expect(h.state.docs).toHaveLength(2);
  });

  it('ator sem usuário reconhecido cai na menor alçada (fail-closed): 15% rejeitado', async () => {
    await expect(
      repo.createDocument(
        ORG,
        docInput({ lineItems: [{ ...ITEM_1000, discountPercent: 15 }] }),
        'user-inexistente',
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
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
      repo.createDocument(
        ORG,
        docInput({ lineItems: [{ ...ITEM_1000, discountPercent: 8 }] }),
        'user-closer',
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
    // GESTOR com 15%: passa no default (20%), falha no threshold da org (12%).
    await expect(
      repo.createDocument(
        ORG,
        docInput({ lineItems: [{ ...ITEM_1000, discountPercent: 15 }] }),
        'user-gestor',
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(h.state.docs).toHaveLength(0);
  });
});

describe('RN-CRM-02 — trava transacional na edição (FOR UPDATE + versão atômica)', () => {
  it('duas edições concorrentes serializam na linha do documento: versões 2 e 3, sem colisão nem update perdido', async () => {
    const docId = await seedDocument();

    const [r1, r2] = await Promise.all([
      repo.updateDocumentContent(
        ORG,
        docId,
        updateInput({ title: 'Edição A', lineItems: [{ ...ITEM_1000, quantity: 2 }] }),
        'user-admin',
      ),
      repo.updateDocumentContent(
        ORG,
        docId,
        updateInput({ title: 'Edição B', lineItems: [{ ...ITEM_1000, quantity: 3 }] }),
        'user-admin',
      ),
    ]);

    expect(r1.title).not.toBe(r2.title);
    const versions = h.state.versions
      .filter((v) => v.documentId === docId)
      .map((v) => v.versionNumber)
      .sort();
    // Sem o FOR UPDATE, as duas txs liam o mesmo histórico e ambas gravavam versionNumber=2 —
    // uma delas explodiria na @@unique (ou, sem a constraint, o histórico se perderia).
    expect(versions).toEqual([1, 2, 3]);
    const doc = h.state.docs.find((d) => d.id === docId)!;
    // O documento reflete UMA das edições por completo (a que comitou por último) — nunca um
    // merge inconsistente das duas.
    expect(['Edição A', 'Edição B']).toContain(doc.title);
    expect(doc.lineItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ quantity: expect.any(Number) })]),
    );
  });

  it('edição concorrente que excede a alçada é rejeitada dentro do tx: a edição válida commita sozinha', async () => {
    const docId = await seedDocument();

    const results = await Promise.allSettled([
      repo.updateDocumentContent(
        ORG,
        docId,
        updateInput({ title: 'Edição válida', lineItems: [{ ...ITEM_1000, discountPercent: 8 }] }),
        'user-gestor',
      ),
      repo.updateDocumentContent(
        ORG,
        docId,
        updateInput({ title: 'Edição abusiva', lineItems: [{ ...ITEM_1000, discountPercent: 30 }] }),
        'user-closer',
      ),
    ]);

    const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ statusCode: 403 });

    // A rejeitada não gravou versão nem tocou o documento; a válida gravou exatamente a v2.
    const versions = h.state.versions.filter((v) => v.documentId === docId);
    expect(versions.map((v) => v.versionNumber)).toEqual([1, 2]);
    const doc = h.state.docs.find((d) => d.id === docId)!;
    expect(doc.title).toBe('Edição válida');
  });

  it('documento de outra organização não é encontrado pelo lock (tenant no WHERE do FOR UPDATE)', async () => {
    const docId = await seedDocument();
    await expect(
      repo.updateDocumentContent('org-outra', docId, updateInput(), 'user-admin'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

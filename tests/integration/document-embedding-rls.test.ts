import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { requestContext } from '../../src/lib/async-context';

/**
 * Prova de isolamento da policy `tenant_isolation` em `DocumentEmbedding`
 * (migration `20261110120000_document_embedding_rls_policy`).
 *
 * Este model usa a coluna `tenantId` (não `organizationId`) e NÃO está em
 * `TENANT_INJECTED_MODELS` — a extensão Prisma não reescreve o tenant no payload.
 * A policy SQL só compara `tenantId` com `app.current_tenant_id` (não honra
 * `app.bypass_rls`). Por isso limpeza e releitura de fixtures rodam no contexto
 * de cada tenant, nunca com `bypassRls`.
 *
 * A suíte de integração (CI e `pretest:integration`) usa DATABASE_URL como
 * `prospector_app` (`NOSUPERUSER NOBYPASSRLS`). O `beforeAll` confere isso.
 */

const ORG_A = 'test-org-id';
const ORG_B = 'test-org-id-docemb-b';
const DOC_PREFIX = 'docemb-rls-';

/** INSERT cross-tenant: Postgres recusa com a policy. */
const RLS_POLICY_DENIED = /row-level security policy/i;
/** UPDATE/DELETE cross-tenant: a policy esconde a linha (Prisma P2025) ou recusa a policy. */
const RLS_POLICY_OR_HIDDEN =
  /row-level security policy|Record to (update|delete) (not found|does not exist)|No record was found/i;

function embeddingData(tenantId: string, suffix: string) {
  return {
    id: `${DOC_PREFIX}${suffix}`,
    tenantId,
    documentId: `${DOC_PREFIX}document-${suffix}`,
    vectorId: `${DOC_PREFIX}vector-${suffix}-${randomUUID()}`,
    metadata: { purpose: 'rls-test', suffix },
  };
}

function withTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  return requestContext.run({ tenantId }, fn);
}

/**
 * A policy de DocumentEmbedding ignora bypass_rls, então o deleteMany precisa
 * rodar com `app.current_tenant_id` de cada tenant (mesmo padrão de
 * `tests/helpers/integration-setup.ts` para tabelas fora do allowlist).
 */
async function cleanupFixtures() {
  for (const tenantId of [ORG_A, ORG_B]) {
    await withTenant(tenantId, () =>
      prisma.documentEmbedding.deleteMany({
        where: { documentId: { startsWith: DOC_PREFIX } },
      }),
    );
  }
}

describe('DocumentEmbedding: isolamento RLS entre tenants', () => {
  beforeAll(async () => {
    const rows = await prisma.$queryRaw<
      Array<{ u: string; rolsuper: boolean; rolbypassrls: boolean }>
    >`
      SELECT current_user AS u, rolsuper, rolbypassrls
        FROM pg_roles WHERE rolname = current_user
    `;
    expect(rows[0]).toEqual({ u: 'prospector_app', rolsuper: false, rolbypassrls: false });

    // Organization ESTÁ no allowlist de bypass — só usado para criar o fixture da org B.
    await requestContext.run({ bypassRls: true }, async () => {
      const orgB = await prisma.organization.findUnique({ where: { id: ORG_B } });
      if (!orgB) {
        await prisma.organization.create({
          data: { id: ORG_B, name: 'Test Org DocumentEmbedding B' },
        });
      }
    });
  });

  afterEach(async () => {
    await cleanupFixtures();
  });

  afterAll(async () => {
    await cleanupFixtures();
    // Organization no allowlist; prospector_app não tem DELETE — o fallback de
    // owner em integration-setup.ts cobre este deleteMany, como no teste de AILog.
    await requestContext.run({ bypassRls: true }, async () => {
      await prisma.organization.deleteMany({ where: { id: ORG_B } });
    });
  });

  it('tenant A lê o próprio embedding e não lê o embedding do tenant B', async () => {
    await withTenant(ORG_A, () =>
      prisma.documentEmbedding.create({ data: embeddingData(ORG_A, 'own-a') }),
    );
    await withTenant(ORG_B, () =>
      prisma.documentEmbedding.create({ data: embeddingData(ORG_B, 'hidden-b') }),
    );

    const visibleToA = await withTenant(ORG_A, () =>
      prisma.documentEmbedding.findMany({
        where: { documentId: { startsWith: DOC_PREFIX } },
      }),
    );

    expect(visibleToA).toHaveLength(1);
    expect(visibleToA[0]?.tenantId).toBe(ORG_A);
    expect(visibleToA[0]?.id).toBe(`${DOC_PREFIX}own-a`);

    const stolenById = await withTenant(ORG_A, () =>
      prisma.documentEmbedding.findUnique({ where: { id: `${DOC_PREFIX}hidden-b` } }),
    );
    expect(stolenById).toBeNull();
  });

  it('bloqueia INSERT do tenant A com tenantId do tenant B', async () => {
    await expect(
      withTenant(ORG_A, () =>
        prisma.documentEmbedding.create({ data: embeddingData(ORG_B, 'insert-cross') }),
      ),
    ).rejects.toThrow(RLS_POLICY_DENIED);

    // Releitura no tenant que seria o dono da linha vazada — bypass seria no-op nesta policy.
    const leaked = await withTenant(ORG_B, () =>
      prisma.documentEmbedding.findUnique({ where: { id: `${DOC_PREFIX}insert-cross` } }),
    );
    expect(leaked).toBeNull();
  });

  it('bloqueia UPDATE do tenant A sobre embedding do tenant B', async () => {
    await withTenant(ORG_B, () =>
      prisma.documentEmbedding.create({ data: embeddingData(ORG_B, 'update-b') }),
    );

    await expect(
      withTenant(ORG_A, () =>
        prisma.documentEmbedding.update({
          where: { id: `${DOC_PREFIX}update-b` },
          data: { metadata: { pwned: true } },
        }),
      ),
    ).rejects.toThrow(RLS_POLICY_OR_HIDDEN);

    const after = await withTenant(ORG_B, () =>
      prisma.documentEmbedding.findUnique({ where: { id: `${DOC_PREFIX}update-b` } }),
    );
    expect(after?.metadata).toMatchObject({ purpose: 'rls-test', suffix: 'update-b' });
  });

  it('bloqueia DELETE do tenant A sobre embedding do tenant B', async () => {
    await withTenant(ORG_B, () =>
      prisma.documentEmbedding.create({ data: embeddingData(ORG_B, 'delete-b') }),
    );

    await expect(
      withTenant(ORG_A, () =>
        prisma.documentEmbedding.delete({ where: { id: `${DOC_PREFIX}delete-b` } }),
      ),
    ).rejects.toThrow(RLS_POLICY_OR_HIDDEN);

    const stillThere = await withTenant(ORG_B, () =>
      prisma.documentEmbedding.findUnique({ where: { id: `${DOC_PREFIX}delete-b` } }),
    );
    expect(stillThere).not.toBeNull();
    expect(stillThere?.tenantId).toBe(ORG_B);
  });

  it('tenant A consegue atualizar o próprio embedding', async () => {
    await withTenant(ORG_A, () =>
      prisma.documentEmbedding.create({ data: embeddingData(ORG_A, 'update-own') }),
    );

    const updated = await withTenant(ORG_A, () =>
      prisma.documentEmbedding.update({
        where: { id: `${DOC_PREFIX}update-own` },
        data: { metadata: { purpose: 'rls-test', suffix: 'update-own', edited: true } },
      }),
    );
    expect(updated.tenantId).toBe(ORG_A);
    expect(updated.metadata).toMatchObject({ edited: true });
  });

  it('tenant A apaga o próprio embedding e o de B permanece intacto', async () => {
    await withTenant(ORG_A, () =>
      prisma.documentEmbedding.create({ data: embeddingData(ORG_A, 'delete-own') }),
    );
    await withTenant(ORG_B, () =>
      prisma.documentEmbedding.create({ data: embeddingData(ORG_B, 'delete-own-peer') }),
    );

    await withTenant(ORG_A, () =>
      prisma.documentEmbedding.delete({ where: { id: `${DOC_PREFIX}delete-own` } }),
    );

    const gone = await withTenant(ORG_A, () =>
      prisma.documentEmbedding.findUnique({ where: { id: `${DOC_PREFIX}delete-own` } }),
    );
    expect(gone).toBeNull();

    const peer = await withTenant(ORG_B, () =>
      prisma.documentEmbedding.findUnique({ where: { id: `${DOC_PREFIX}delete-own-peer` } }),
    );
    expect(peer).not.toBeNull();
    expect(peer?.tenantId).toBe(ORG_B);
  });
});

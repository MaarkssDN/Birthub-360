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
 * O bloqueio cruzado abaixo só pode vir da policy RLS do Postgres
 * (`tenantId = current_setting('app.current_tenant_id')`).
 */

const ORG_A = 'test-org-id';
const ORG_B = 'test-org-id-docemb-b';
const DOC_PREFIX = 'docemb-rls-';

function embeddingData(tenantId: string, suffix: string) {
  return {
    id: `${DOC_PREFIX}${suffix}`,
    tenantId,
    documentId: `${DOC_PREFIX}document-${suffix}`,
    vectorId: `${DOC_PREFIX}vector-${suffix}-${randomUUID()}`,
    metadata: { purpose: 'rls-test', suffix },
  };
}

async function cleanupFixtures() {
  await requestContext.run({ bypassRls: true }, async () => {
    await prisma.documentEmbedding.deleteMany({
      where: { documentId: { startsWith: DOC_PREFIX } },
    });
  });
}

describe('DocumentEmbedding: isolamento RLS entre tenants', () => {
  beforeAll(async () => {
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
    await requestContext.run({ bypassRls: true }, async () => {
      await prisma.organization.deleteMany({ where: { id: ORG_B } });
    });
  });

  it('tenant A lê o próprio embedding e não lê o embedding do tenant B', async () => {
    await requestContext.run({ tenantId: ORG_A }, () =>
      prisma.documentEmbedding.create({ data: embeddingData(ORG_A, 'own-a') }),
    );
    await requestContext.run({ tenantId: ORG_B }, () =>
      prisma.documentEmbedding.create({ data: embeddingData(ORG_B, 'hidden-b') }),
    );

    const visibleToA = await requestContext.run({ tenantId: ORG_A }, () =>
      prisma.documentEmbedding.findMany({
        where: { documentId: { startsWith: DOC_PREFIX } },
      }),
    );

    expect(visibleToA).toHaveLength(1);
    expect(visibleToA[0]?.tenantId).toBe(ORG_A);
    expect(visibleToA[0]?.id).toBe(`${DOC_PREFIX}own-a`);

    const stolenById = await requestContext.run({ tenantId: ORG_A }, () =>
      prisma.documentEmbedding.findUnique({ where: { id: `${DOC_PREFIX}hidden-b` } }),
    );
    expect(stolenById).toBeNull();
  });

  it('bloqueia INSERT do tenant A com tenantId do tenant B', async () => {
    await expect(
      requestContext.run({ tenantId: ORG_A }, () =>
        prisma.documentEmbedding.create({ data: embeddingData(ORG_B, 'insert-cross') }),
      ),
    ).rejects.toThrow();

    const leaked = await requestContext.run({ bypassRls: true }, () =>
      prisma.documentEmbedding.findUnique({ where: { id: `${DOC_PREFIX}insert-cross` } }),
    );
    expect(leaked).toBeNull();
  });

  it('bloqueia UPDATE do tenant A sobre embedding do tenant B', async () => {
    await requestContext.run({ tenantId: ORG_B }, () =>
      prisma.documentEmbedding.create({ data: embeddingData(ORG_B, 'update-b') }),
    );

    await expect(
      requestContext.run({ tenantId: ORG_A }, () =>
        prisma.documentEmbedding.update({
          where: { id: `${DOC_PREFIX}update-b` },
          data: { metadata: { pwned: true } },
        }),
      ),
    ).rejects.toThrow();

    const after = await requestContext.run({ bypassRls: true }, () =>
      prisma.documentEmbedding.findUnique({ where: { id: `${DOC_PREFIX}update-b` } }),
    );
    expect(after?.metadata).toMatchObject({ purpose: 'rls-test', suffix: 'update-b' });
  });

  it('bloqueia DELETE do tenant A sobre embedding do tenant B', async () => {
    await requestContext.run({ tenantId: ORG_B }, () =>
      prisma.documentEmbedding.create({ data: embeddingData(ORG_B, 'delete-b') }),
    );

    await expect(
      requestContext.run({ tenantId: ORG_A }, () =>
        prisma.documentEmbedding.delete({ where: { id: `${DOC_PREFIX}delete-b` } }),
      ),
    ).rejects.toThrow();

    const stillThere = await requestContext.run({ bypassRls: true }, () =>
      prisma.documentEmbedding.findUnique({ where: { id: `${DOC_PREFIX}delete-b` } }),
    );
    expect(stillThere).not.toBeNull();
    expect(stillThere?.tenantId).toBe(ORG_B);
  });

  it('tenant A consegue atualizar o próprio embedding', async () => {
    await requestContext.run({ tenantId: ORG_A }, () =>
      prisma.documentEmbedding.create({ data: embeddingData(ORG_A, 'update-own') }),
    );

    const updated = await requestContext.run({ tenantId: ORG_A }, () =>
      prisma.documentEmbedding.update({
        where: { id: `${DOC_PREFIX}update-own` },
        data: { metadata: { purpose: 'rls-test', suffix: 'update-own', edited: true } },
      }),
    );
    expect(updated.tenantId).toBe(ORG_A);
    expect(updated.metadata).toMatchObject({ edited: true });
  });
});

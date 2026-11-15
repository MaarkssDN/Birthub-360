import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTenantId,
  requestContext,
  runWithContext,
  TenantContextMissingError,
  withTenantContext,
} from '@/lib/async-context';
import { MODELS_WITH_ORGANIZATION_ID } from '@/lib/tenant-scoping-registry';

/**
 * MEL-20 (DEM-20261113-004, Onda 3): teste de regressão de isolamento tenant-prisma.
 *
 * Complementa `tests/unit/lib/tenant-scoping-parity.test.ts` (que trava o DRIFT entre as
 * duas camadas de scoping) e `src/lib/__tests__/prisma-interceptors.unit.test.ts` (que
 * testa os interceptores puros do client global). Aqui provamos o comportamento
 * observável das DUAS camadas que impedem vazamento cross-tenant:
 *
 * 1. `withTenantContext`/`requestContext` — o contexto de tenant do AsyncLocalStorage.
 *    Sem tenant válido, workers/sagas falham fechado (`TenantContextMissingError`)
 *    em vez de rodar "sem dono".
 * 2. `getTenantPrisma(organizationId)` (`src/lib/tenant-prisma.ts`) — o client
 *    tenant-scoped usado por `req.db`: injeta `organizationId` no `where` de TODA
 *    leitura/escrita de models que possuem a coluna, então uma query que "esqueceu"
 *    o filtro de tenant continua confinada ao tenant do client. O `prisma` global é
 *    mockado aqui para capturar a extensão `$extends` sem subir Pool/pg (mesmo padrão
 *    de `vi.mock('@/lib/prisma')` usado em outros testes unitários do repo).
 *
 * Camada NÃO coberta aqui (documentado, não fingido): a garantia final é a RLS do
 * Postgres (`app.current_tenant_id`/FORCE ROW LEVEL SECURITY) — provada em
 * `tests/integration/tenant-isolation-db001.test.ts` e `rls-bypass-allowlist.test.ts`
 * contra banco real, fora do escopo de teste unitário.
 */

// Captura a config passada a `prisma.$extends` sem instanciar o client real.
const prismaMock = vi.hoisted(() => ({
  capturedExtension: undefined as Record<string, unknown> | undefined,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $extends: (config: Record<string, unknown>) => {
      prismaMock.capturedExtension = config;
      return { __tenantClientMarker: true };
    },
  },
}));

// Import tardio (depois do vi.mock) para o tenant-prisma enxergar o prisma mockado.
const { getTenantPrisma } = await import('@/lib/tenant-prisma');

type AllOperations = (params: {
  model: string;
  operation: string;
  args: Record<string, unknown>;
  query: (args: Record<string, unknown>) => Promise<unknown>;
}) => Promise<unknown>;

function getAllOperations(): AllOperations {
  const query = (prismaMock.capturedExtension as { query: Record<string, unknown> }).query;
  const allModels = query.$allModels as Record<string, unknown>;
  return allModels.$allOperations as AllOperations;
}

async function runOperation(
  allOperations: AllOperations,
  model: string,
  operation: string,
  args: Record<string, unknown>,
) {
  let seenArgs: Record<string, unknown> | undefined;
  const result = await allOperations({
    model,
    operation,
    args,
    query: async (a) => {
      seenArgs = a;
      return { ok: true };
    },
  });
  return { result, seenArgs: seenArgs as Record<string, unknown> };
}

describe('MEL-20 — contexto de tenant (AsyncLocalStorage)', () => {
  it('getTenantId() é undefined fora de qualquer requestContext.run', () => {
    expect(requestContext.getStore()).toBeUndefined();
    expect(getTenantId()).toBeUndefined();
  });

  it('withTenantContext rejeita tenantId vazio/blank (fail-closed)', () => {
    expect(() => withTenantContext('', () => 'x')).toThrow(TenantContextMissingError);
    expect(() => withTenantContext('   ', () => 'x')).toThrow(TenantContextMissingError);
  });

  it('withTenantContext executa com o tenantId trimado dentro do store', async () => {
    const seen = await withTenantContext('  org-abc  ', async () => getTenantId());
    expect(seen).toBe('org-abc');
  });

  it('runWithContext propaga organizationId para o store e nada vaza para fora', async () => {
    await runWithContext({ organizationId: 'org-xyz', userId: 'u1' }, async () => {
      expect(getTenantId()).toBe('org-xyz');
    });
    expect(getTenantId()).toBeUndefined();
  });

  it('runWithContext SEM organizationId/tenantId deixa tenantId undefined (documentado: não lança — a contenção real fica na RLS do Postgres)', async () => {
    // Gap conhecido e intencional hoje: runWithContext não valida presença de tenant
    // (diferente de withTenantContext). A query resultante roda sem app.current_tenant_id
    // e a policy RLS FORCE nega as linhas — fail-closed no banco, não na app. Se um dia
    // isso virar requisito mais estrito, o ponto de mudança é aqui.
    await runWithContext({ userId: 'u1' }, async () => {
      expect(getTenantId()).toBeUndefined();
    });
  });
});

describe('MEL-20 — getTenantPrisma (client tenant-scoped, req.db)', () => {
  beforeEach(() => {
    prismaMock.capturedExtension = undefined;
  });

  it('exige organizationId não vazio', () => {
    expect(() => getTenantPrisma('')).toThrow(
      'Tenant Prisma initialization requires a valid organizationId',
    );
  });

  it('captura a extensão $allOperations ao construir o client', () => {
    getTenantPrisma('org-1');
    expect(prismaMock.capturedExtension).toBeDefined();
    expect(typeof getAllOperations()).toBe('function');
  });

  it('injeta organizationId no where de findMany de model COM a coluna (Lead)', async () => {
    getTenantPrisma('org-tenant-A');
    const allOperations = getAllOperations();
    const { seenArgs } = await runOperation(allOperations, 'Lead', 'findMany', {
      where: { status: 'Lead_Recebido' },
      take: 10,
    });
    // A query "esqueceu" organizationId — o client injeta o do tenant do client.
    expect((seenArgs?.where as Record<string, unknown>).organizationId).toBe('org-tenant-A');
    expect((seenArgs?.where as Record<string, unknown>).status).toBe('Lead_Recebido');
    expect(seenArgs?.take).toBe(10);
  });

  it('NÃO injeta organizationId em model SEM a coluna (FeatureFlag — catálogo global)', async () => {
    getTenantPrisma('org-tenant-A');
    const allOperations = getAllOperations();
    const { seenArgs } = await runOperation(allOperations, 'FeatureFlag', 'findMany', {
      where: { key: 'flags.x' },
    });
    // Se injetasse, o Prisma explodiria com "Unknown argument organizationId" — o guard por
    // MODELS_WITH_ORGANIZATION_ID é o que impede isso.
    expect((seenArgs?.where as Record<string, unknown>).organizationId).toBeUndefined();
  });

  it('cobre count/aggregate/groupBy e findFirst (mesmo conjunto de operações de leitura)', async () => {
    getTenantPrisma('org-tenant-B');
    const allOperations = getAllOperations();
    for (const operation of ['count', 'aggregate', 'groupBy', 'findFirst']) {
      const { seenArgs } = await runOperation(allOperations, 'Company', operation, {
        where: { tradeName: { contains: 'acme' } },
      });
      expect(
        (seenArgs?.where as Record<string, unknown>).organizationId,
        `operation=${operation} deveria injetar organizationId`,
      ).toBe('org-tenant-B');
    }
  });

  it('create injeta organizationId nos dados; update/remove impede troca de tenant via payload', async () => {
    getTenantPrisma('org-tenant-C');
    const allOperations = getAllOperations();

    const created = await runOperation(allOperations, 'Lead', 'create', {
      data: { title: 'x', organizationId: 'org-INJETADO-PELO-CLIENTE' },
    });
    // O valor do payload é SOBRESCRITO pelo tenant do client — nunca confiado.
    expect((created.seenArgs?.data as Record<string, unknown>).organizationId).toBe(
      'org-tenant-C',
    );

    const updated = await runOperation(allOperations, 'Lead', 'update', {
      where: { id: 'l1' },
      data: { title: 'y', organizationId: 'org-outro-tenant' },
    });
    // organizationId no data de update é REMOVIDO (guarda multi-tenant).
    expect(
      (updated.seenArgs?.data as Record<string, unknown>).organizationId,
    ).toBeUndefined();
    expect((updated.seenArgs?.where as Record<string, unknown>).organizationId).toBe(
      'org-tenant-C',
    );
  });

  it('upsert injeta tenant no create/where e remove do update', async () => {
    getTenantPrisma('org-tenant-D');
    const allOperations = getAllOperations();
    const { seenArgs } = await runOperation(allOperations, 'Lead', 'upsert', {
      where: { id: 'l1' },
      create: { title: 'novo', organizationId: 'org-errado' },
      update: { title: 'edit', organizationId: 'org-errado' },
    });
    expect((seenArgs?.create as Record<string, unknown>).organizationId).toBe('org-tenant-D');
    expect((seenArgs?.where as Record<string, unknown>).organizationId).toBe('org-tenant-D');
    expect((seenArgs?.update as Record<string, unknown>).organizationId).toBeUndefined();
  });

  it('MODELS_WITH_ORGANIZATION_ID é derivado do DMMF e contém os models tenant-scoped usados aqui', () => {
    // Sanidade: se o DMMF deixar de enxergar organizationId (ex.: rename de coluna),
    // os testes acima passariam a injetar nada silenciosamente — esta asserção pega isso.
    expect(MODELS_WITH_ORGANIZATION_ID.has('Lead')).toBe(true);
    expect(MODELS_WITH_ORGANIZATION_ID.has('Company')).toBe(true);
    expect(MODELS_WITH_ORGANIZATION_ID.has('FeatureFlag')).toBe(false);
  });
});

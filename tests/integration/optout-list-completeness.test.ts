import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { requestContext } from '../../src/lib/async-context';
import { prismaOptOutRepository } from '../../src/features/cadence/infra/PrismaOptOutRepository';
import { isOptedOut } from '../../src/features/cadence/application/optOutService';

/**
 * Regressão do fail-open residual apontado na revisão W2 (handoff 17→01A, plano de
 * saneamento W3): `PrismaOptOutRepository.list()` truncava em 200 registros
 * (`createdAt` desc) por default, e qualquer consumidor que usasse `list()` para
 * decidir elegibilidade enxergaria só os opt-outs mais novos — um opt-out antigo
 * voltaria a ser "invisível".
 *
 * Estado verificado antes da correção: os caminhos de disparo reais
 * (`sendColdEmail`, `CadenceExecutionService`, `callSuppression.service`) usam
 * `isOptedOut` → `findMatches`, que nunca teve limite — o fail-open de envio não
 * existia. O truncamento afetava `list()` (hoje consumida por GET /opt-outs e por
 * qualquer futuro consumidor em lote). A correção torna `list()` completa quando
 * `limit` é omitido e mantém o clamp somente para limite explícito.
 *
 * Este teste prova as duas metades da trava LGPD:
 *  1. um opt-out mais antigo que os 200 registros mais recentes CONTINUA bloqueando
 *     o canal (findMatches não é afetado pelo volume);
 *  2. `list()` sem `limit` retorna o tenant inteiro — o registro antigo aparece.
 */

const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ORG = `test-optout-list-org-${RUN_ID}`;
const TARGET_EMAIL = `alvo-antigo-${RUN_ID}@example.com`;
const FILLER_COUNT = 205; // > 200: o registro alvo fica na posição 206 do orderBy desc

const withRlsBypass = <T>(fn: () => Promise<T>): Promise<T> =>
  requestContext.run({ bypassRls: true }, fn);
const asOrg = <T>(organizationId: string, fn: () => Promise<T>): Promise<T> =>
  requestContext.run({ tenantId: organizationId }, fn);

const BASE = new Date('2026-01-01T00:00:00Z');

beforeAll(async () =>
  withRlsBypass(async () => {
    await prisma.organization.create({
      data: { id: ORG, name: `Test Org opt-out list ${RUN_ID}` },
    });
  }),
);

afterAll(async () =>
  withRlsBypass(async () => {
    // OptOutRecord → Organization é RESTRICT desde a migração
    // 20261112000000_tenant_fk_cascade_to_restrict: a ordem de delete importa.
    await prisma.optOutRecord.deleteMany({ where: { organizationId: ORG } });
    await prisma.organization.deleteMany({ where: { id: ORG } });
  }),
);

describe('PrismaOptOutRepository.list — completude do tenant (TAREFA W3 / handoff 17→01A)', () => {
  it('opt-out mais antigo que os 200 mais recentes continua bloqueando e aparece em list() sem limite', async () => {
    await asOrg(ORG, async () => {
      // Registro alvo: o MAIS ANTIGO de todos (posição 206 em createdAt desc).
      await prisma.optOutRecord.create({
        data: {
          organizationId: ORG,
          scope: 'Global',
          email: TARGET_EMAIL,
          originChannel: 'email',
          createdAt: BASE,
        },
      });
      // 205 registros mais novos e irrelevantes — empurram o alvo para fora do top-200.
      await prisma.optOutRecord.createMany({
        data: Array.from({ length: FILLER_COUNT }, (_, i) => ({
          organizationId: ORG,
          scope: 'Email' as const,
          email: `filler-${i}-${RUN_ID}@example.com`,
          originChannel: 'manual',
          createdAt: new Date(BASE.getTime() + (i + 1) * 60_000),
        })),
      });
    });

    const result = await asOrg(ORG, async () => ({
      blocked: await isOptedOut(prismaOptOutRepository, ORG, { email: TARGET_EMAIL }, 'email'),
      full: await prismaOptOutRepository.list(ORG),
      limited: await prismaOptOutRepository.list(ORG, 10),
    }));

    // 1. Trava de envio: opt-out antigo continua bloqueando (findMatches não trunca).
    expect(result.blocked).toBe(true);

    // 2. list() sem limit retorna o tenant inteiro — o alvo (posição 206) está lá.
    expect(result.full).toHaveLength(FILLER_COUNT + 1);
    expect(result.full.some((r) => r.email === TARGET_EMAIL)).toBe(true);
    // Ordenação createdAt desc preservada: o mais antigo é o último.
    expect(result.full[result.full.length - 1]?.email).toBe(TARGET_EMAIL);

    // 3. limit explícito continua funcionando como teto.
    expect(result.limited).toHaveLength(10);
    expect(result.limited.some((r) => r.email === TARGET_EMAIL)).toBe(false);
  });
});

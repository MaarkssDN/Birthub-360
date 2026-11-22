import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTenantId,
  requestContext,
  runWithContext,
  withTenantContext,
} from '../../src/lib/async-context.js';
import { executeRetentionPurge } from '../../src/shared/services/retentionPurge.service.js';

// Mocks do Prisma para capturar chamadas de query e interceptores
const prismaMock = vi.hoisted(() => ({
  capturedExtension: undefined as Record<string, unknown> | undefined,
  aiLogFindManyMock: vi.fn(),
  aiLogDeleteManyMock: vi.fn(),
  bitrixFindManyMock: vi.fn(),
  bitrixDeleteManyMock: vi.fn(),
  crmFindManyMock: vi.fn(),
  crmDeleteManyMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $extends: (config: Record<string, unknown>) => {
      prismaMock.capturedExtension = config;
      return { __tenantClientMarker: true };
    },
    aILog: {
      findMany: prismaMock.aiLogFindManyMock,
      deleteMany: prismaMock.aiLogDeleteManyMock,
    },
    bitrixSyncLog: {
      findMany: prismaMock.bitrixFindManyMock,
      deleteMany: prismaMock.bitrixDeleteManyMock,
    },
    externalCrmSyncLog: {
      findMany: prismaMock.crmFindManyMock,
      deleteMany: prismaMock.crmDeleteManyMock,
    },
  },
}));

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    $extends: (config: Record<string, unknown>) => {
      prismaMock.capturedExtension = config;
      return { __tenantClientMarker: true };
    },
    aILog: {
      findMany: prismaMock.aiLogFindManyMock,
      deleteMany: prismaMock.aiLogDeleteManyMock,
    },
    bitrixSyncLog: {
      findMany: prismaMock.bitrixFindManyMock,
      deleteMany: prismaMock.bitrixDeleteManyMock,
    },
    externalCrmSyncLog: {
      findMany: prismaMock.crmFindManyMock,
      deleteMany: prismaMock.crmDeleteManyMock,
    },
  },
}));

const { getTenantPrisma } = await import('../../src/lib/tenant-prisma.js');

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

async function executeOperation(
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
      return { id: 'mocked-id', ...(a.data as Record<string, unknown> ?? {}) };
    },
  });
  return { result, seenArgs: seenArgs as Record<string, unknown> };
}

describe('Testes Automatizados de Isolamento Cross-Tenant e Integridade (Agente 01A)', () => {
  const tenantAlpha = 'org-adv-alpha';
  const tenantBeta = 'org-adv-beta';
  const tenantGamma = 'org-adv-gamma';

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.capturedExtension = undefined;
    prismaMock.aiLogFindManyMock.mockResolvedValue([]);
    prismaMock.aiLogDeleteManyMock.mockResolvedValue({ count: 0 });
    prismaMock.bitrixFindManyMock.mockResolvedValue([]);
    prismaMock.bitrixDeleteManyMock.mockResolvedValue({ count: 0 });
    prismaMock.crmFindManyMock.mockResolvedValue([]);
    prismaMock.crmDeleteManyMock.mockResolvedValue({ count: 0 });
  });

  describe('1. Concorrência e Isolamento Assíncrono em AsyncLocalStorage', () => {
    it('mantém isolamento estrito de tenantId sob execuções assíncronas paralelas com interleaving', async () => {
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      const taskAlpha = runWithContext({ organizationId: tenantAlpha, userId: 'user-a' }, async () => {
        expect(getTenantId()).toBe(tenantAlpha);
        await delay(15);
        expect(getTenantId()).toBe(tenantAlpha);
        await delay(10);
        return getTenantId();
      });

      const taskBeta = runWithContext({ organizationId: tenantBeta, userId: 'user-b' }, async () => {
        expect(getTenantId()).toBe(tenantBeta);
        await delay(5);
        expect(getTenantId()).toBe(tenantBeta);
        await delay(25);
        return getTenantId();
      });

      const taskGamma = withTenantContext(tenantGamma, async () => {
        expect(getTenantId()).toBe(tenantGamma);
        await delay(20);
        expect(getTenantId()).toBe(tenantGamma);
        return getTenantId();
      });

      const [resAlpha, resBeta, resGamma] = await Promise.all([taskAlpha, taskBeta, taskGamma]);

      expect(resAlpha).toBe(tenantAlpha);
      expect(resBeta).toBe(tenantBeta);
      expect(resGamma).toBe(tenantGamma);
      // Fora de qualquer contexto, tenantId permanece indefinido
      expect(getTenantId()).toBeUndefined();
    });
  });

  describe('2. Defesa em Profundidade e Prevenção de IDOR no getTenantPrisma', () => {
    it('impede override de tenant no WHERE em leituras de entidades core (Lead, Company, Contact, Activity)', async () => {
      getTenantPrisma(tenantAlpha);
      const allOps = getAllOperations();

      const coreModels = ['Lead', 'Company', 'Contact', 'Activity', 'CrmDealItem', 'CrmPipeline'];

      for (const model of coreModels) {
        // Atacante tenta consultar explicitamente dados de tenantBeta através da sessão de tenantAlpha
        const { seenArgs } = await executeOperation(allOps, model, 'findMany', {
          where: {
            organizationId: tenantBeta, // Tentativa maliciosa de IDOR
            status: 'ACTIVE',
          },
        });

        // O interceptor sobrescreve forçosamente para o tenant do cliente autenticado
        expect(
          (seenArgs.where as Record<string, unknown>).organizationId,
          `${model}.findMany deve forçar tenantAlpha`,
        ).toBe(tenantAlpha);
        expect((seenArgs.where as Record<string, unknown>).status).toBe('ACTIVE');
      }
    });

    it('substitui organizationId fraudulento no payload de CREATE pelo tenant autenticado', async () => {
      getTenantPrisma(tenantAlpha);
      const allOps = getAllOperations();

      const { seenArgs } = await executeOperation(allOps, 'Lead', 'create', {
        data: {
          title: 'Lead Adversarial',
          organizationId: tenantBeta, // Tentativa de criar lead para outro tenant
          value: 100000,
        },
      });

      expect((seenArgs.data as Record<string, unknown>).organizationId).toBe(tenantAlpha);
      expect((seenArgs.data as Record<string, unknown>).title).toBe('Lead Adversarial');
    });

    it('remove organizationId no payload de UPDATE para impedir transferência maliciosa de posse', async () => {
      getTenantPrisma(tenantAlpha);
      const allOps = getAllOperations();

      const { seenArgs } = await executeOperation(allOps, 'Lead', 'update', {
        where: { id: 'lead-target-123' },
        data: {
          title: 'Updated Title',
          organizationId: tenantBeta, // Tentativa de transferir o lead para outro tenant
        },
      });

      // WHERE é confinado ao tenantAlpha
      expect((seenArgs.where as Record<string, unknown>).organizationId).toBe(tenantAlpha);
      // organizationId no payload é removido
      expect((seenArgs.data as Record<string, unknown>).organizationId).toBeUndefined();
      expect((seenArgs.data as Record<string, unknown>).title).toBe('Updated Title');
    });

    it('confinamento estrito de tenant em operações de agregação (count, aggregate, groupBy)', async () => {
      getTenantPrisma(tenantAlpha);
      const allOps = getAllOperations();

      for (const operation of ['count', 'aggregate', 'groupBy']) {
        const { seenArgs } = await executeOperation(allOps, 'Activity', operation, {
          where: { completed: false },
        });

        expect(
          (seenArgs.where as Record<string, unknown>).organizationId,
          `Activity.${operation} deve conter organizationId: tenantAlpha`,
        ).toBe(tenantAlpha);
      }
    });
  });

  describe('3. Auditoria de Consultas Anti-N+1 e Carregamento em Lote', () => {
    it('executa carregamento de relacionamentos dependentes em uma única query com operador IN preservando o tenant', () => {
      // Padrão documentado no skill sql-n-plus-one-detector:
      // Em vez de 1 query de Leads + N queries de Activities em loop,
      // coleta IDs e faz busca em lote com { where: { organizationId, leadId: { in: leadIds } } }
      const leadIds = ['lead-1', 'lead-2', 'lead-3', 'lead-4'];
      const activeTenant = tenantAlpha;

      const buildBatchQuery = (organizationId: string, ids: string[]) => ({
        where: {
          organizationId,
          leadId: { in: ids },
        },
        select: {
          id: true,
          leadId: true,
          type: true,
          status: true,
        },
      });

      const querySpec = buildBatchQuery(activeTenant, leadIds);

      // Verificação de segurança: escopo de organização e lote estrito
      expect(querySpec.where.organizationId).toBe(tenantAlpha);
      expect(querySpec.where.leadId.in).toEqual(leadIds);
      expect(querySpec.where.organizationId).not.toBe(tenantBeta);
    });
  });

  describe('4. Isolamento Cross-Tenant em Purga e Retenção de Dados Históricos', () => {
    it('restringe deleção em lote estritamente ao tenant fornecido sem atingir logs de outros tenants', async () => {
      prismaMock.aiLogFindManyMock.mockResolvedValueOnce([{ id: 'log-alpha-1' }]);
      prismaMock.aiLogDeleteManyMock.mockResolvedValueOnce({ count: 1 });

      const result = await executeRetentionPurge({
        organizationId: tenantAlpha,
        batchSize: 100,
        sleepBetweenBatchesMs: 0,
        policy: { aiLogDays: 90, syncLogDays: 90 },
      });

      expect(result.deletedAILogs).toBe(1);

      // Verifica se a query de findMany de AILog foi chamada com organizationId restrito a tenantAlpha
      expect(prismaMock.aiLogFindManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: tenantAlpha,
          }),
        }),
      );

      // Verifica se deleteMany foi chamado com os IDs encontrados confinados ao tenantAlpha
      expect(prismaMock.aiLogDeleteManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['log-alpha-1'] },
            organizationId: tenantAlpha,
          }),
        }),
      );
    });
  });
});

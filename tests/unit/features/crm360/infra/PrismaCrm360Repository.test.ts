/**
 * Onda 43 (achado da auditoria de N+1 da Onda 42, "observação relacionada"): ensureDefaultPipelines
 * roda em toda leitura do CRM360 (getOverviewData/getPipelines/getBoardLeads), não só na primeira
 * vez — cada chamada fazia um `upsert` (grava mesmo sem mudança real) + uma releitura completa,
 * por pipeline, mesmo quando o pipeline já estava provisionado. Este teste prova que o fast path
 * novo pula upsert/releitura quando não há nada para provisionar.
 *
 * TAREFA-SANEAMENTO-018 (BT360-DT-0024, Onda 5): attachLegacyRecords disparava um `updateMany`
 * por estágio do funil em TODA leitura (6 em Leads + 12 em Negócios), mesmo sem nenhum lead
 * órfão para atribuir. O pre-check `lead.count` novo faz o loop inteiro ser pulado quando não
 * há lead pendente — e getDeals não engole mais falhas de banco/RLS num `catch → []` silencioso.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CrmPipelineEntity, LeadFunnel, LeadStatus } from '@prisma/client';

const crmPipelineFindUnique = vi.fn();
const crmPipelineUpsert = vi.fn();
const crmPipelineFindFirstOrThrow = vi.fn();
const crmPipelineStageCreateMany = vi.fn();
const leadUpdateMany = vi.fn();
const leadCount = vi.fn();
const leadFindMany = vi.fn();

vi.mock('../../../../../src/lib/prisma.js', () => ({
  prisma: {
    crmPipeline: {
      findUnique: (...args: unknown[]) => crmPipelineFindUnique(...args),
      upsert: (...args: unknown[]) => crmPipelineUpsert(...args),
      findFirstOrThrow: (...args: unknown[]) => crmPipelineFindFirstOrThrow(...args),
    },
    crmPipelineStage: {
      createMany: (...args: unknown[]) => crmPipelineStageCreateMany(...args),
    },
    lead: {
      updateMany: (...args: unknown[]) => leadUpdateMany(...args),
      count: (...args: unknown[]) => leadCount(...args),
      findMany: (...args: unknown[]) => leadFindMany(...args),
    },
  },
}));

const { ensureDefaultPipelines, PrismaCrm360Repository } = await import(
  '../../../../../src/features/crm360/infra/PrismaCrm360Repository.js'
);

const ORG = 'org-1';

// 12 estágios simulados — cobre tanto LEAD_STAGES (6) quanto DEAL_STAGES (12) no arquivo fonte,
// usado só para provar "já tem estágio suficiente" sem depender do conteúdo exato de cada um.
function fullPipeline(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pipe-1',
    organizationId: ORG,
    active: true,
    isDefault: true,
    entity: CrmPipelineEntity.Lead,
    sortOrder: 0,
    stages: Array.from({ length: 12 }, (_, i) => ({
      id: `stage-${i}`,
      leadStatus: LeadStatus.Lead_Recebido,
      probability: 5,
    })),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('ensureDefaultPipelines — fast path (Onda 43)', () => {
  it('pipeline já provisionado: nunca chama upsert nem releitura', async () => {
    crmPipelineFindUnique
      .mockResolvedValueOnce(fullPipeline({ entity: CrmPipelineEntity.Lead, sortOrder: 0 }))
      .mockResolvedValueOnce(
        fullPipeline({ id: 'pipe-2', entity: CrmPipelineEntity.Negocio, sortOrder: 1 }),
      );
    leadCount.mockResolvedValue(0);

    await ensureDefaultPipelines(ORG);

    expect(crmPipelineUpsert).not.toHaveBeenCalled();
    expect(crmPipelineFindFirstOrThrow).not.toHaveBeenCalled();
    expect(crmPipelineStageCreateMany).not.toHaveBeenCalled();
    // Um pre-check por funil (Lead + Negócio) — substitui as 24 escritas cegas anteriores.
    expect(leadCount).toHaveBeenCalledTimes(2);
  });

  it('organização nova (nenhum pipeline ainda): cai no caminho antigo de provisionamento', async () => {
    crmPipelineFindUnique.mockResolvedValue(null);
    crmPipelineUpsert.mockResolvedValue(fullPipeline());
    leadCount.mockResolvedValue(0);

    await ensureDefaultPipelines(ORG);

    expect(crmPipelineUpsert).toHaveBeenCalledTimes(2);
    // upsert já devolveu os 6 estágios (create aninhado) — não precisa recriar nem reler.
    expect(crmPipelineStageCreateMany).not.toHaveBeenCalled();
    expect(crmPipelineFindFirstOrThrow).not.toHaveBeenCalled();
  });

  it('pipeline existe mas com menos estágios que o esperado: provisiona os que faltam e relê antes de anexar leads legados', async () => {
    crmPipelineFindUnique.mockResolvedValue(fullPipeline({ stages: [] }));
    crmPipelineUpsert.mockResolvedValue(fullPipeline({ stages: [] }));
    crmPipelineFindFirstOrThrow.mockResolvedValue(fullPipeline());
    leadCount.mockResolvedValue(0);

    await ensureDefaultPipelines(ORG);

    expect(crmPipelineStageCreateMany).toHaveBeenCalledTimes(2);
    expect(crmPipelineFindFirstOrThrow).toHaveBeenCalledTimes(2);
  });
});

describe('attachLegacyRecords — pre-check de leads órfãos (TAREFA-SANEAMENTO-018)', () => {
  function provisionedPipelines() {
    crmPipelineFindUnique
      .mockResolvedValueOnce(fullPipeline({ entity: CrmPipelineEntity.Lead, sortOrder: 0 }))
      .mockResolvedValueOnce(
        fullPipeline({ id: 'pipe-2', entity: CrmPipelineEntity.Negocio, sortOrder: 1 }),
      );
  }

  it('sem leads órfãos pendentes: nenhum updateMany é disparado (antes: 24 escritas por leitura)', async () => {
    provisionedPipelines();
    leadCount.mockResolvedValue(0);

    await ensureDefaultPipelines(ORG);

    expect(leadUpdateMany).not.toHaveBeenCalled();
    expect(leadCount).toHaveBeenCalledWith({
      where: {
        organizationId: ORG,
        funnel: LeadFunnel.Lead,
        pipelineId: null,
        status: { in: expect.arrayContaining([LeadStatus.Lead_Recebido]) },
      },
    });
  });

  it('com leads órfãos pendentes: updateMany roda por estágio e atribui pipeline/estágio/probabilidade', async () => {
    provisionedPipelines();
    leadCount.mockResolvedValue(3);
    leadUpdateMany.mockResolvedValue({ count: 3 });

    await ensureDefaultPipelines(ORG);

    // 12 estágios simulados × 2 funis — todos os estágios têm leadStatus preenchido.
    expect(leadUpdateMany).toHaveBeenCalledTimes(24);
    expect(leadUpdateMany).toHaveBeenCalledWith({
      where: {
        organizationId: ORG,
        funnel: LeadFunnel.Lead,
        status: LeadStatus.Lead_Recebido,
        pipelineId: null,
      },
      data: { pipelineId: 'pipe-1', pipelineStageId: 'stage-0', probability: 5 },
    });
  });
});

describe('getDeals — erro propaga em vez de fallback silencioso (TAREFA-SANEAMENTO-018)', () => {
  const repo = new PrismaCrm360Repository({ getStripeCharge: vi.fn() });

  it('caminho de sucesso: devolve deals com status mapeado', async () => {
    leadFindMany.mockResolvedValue([
      { id: 'deal-1', status: 'Negocios_Ganhos', amount: 100, probability: 100 },
    ]);

    const deals = (await repo.getDeals(ORG)) as Array<{ id: string; status: string }>;

    expect(deals).toHaveLength(1);
    expect(deals[0].status).toBe('Negócios Ganhos');
  });

  it('caminho de falha: rejeição do Prisma propaga (não vira lista vazia enganosa)', async () => {
    leadFindMany.mockRejectedValue(new Error('connection terminated'));

    await expect(repo.getDeals(ORG)).rejects.toThrow('connection terminated');
  });
});

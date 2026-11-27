import { CrmPipelineEntity, LeadFunnel, LeadStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../../shared/middlewares/errorHandler.js';

/**
 * POS3-42-STAGE-TRANSITIONS — cobre as correções de consistência de `updateLeadStage` e
 * `convertLead` em `PrismaCrm360Repository`:
 *  - transição cross-funnel rejeitada (etapa de pipeline Lead em registro Negócio e vice-versa);
 *  - etapa sem `leadStatus` rejeitada (deixaria status/closedAt divergentes da etapa);
 *  - `expectedCloseDate` inválida → 400 (antes virava Invalid Date e estourava 500 no Prisma);
 *  - lead soft-deleted não pode mudar de etapa;
 *  - `convertLead` é mão única Lead → Negócio (registro já em Negócio → 409, sem reset espúrio).
 */

const prismaMock = {
  crmPipelineStage: {
    findFirstOrThrow: vi.fn(),
    createMany: vi.fn(),
  },
  crmPipeline: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    findFirstOrThrow: vi.fn(),
  },
  lead: {
    findFirstOrThrow: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock('../../../../lib/prisma.js', () => ({ prisma: prismaMock }));

const recordStageTransitionMock = vi.fn();
vi.mock('../../../../shared/services/leadStageHistory.service.js', () => ({
  recordStageTransition: recordStageTransitionMock,
}));

const recordLeadFieldChangesMock = vi.fn();
vi.mock('../../../../shared/services/leadFieldChangeHistory.service.js', () => ({
  recordLeadFieldChanges: recordLeadFieldChangesMock,
}));

const ensureManualDealClosureAllowedMock = vi.fn();
vi.mock('../../../crm/application/dealClosureGate.js', () => ({
  ensureManualDealClosureAllowed: ensureManualDealClosureAllowedMock,
}));
vi.mock('../PrismaDealClosureGate.js', () => ({ prismaDealClosureGate: {} }));

// Os repositórios delegados (documentos/itens) não participam das transições — stubs para não
// carregar Stripe/Prisma de documentos neste teste.
vi.mock('../PrismaCrmDocumentRepository.js', () => ({
  PrismaCrmDocumentRepository: class {},
}));
vi.mock('../PrismaCrmDealItemsRepository.js', () => ({
  PrismaCrmDealItemsRepository: class {},
}));

const { PrismaCrm360Repository } = await import('../PrismaCrm360Repository.js');

const ORG = 'org-1';
const LEAD_ID = 'lead-1';

function makeStage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'stage-deal-2',
    name: 'Proposta Enviada',
    code: 'proposta-enviada',
    color: '#8b5cf6',
    sortOrder: 1,
    probability: 45,
    leadStatus: LeadStatus.Proposta_Enviada,
    isWon: false,
    isLost: false,
    pipelineId: 'pipe-deal',
    pipeline: { id: 'pipe-deal', entity: CrmPipelineEntity.Negocio, organizationId: ORG },
    ...overrides,
  };
}

function makeLeadStage(overrides: Record<string, unknown> = {}) {
  return makeStage({
    id: 'stage-lead-3',
    name: 'Reunião Agendada',
    code: 'reuniao-agendada',
    leadStatus: LeadStatus.Reuniao_Agendada,
    pipelineId: 'pipe-lead',
    pipeline: { id: 'pipe-lead', entity: CrmPipelineEntity.Lead, organizationId: ORG },
    ...overrides,
  });
}

function makePreviousLead(overrides: Record<string, unknown> = {}) {
  return {
    id: LEAD_ID,
    organizationId: ORG,
    funnel: LeadFunnel.Negocio,
    status: LeadStatus.Nova_Oportunidade,
    pipelineId: 'pipe-deal',
    pipelineStageId: 'stage-deal-1',
    probability: 15,
    closedAt: null,
    expectedCloseAt: null,
    deletedAt: null,
    ...overrides,
  };
}

function makeUpdatedLead(overrides: Record<string, unknown> = {}) {
  return {
    id: LEAD_ID,
    organizationId: ORG,
    funnel: LeadFunnel.Negocio,
    status: LeadStatus.Proposta_Enviada,
    pipelineId: 'pipe-deal',
    pipelineStageId: 'stage-deal-2',
    probability: 45,
    closedAt: null,
    expectedCloseAt: null,
    company: null,
    contact: null,
    pipelineStage: null,
    dealItems: [],
    ...overrides,
  };
}

function makeRepo() {
  return new PrismaCrm360Repository({} as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PrismaCrm360Repository.updateLeadStage — transições válidas', () => {
  it('move um Negócio dentro do pipeline de Negócios: status, probabilidade, etapa e histórico', async () => {
    const stage = makeStage();
    prismaMock.crmPipelineStage.findFirstOrThrow.mockResolvedValue(stage);
    prismaMock.lead.findFirstOrThrow.mockResolvedValue(makePreviousLead());
    prismaMock.lead.update.mockResolvedValue(makeUpdatedLead());

    const result = await makeRepo().updateLeadStage(ORG, LEAD_ID, stage.id, undefined, 'user-1');

    expect(prismaMock.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: LEAD_ID, organizationId: ORG, deletedAt: null },
        data: expect.objectContaining({
          probability: 45,
          status: LeadStatus.Proposta_Enviada,
          funnel: LeadFunnel.Negocio,
          pipeline: { connect: { id: 'pipe-deal' } },
          pipelineStage: { connect: { id: 'stage-deal-2' } },
        }),
      }),
    );
    expect(recordStageTransitionMock).toHaveBeenCalledWith(ORG, LEAD_ID, stage, 'pipe-deal');
    expect(result).toMatchObject({ status: 'Proposta Enviada' });
  });

  it('reabre um negócio fechado: sai de status fechado para etapa aberta e limpa closedAt', async () => {
    const stage = makeStage();
    prismaMock.crmPipelineStage.findFirstOrThrow.mockResolvedValue(stage);
    prismaMock.lead.findFirstOrThrow.mockResolvedValue(
      makePreviousLead({
        status: LeadStatus.Negocios_Perdidos,
        closedAt: new Date('2026-01-01'),
      }),
    );
    prismaMock.lead.update.mockResolvedValue(makeUpdatedLead());

    await makeRepo().updateLeadStage(ORG, LEAD_ID, stage.id);

    expect(prismaMock.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ closedAt: null }),
      }),
    );
  });

  it('aceita expectedCloseDate válida e registra a mudança em LeadFieldChange', async () => {
    const stage = makeStage();
    const closeDate = new Date('2026-12-31T00:00:00.000Z');
    prismaMock.crmPipelineStage.findFirstOrThrow.mockResolvedValue(stage);
    prismaMock.lead.findFirstOrThrow.mockResolvedValue(makePreviousLead());
    prismaMock.lead.update.mockResolvedValue(makeUpdatedLead({ expectedCloseAt: closeDate }));

    await makeRepo().updateLeadStage(ORG, LEAD_ID, stage.id, closeDate, 'user-1');

    expect(prismaMock.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ expectedCloseAt: closeDate }),
      }),
    );
    expect(recordLeadFieldChangesMock).toHaveBeenCalledWith(
      ORG,
      LEAD_ID,
      { expectedCloseAt: null },
      { expectedCloseAt: closeDate },
      { source: 'crm360', changedBy: 'user-1' },
    );
  });
});

describe('PrismaCrm360Repository.updateLeadStage — transições inválidas', () => {
  it('rejeita mover um Negócio para etapa do pipeline de Leads (cross-funnel)', async () => {
    const stage = makeLeadStage();
    prismaMock.crmPipelineStage.findFirstOrThrow.mockResolvedValue(stage);
    prismaMock.lead.findFirstOrThrow.mockResolvedValue(makePreviousLead());

    await expect(makeRepo().updateLeadStage(ORG, LEAD_ID, stage.id)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(prismaMock.lead.update).not.toHaveBeenCalled();
    expect(recordStageTransitionMock).not.toHaveBeenCalled();
  });

  it('rejeita mover um Lead para etapa do pipeline de Negócios (contornaria convertLead)', async () => {
    const stage = makeStage();
    prismaMock.crmPipelineStage.findFirstOrThrow.mockResolvedValue(stage);
    prismaMock.lead.findFirstOrThrow.mockResolvedValue(
      makePreviousLead({ funnel: LeadFunnel.Lead, status: LeadStatus.Reuniao_Agendada }),
    );

    await expect(makeRepo().updateLeadStage(ORG, LEAD_ID, stage.id)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(prismaMock.lead.update).not.toHaveBeenCalled();
  });

  it('rejeita etapa sem leadStatus mapeado (deixaria status divergente da etapa)', async () => {
    const stage = makeStage({ leadStatus: null });
    prismaMock.crmPipelineStage.findFirstOrThrow.mockResolvedValue(stage);
    prismaMock.lead.findFirstOrThrow.mockResolvedValue(makePreviousLead());

    await expect(makeRepo().updateLeadStage(ORG, LEAD_ID, stage.id)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(prismaMock.lead.update).not.toHaveBeenCalled();
  });

  it('rejeita expectedCloseDate inválida com 400 (antes virava Invalid Date → 500 no Prisma)', async () => {
    const stage = makeStage();
    prismaMock.crmPipelineStage.findFirstOrThrow.mockResolvedValue(stage);
    prismaMock.lead.findFirstOrThrow.mockResolvedValue(makePreviousLead());

    await expect(
      makeRepo().updateLeadStage(ORG, LEAD_ID, stage.id, new Date('data-invalida')),
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      makeRepo().updateLeadStage(ORG, LEAD_ID, stage.id, 'não-é-data'),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(prismaMock.lead.update).not.toHaveBeenCalled();
  });

  it('não move registro inexistente/de outro tenant/deleted: propaga o erro do findFirst', async () => {
    prismaMock.crmPipelineStage.findFirstOrThrow.mockResolvedValue(makeStage());
    prismaMock.lead.findFirstOrThrow.mockRejectedValue(new Error('not found'));

    await expect(makeRepo().updateLeadStage(ORG, 'outro', 'stage-x')).rejects.toThrow('not found');
    expect(prismaMock.lead.update).not.toHaveBeenCalled();
  });
});

describe('PrismaCrm360Repository.convertLead — conversão mão única', () => {
  function mockDefaultPipelines() {
    // ensureDefaultPipelines → upsertDefaultPipeline: findUnique null força o caminho upsert;
    // devolvemos pipelines já com todos os estágios para pular createMany/findFirstOrThrow.
    prismaMock.crmPipeline.findUnique.mockResolvedValue(null);
    prismaMock.crmPipeline.upsert.mockImplementation(({ create }: { create: any }) => {
      const stages = (create.stages?.create ?? []).map((s: any, i: number) => ({
        ...s,
        id: `stage-${create.name === 'Funil de Leads' ? 'lead' : 'deal'}-${i}`,
        pipelineId: 'pipe-x',
      }));
      return Promise.resolve({ ...create, id: `pipe-${create.name}`, stages });
    });
    prismaMock.lead.count.mockResolvedValue(0); // attachLegacyRecords: nenhum órfão
  }

  it('converte Lead → Negócio: funil, 1ª etapa, timeline e histórico', async () => {
    mockDefaultPipelines();
    prismaMock.lead.findFirstOrThrow.mockResolvedValue(
      makePreviousLead({ funnel: LeadFunnel.Lead, status: LeadStatus.Reuniao_Agendada }),
    );
    prismaMock.lead.update.mockResolvedValue(
      makeUpdatedLead({ funnel: LeadFunnel.Negocio, pipelineStageId: 'stage-deal-0' }),
    );

    await makeRepo().convertLead(ORG, LEAD_ID);

    expect(prismaMock.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: LEAD_ID, organizationId: ORG, deletedAt: null },
        data: expect.objectContaining({
          funnel: LeadFunnel.Negocio,
          status: LeadStatus.Nova_Oportunidade,
          pipelineStageId: 'stage-deal-0',
          closedAt: null,
          timeline: { create: { type: 'conversion', description: 'Lead convertido em negócio' } },
        }),
      }),
    );
    expect(recordStageTransitionMock).toHaveBeenCalledTimes(1);
  });

  it('rejeita converter registro que já é Negócio (409) — sem reset de etapa/closedAt', async () => {
    mockDefaultPipelines();
    prismaMock.lead.findFirstOrThrow.mockResolvedValue(makePreviousLead()); // funnel Negocio

    await expect(makeRepo().convertLead(ORG, LEAD_ID)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(prismaMock.lead.update).not.toHaveBeenCalled();
    expect(recordStageTransitionMock).not.toHaveBeenCalled();
  });
});

import {
  CrmDocumentStatus,
  CrmPipelineEntity,
  LeadFunnel,
  LeadStatus,
  type Prisma,
} from '@prisma/client';
import {
  fromPrismaActivityStatus,
  fromPrismaActivityType,
  fromPrismaLeadStatus,
  LEAD_CLOSING_STATUSES,
  toPrismaLeadStatus,
} from '../../../lib/enumMap.js';
import { prisma } from '../../../lib/prisma.js';
import type { StripeChargePort } from '../../../shared/contracts/stripeCharge.contract.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';
import { recordLeadFieldChanges } from '../../../shared/services/leadFieldChangeHistory.service.js';
import { recordStageTransition } from '../../../shared/services/leadStageHistory.service.js';
import { ensureManualDealClosureAllowed } from '../../crm/application/dealClosureGate.js';
import { prismaDealClosureGate } from '../../crm/infra/PrismaDealClosureGate.js';
import type {
  CrmDealItemInput,
  CrmDocumentInput,
  CrmDocumentSignatureRequestInput,
  CrmDocumentUpdateInput,
  CrmProductInput,
} from '../crm360.schema.js';
import type {
  CrmCommercialDocument,
  CrmCommercialDocumentVersionDTO,
  CrmDealItem,
  CrmOverviewData,
  CrmPipeline,
  CrmProduct,
  CrmPublicDocumentView,
} from '../crm360.types.js';
import type { ICrm360Repository } from '../domain/ICrm360Repository.js';
import { roundMoney } from './crm360Calculations.js';
import { DEAL_STAGES, type DefaultStage, LEAD_STAGES } from './defaultPipelineStages.js';
import { PrismaCrmDealItemsRepository } from './PrismaCrmDealItemsRepository.js';
import { PrismaCrmDocumentRepository } from './PrismaCrmDocumentRepository.js';

// DATA-004 (Sprint 05/Onda 17): derivado da mesma fonte única usada por PrismaLeadRepository
// (update()/updateStatus()) — antes desta correção esta lista tinha só 2 status (Ganhos/Perdidos),
// diferente da lista de 4 usada por updateStatus(), então um piloto cancelado por este caminho
// (PUT /api/crm/records/:id/stage) continuava contando como "negócio aberto" em openDeals/pipelineValue.
const CLOSED_DEAL_STATUSES: LeadStatus[] = [...LEAD_CLOSING_STATUSES].map(
  (label) => toPrismaLeadStatus(label) as LeadStatus,
);

/**
 * Onda 43 (achado da auditoria de N+1 da Onda 42, seção "observação relacionada"): esta função é
 * chamada em TODA leitura do CRM360 (getOverviewData/getPipelines/getBoardLeads — as 3 rotas de
 * listagem mais usadas do módulo), não só na primeira vez. Antes desta correção, isso significava
 * um `upsert` (sempre grava uma linha, mesmo sem nenhuma mudança real) + uma releitura completa do
 * pipeline com estágios, por pipeline, em toda chamada — uma dezena de round-trips de
 * escrita/leitura desnecessários toda vez que alguém abre o board/pipelines/overview, mesmo quando
 * o pipeline já está provisionado e nenhum lead legado precisa migrar.
 *
 * Fast path: se o pipeline já existe com os estágios certos e as flags que este `update` sempre
 * grava (`active`/`isDefault`/`entity`/`sortOrder`) já batem, devolve o que já foi lido, sem tocar
 * em nada. Só cai no caminho antigo (upsert + provisionamento de estágio) quando falta algo de
 * verdade — primeira vez da organização, ou um estágio novo que a lista `stages` ganhou desde a
 * última leitura. `attachLegacyRecords` (chamada por quem invoca esta função) continua rodando
 * sempre, sem alteração — é o mecanismo real de atribuição de pipeline/estágio a lead (todo lead
 * nasce com `pipelineId: null`; não é uma migração única de dado legado, apesar do nome).
 */
async function upsertDefaultPipeline(
  organizationId: string,
  name: string,
  entity: CrmPipelineEntity,
  sortOrder: number,
  stages: DefaultStage[],
) {
  const existing = await prisma.crmPipeline.findUnique({
    where: { organizationId_name: { organizationId, name } },
    include: { stages: { orderBy: { sortOrder: 'asc' } } },
  });

  if (
    existing?.active &&
    existing.isDefault &&
    existing.entity === entity &&
    existing.sortOrder === sortOrder &&
    existing.stages.length >= stages.length
  ) {
    return existing;
  }

  const pipeline = await prisma.crmPipeline.upsert({
    where: { organizationId_name: { organizationId, name } },
    update: { active: true, isDefault: true, entity, sortOrder },
    create: {
      name,
      entity,
      isDefault: true,
      sortOrder,
      organizationId,
      stages: {
        create: stages.map((stage, index) => ({ ...stage, sortOrder: index })),
      },
    },
    include: { stages: { orderBy: { sortOrder: 'asc' } } },
  });

  if (pipeline.stages.length >= stages.length) {
    return pipeline;
  }

  await prisma.crmPipelineStage.createMany({
    data: stages.map((stage, index) => ({ ...stage, sortOrder: index, pipelineId: pipeline.id })),
    skipDuplicates: true,
  });

  return prisma.crmPipeline.findFirstOrThrow({
    where: { id: pipeline.id, organizationId },
    include: { stages: { orderBy: { sortOrder: 'asc' } } },
  });
}

async function attachLegacyRecords(
  organizationId: string,
  pipeline: Awaited<ReturnType<typeof upsertDefaultPipeline>>,
  funnel: LeadFunnel,
) {
  // TAREFA-SANEAMENTO-018 (BT360-DT-0024): esta função roda em TODA leitura do CRM360
  // (getOverviewData/getPipelines/getBoardLeads/convertLead). Sem este pre-check, cada
  // chamada disparava um `updateMany` por estágio do funil (6 em Leads + 12 em Negócios =
  // até 18 escritas) mesmo quando nenhum lead estava pendente de atribuição — o maior
  // custo de escrita do módulo em regime permanente. Um único `count` resolve: se não
  // existe lead órfão (pipelineId null) cujo status case com algum estágio, nenhum
  // `updateMany` teria efeito e o loop inteiro é pulado.
  const stageStatuses = [
    ...new Set(
      pipeline.stages
        .map((stage) => stage.leadStatus)
        .filter((status): status is LeadStatus => status != null),
    ),
  ];
  if (stageStatuses.length === 0) return;

  const pendingOrphans = await prisma.lead.count({
    where: {
      organizationId,
      funnel,
      pipelineId: null,
      status: { in: stageStatuses },
    },
  });
  if (pendingOrphans === 0) return;

  for (const stage of pipeline.stages) {
    if (!stage.leadStatus) continue;
    await prisma.lead.updateMany({
      where: { organizationId, funnel, status: stage.leadStatus, pipelineId: null },
      data: { pipelineId: pipeline.id, pipelineStageId: stage.id, probability: stage.probability },
    });
  }
}

export async function ensureDefaultPipelines(organizationId: string) {
  const leadPipeline = await upsertDefaultPipeline(
    organizationId,
    'Funil de Leads',
    CrmPipelineEntity.Lead,
    0,
    LEAD_STAGES,
  );
  const dealPipeline = await upsertDefaultPipeline(
    organizationId,
    'Funil de Negócios',
    CrmPipelineEntity.Negocio,
    1,
    DEAL_STAGES,
  );
  await attachLegacyRecords(organizationId, leadPipeline, LeadFunnel.Lead);
  await attachLegacyRecords(organizationId, dealPipeline, LeadFunnel.Negocio);
  return { leadPipeline, dealPipeline };
}

/**
 * Fachada estável do repositório CRM360 (implementa `ICrm360Repository`). Mantém overview,
 * pipelines, board e transições de estágio/lead; delega documentos comerciais a
 * `PrismaCrmDocumentRepository` e catálogo/itens de negócio a `PrismaCrmDealItemsRepository`
 * (extração da refatoração de hotspot — Onda 3, handoff 00→04 — sem mudança de comportamento).
 */
export class PrismaCrm360Repository implements ICrm360Repository {
  private readonly documents: PrismaCrmDocumentRepository;
  private readonly dealItems: PrismaCrmDealItemsRepository;

  constructor(stripeChargePort: StripeChargePort) {
    this.documents = new PrismaCrmDocumentRepository(stripeChargePort);
    this.dealItems = new PrismaCrmDealItemsRepository();
  }

  async getOverviewData(organizationId: string): Promise<CrmOverviewData> {
    await ensureDefaultPipelines(organizationId);
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(startToday);
    endToday.setDate(endToday.getDate() + 1);

    const [
      leads,
      openDeals,
      wonDeals,
      lostDeals,
      pipelineValue,
      overdueActivities,
      todayActivities,
      pendingDocuments,
      focusActivities,
      recentDeals,
      stageCounts,
      // biome-ignore lint/plugin/no-prisma-tx-escape: uso legado congelado no baseline (parecer 15 #40 L1); migrar para runInTransaction
    ] = await prisma.$transaction([
      prisma.lead.count({ where: { organizationId, funnel: LeadFunnel.Lead } }),
      prisma.lead.count({
        where: {
          organizationId,
          funnel: LeadFunnel.Negocio,
          status: { notIn: CLOSED_DEAL_STATUSES },
        },
      }),
      prisma.lead.count({
        where: { organizationId, funnel: LeadFunnel.Negocio, status: LeadStatus.Negocios_Ganhos },
      }),
      prisma.lead.count({
        where: { organizationId, funnel: LeadFunnel.Negocio, status: LeadStatus.Negocios_Perdidos },
      }),
      prisma.lead.findMany({
        where: {
          organizationId,
          funnel: LeadFunnel.Negocio,
          status: { notIn: CLOSED_DEAL_STATUSES },
        },
        select: { amount: true, probability: true },
      }),
      prisma.activity.count({
        where: {
          organizationId,
          status: { in: ['Pendente', 'Em_andamento'] },
          date: { lt: startToday },
        },
      }),
      prisma.activity.count({
        where: {
          organizationId,
          status: { in: ['Pendente', 'Em_andamento'] },
          date: { gte: startToday, lt: endToday },
        },
      }),
      prisma.crmCommercialDocument.count({
        where: {
          organizationId,
          status: {
            in: [
              CrmDocumentStatus.Rascunho,
              CrmDocumentStatus.Enviado,
              CrmDocumentStatus.Visualizado,
            ],
          },
        },
      }),
      prisma.activity.findMany({
        where: { organizationId, status: { in: ['Pendente', 'Em_andamento'] } },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
        take: 12,
        include: { lead: { include: { company: true, contact: true } } },
      }),
      prisma.lead.findMany({
        where: { organizationId, funnel: LeadFunnel.Negocio },
        orderBy: { updatedAt: 'desc' },
        take: 8,
        include: { company: true, contact: true, pipelineStage: true },
      }),
      prisma.lead.groupBy({
        where: { organizationId },
        by: ['funnel', 'status'],
        _count: { _all: true },
        _sum: { amount: true },
        orderBy: { funnel: 'asc' },
      }),
    ]);

    const totalPipeline = pipelineValue.reduce((sum, deal) => sum + (deal.amount ?? 0), 0);
    const weightedPipeline = pipelineValue.reduce(
      (sum, deal) => sum + (deal.amount ?? 0) * ((deal.probability ?? 0) / 100),
      0,
    );

    return {
      kpis: {
        leads,
        openDeals,
        wonDeals,
        lostDeals,
        conversionRate:
          wonDeals + lostDeals > 0 ? roundMoney((wonDeals / (wonDeals + lostDeals)) * 100) : 0,
        pipelineValue: roundMoney(totalPipeline),
        weightedPipeline: roundMoney(weightedPipeline),
        overdueActivities,
        todayActivities,
        pendingDocuments,
      },
      focusActivities: focusActivities.map((activity) => ({
        ...activity,
        type: fromPrismaActivityType(activity.type),
        status: fromPrismaActivityStatus(activity.status),
        lead: activity.lead
          ? { ...activity.lead, status: fromPrismaLeadStatus(activity.lead.status) }
          : null,
      })) as unknown as CrmOverviewData['focusActivities'],
      recentDeals: recentDeals.map((deal) => ({
        ...deal,
        status: fromPrismaLeadStatus(deal.status),
      })) as unknown as CrmOverviewData['recentDeals'],
      stageCounts: stageCounts.map((row) => ({
        funnel: row.funnel as 'Lead' | 'Negocio',
        status: fromPrismaLeadStatus(row.status),
        count: (row._count as { _all?: number })._all ?? 0,
        amount: (row._sum as { amount?: number | null }).amount ?? 0,
      })),
    };
  }

  async getPipelines(organizationId: string): Promise<CrmPipeline[]> {
    await ensureDefaultPipelines(organizationId);
    const pipelines = await prisma.crmPipeline.findMany({
      where: { organizationId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        stages: { orderBy: { sortOrder: 'asc' }, include: { _count: { select: { leads: true } } } },
      },
    });
    return pipelines as unknown as CrmPipeline[];
  }

  async getDeals(organizationId: string): Promise<unknown[]> {
    // TAREFA-SANEAMENTO-018 (BT360-DT-0024): o try/catch→[] anterior era um fallback
    // enganoso — uma falha de banco/RLS virava "lista vazia" indistinguível de "sem
    // negócios", violando AGENTS.md §30/§32. O erro agora propaga; o controller mantém
    // o comportamento defensivo de resposta (200 + []) mas registra o erro no log.
    const deals = await prisma.lead.findMany({
      where: {
        organizationId,
        funnel: LeadFunnel.Negocio,
        deletedAt: null,
      },
      // MEL-16 follow-up (DEM-20261114-003): sem `dealItems` — é relação to-many e a listagem
      // baixava TODOS os itens de cada negócio da página (mesmo over-fetch corrigido em
      // companies na Onda 2). Nenhum consumidor de /api/crm/deals usa dealItems — existe
      // endpoint dedicado GET /api/crm/deals/:leadId/items para isso.
      include: {
        company: true,
        contact: true,
        pipelineStage: true,
      },
      orderBy: [{ probability: 'desc' }, { updatedAt: 'desc' }],
    });
    return deals.map((deal) => ({
      ...deal,
      status: fromPrismaLeadStatus(deal.status),
    }));
  }

  async getBoardLeads(organizationId: string, funnelStr = 'Negocio', pipelineId?: string) {
    const funnel = funnelStr === 'Lead' ? LeadFunnel.Lead : LeadFunnel.Negocio;
    await ensureDefaultPipelines(organizationId);

    let pipeline = pipelineId
      ? await prisma.crmPipeline.findFirst({
          where: { id: pipelineId, organizationId },
          include: { stages: { orderBy: { sortOrder: 'asc' } } },
        })
      : null;

    if (!pipeline) {
      pipeline = await prisma.crmPipeline.findFirst({
        where: {
          organizationId,
          entity: funnel === LeadFunnel.Lead ? CrmPipelineEntity.Lead : CrmPipelineEntity.Negocio,
          isDefault: true,
        },
        include: { stages: { orderBy: { sortOrder: 'asc' } } },
      });
    }

    const leads = await prisma.lead.findMany({
      where: { organizationId, funnel, ...(pipeline ? { pipelineId: pipeline.id } : {}) },
      // MEL-16 follow-up (DEM-20261114-003): sem `dealItems` — ver comentário em getDeals.
      include: { company: true, contact: true, pipelineStage: true },
      orderBy: [{ probability: 'desc' }, { updatedAt: 'desc' }],
    });

    return {
      stages: (pipeline?.stages ?? []).map((stage) => ({
        ...stage,
        leadStatus: stage.leadStatus ? fromPrismaLeadStatus(stage.leadStatus) : null,
      })),
      leads: leads.map((lead) => ({ ...lead, status: fromPrismaLeadStatus(lead.status) })),
    };
  }

  async updateLeadStage(
    organizationId: string,
    leadId: string,
    stageId: string,
    expectedCloseDate?: Date | string | number,
    actorUserId?: string,
  ) {
    const stage = await prisma.crmPipelineStage.findFirstOrThrow({
      where: { id: stageId, pipeline: { organizationId } },
      include: { pipeline: true },
    });

    // Tenancy (handoff 01A→04, onda-paralela-8): valida existência e tenancy do lead ANTES de
    // invocar o gate CYC-007 — evita criar Note e DealClosureEvent órfãos para um leadId estrangeiro.
    // `deletedAt: null`: registro soft-deleted não pode mais mudar de etapa (mesmo filtro de
    // getDeals) — sem isso um lead excluído continuava mutável por este endpoint.
    const previousLead = await prisma.lead.findFirstOrThrow({
      where: { id: leadId, organizationId, deletedAt: null },
    });

    // POS3-42-STAGE-TRANSITIONS: o endpoint aceitava qualquer `stageId` da organização, sem
    // verificar se a etapa pertence ao funil do registro. Uma etapa do pipeline de Leads movia
    // um Negócio (funnel virava Lead — o negócio sumia de getDeals/forecast/openDeals mantendo
    // dados comerciais) e vice-versa (um Lead "virava" negócio silenciosamente, contornando
    // `convertLead`, que registra a timeline de conversão). `SmartProcess` não tem LeadFunnel
    // equivalente, então qualquer entidade diferente da esperada é rejeitada.
    const expectedEntity =
      previousLead.funnel === LeadFunnel.Lead ? CrmPipelineEntity.Lead : CrmPipelineEntity.Negocio;
    if (stage.pipeline.entity !== expectedEntity) {
      throw new AppError(
        `Transição de estágio inválida: a etapa "${stage.name}" pertence a um pipeline do tipo ` +
          `"${stage.pipeline.entity}", incompatível com o funil "${previousLead.funnel}" do registro.`,
        400,
      );
    }

    // Etapa sem `leadStatus` não define status/closedAt — mover o registro para ela deixaria
    // `status` (e closedAt, se já estava fechado) divergente da etapa exibida no board.
    if (!stage.leadStatus) {
      throw new AppError(
        `A etapa "${stage.name}" não possui status mapeado; a movimentação deixaria o status do registro divergente da etapa.`,
        400,
      );
    }

    // `expectedCloseDate` chega do body sem passar por schema de data (moveCrmRecordSchema só
    // declara stageId) — `new Date(lixo)` produz Invalid Date, que estourava 500 no Prisma.
    // Falha de entrada do cliente é 400, não erro de servidor.
    let expectedCloseAt: Date | undefined;
    if (expectedCloseDate) {
      expectedCloseAt =
        expectedCloseDate instanceof Date ? expectedCloseDate : new Date(expectedCloseDate);
      if (Number.isNaN(expectedCloseAt.getTime())) {
        throw new AppError('expectedCloseDate inválida: informe uma data válida.', 400);
      }
    }

    // CYC-007 (onda 24): mover para uma etapa mapeada em "Negócios Ganhos" é o 3º caminho de
    // escrita real (junto com LeadUseCases.updateLeadStatus/updateLead) que precisa do gate de
    // fechamento determinístico — sem isto, o módulo CRM360 continuaria fechando negócios sem
    // nenhuma evidência, mesmo depois do gate ser conectado nos outros dois caminhos.
    if (stage.leadStatus === LeadStatus.Negocios_Ganhos) {
      if (!actorUserId)
        throw new AppError('Fechar um negócio exige um usuário autenticado identificado.', 401);
      await ensureManualDealClosureAllowed(prismaDealClosureGate, {
        organizationId,
        leadId,
        actorUserId,
      });
    }

    const updateData: Prisma.LeadUpdateInput = {
      pipeline: { connect: { id: stage.pipelineId } },
      pipelineStage: { connect: { id: stage.id } },
      probability: stage.probability,
      funnel:
        stage.pipeline.entity === CrmPipelineEntity.Lead ? LeadFunnel.Lead : LeadFunnel.Negocio,
    };

    if (expectedCloseAt) updateData.expectedCloseAt = expectedCloseAt;

    if (stage.leadStatus) {
      updateData.status = stage.leadStatus;
      if (CLOSED_DEAL_STATUSES.includes(stage.leadStatus) && !previousLead.closedAt) {
        updateData.closedAt = new Date();
      } else if (!CLOSED_DEAL_STATUSES.includes(stage.leadStatus)) {
        updateData.closedAt = null;
      }
    }

    const updated = await prisma.lead.update({
      // organizationId também no `where` (mesmo padrão de defesa-em-profundidade do Piloto 002 e
      // já usado por convertLead logo abaixo) — não corrige uma falha explorável hoje (o
      // findFirstOrThrow acima + RLS real já bloqueiam um tenant errado), mas deixa a query de
      // escrita autocontida em vez de depender só do pré-check + RLS como únicas camadas.
      where: { id: leadId, organizationId, deletedAt: null },
      data: updateData,
      include: { company: true, contact: true, pipelineStage: true, dealItems: true },
    });

    if (previousLead.pipelineStageId !== stage.id) {
      await recordStageTransition(organizationId, leadId, stage, stage.pipelineId);
    }
    if (expectedCloseAt) {
      await recordLeadFieldChanges(
        organizationId,
        leadId,
        { expectedCloseAt: previousLead.expectedCloseAt },
        { expectedCloseAt: expectedCloseAt },
        { source: 'crm360', changedBy: actorUserId ?? null },
      );
    }

    return { ...updated, status: fromPrismaLeadStatus(updated.status) };
  }

  async convertLead(organizationId: string, leadId: string) {
    const { dealPipeline } = await ensureDefaultPipelines(organizationId);
    const stage = dealPipeline.stages[0];
    if (!stage) throw new Error('O funil de negócios não possui etapa inicial');

    // POS3-42-STAGE-TRANSITIONS: antes não havia nenhuma verificação do estado atual — chamar
    // convert num registro que JÁ é Negócio (ou soft-deleted) o resetava para a 1ª etapa do
    // funil, apagava closedAt e gravava uma 2ª timeline de "conversion" + LeadStageHistory
    // espúria. Conversão é uma transição de mão única Lead → Negócio.
    const previousLead = await prisma.lead.findFirstOrThrow({
      where: { id: leadId, organizationId, deletedAt: null },
    });
    if (previousLead.funnel !== LeadFunnel.Lead) {
      throw new AppError(
        'Apenas registros do funil de Leads podem ser convertidos em negócio.',
        409,
      );
    }

    const updated = await prisma.lead.update({
      where: { id: leadId, organizationId, deletedAt: null },
      data: {
        funnel: LeadFunnel.Negocio,
        status: stage.leadStatus ?? LeadStatus.Nova_Oportunidade,
        pipelineId: dealPipeline.id,
        pipelineStageId: stage.id,
        probability: stage.probability,
        closedAt: null,
        timeline: { create: { type: 'conversion', description: 'Lead convertido em negócio' } },
      },
      include: { company: true, contact: true, pipeline: true, pipelineStage: true },
    });

    await recordStageTransition(organizationId, leadId, stage, dealPipeline.id);

    return { ...updated, status: fromPrismaLeadStatus(updated.status) };
  }

  // ── Delegação: produtos & itens de negócio → PrismaCrmDealItemsRepository ──

  listProducts(organizationId: string, search?: string): Promise<CrmProduct[]> {
    return this.dealItems.listProducts(organizationId, search);
  }

  createProduct(organizationId: string, data: CrmProductInput): Promise<CrmProduct> {
    return this.dealItems.createProduct(organizationId, data);
  }

  getDealItems(organizationId: string, leadId: string): Promise<CrmDealItem[]> {
    return this.dealItems.getDealItems(organizationId, leadId);
  }

  addDealItem(
    organizationId: string,
    leadId: string,
    input: CrmDealItemInput,
    actorUserId?: string,
  ): Promise<CrmDealItem> {
    return this.dealItems.addDealItem(organizationId, leadId, input, actorUserId);
  }

  removeDealItem(organizationId: string, leadId: string, itemId: string): Promise<void> {
    return this.dealItems.removeDealItem(organizationId, leadId, itemId);
  }

  // ── Delegação: documentos comerciais → PrismaCrmDocumentRepository ──

  listDocuments(organizationId: string, leadId?: string): Promise<CrmCommercialDocument[]> {
    return this.documents.listDocuments(organizationId, leadId);
  }

  createDocument(
    organizationId: string,
    input: CrmDocumentInput,
    actorUserId?: string,
  ): Promise<CrmCommercialDocument> {
    return this.documents.createDocument(organizationId, input, actorUserId);
  }

  updateDocumentContent(
    organizationId: string,
    documentId: string,
    input: CrmDocumentUpdateInput,
    actorUserId?: string,
  ): Promise<CrmCommercialDocument> {
    return this.documents.updateDocumentContent(organizationId, documentId, input, actorUserId);
  }

  listDocumentVersions(
    organizationId: string,
    documentId: string,
  ): Promise<CrmCommercialDocumentVersionDTO[]> {
    return this.documents.listDocumentVersions(organizationId, documentId);
  }

  updateDocumentStatus(
    organizationId: string,
    documentId: string,
    status: string,
    actorUserId?: string,
  ): Promise<CrmCommercialDocument> {
    return this.documents.updateDocumentStatus(organizationId, documentId, status, actorUserId);
  }

  reconcileFaturaStripePayment(
    organizationId: string,
    documentId: string,
    connectionId: string,
    paymentIntentId: string,
    actorUserId?: string,
  ): Promise<CrmCommercialDocument> {
    return this.documents.reconcileFaturaStripePayment(
      organizationId,
      documentId,
      connectionId,
      paymentIntentId,
      actorUserId,
    );
  }

  recordDocumentView(publicToken: string): Promise<CrmPublicDocumentView | null> {
    return this.documents.recordDocumentView(publicToken);
  }

  requestDocumentSignature(
    organizationId: string,
    documentId: string,
    actorUserId: string | undefined,
    input: CrmDocumentSignatureRequestInput,
  ): Promise<{ id: string; providerRequestId: string }> {
    return this.documents.requestDocumentSignature(organizationId, documentId, actorUserId, input);
  }
}

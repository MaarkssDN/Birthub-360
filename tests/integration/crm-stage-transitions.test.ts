import { LeadFunnel, LeadStatus } from '@prisma/client';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { requestContext } from '../../src/lib/async-context';
import { prisma } from '../../src/lib/prisma';
import { LeadUseCases } from '../../src/features/crm/application/LeadUseCases';
import { PrismaLeadRepository } from '../../src/features/crm/infra/PrismaLeadRepository';
import {
  ensureDefaultPipelines,
  PrismaCrm360Repository,
} from '../../src/features/crm360/infra/PrismaCrm360Repository';
import { StripeChargeAdapter } from '../../src/features/integrations/stripe/infra/StripeChargeAdapter';

/**
 * POS3-04-STAGE-TRANSITION-IT — suíte de integração (Postgres real, RLS real) das transições de
 * estágio do pipeline de deals/leads.
 *
 * Cobre os DOIS caminhos de escrita reais que movem uma oportunidade de etapa:
 *
 *  1. `PrismaCrm360Repository.updateLeadStage` — o caminho do board CRM360
 *     (`PUT /api/crm/records/:id/stage` → Crm360Controller.moveRecord → Crm360UseCases → repo).
 *     É o caminho que escreve `pipelineId`/`pipelineStageId`/`probability`/`funnel`/`status`/
 *     `closedAt` diretamente a partir da `CrmPipelineStage` de destino.
 *  2. `PrismaLeadRepository.updateStatus`/`update` via `LeadUseCases.updateLeadStatus`/`updateLead`
 *     — o caminho legado do Kanban de Leads (`PUT /api/leads/:id {status}`) e dos agentes de IA.
 *     Aqui o estágio de pipeline é DERIVADO do `status` via `findMatchingPipelineStage`
 *     (CRM-011) — a etapa "real" do CrmPipeline precisa acompanhar o enum `status`, senão as duas
 *     representações divergem (era exatamente o bug que o CRM-011 corrigiu).
 *
 * Em ambos os caminhos o efeito colateral esperado é `LeadStageHistory` (append-only, entrada
 * anterior fechada com `exitedAt`, nova entrada aberta) — ver `recordStageTransition` em
 * src/shared/services/leadStageHistory.service.ts.
 *
 * O que NÃO é duplicado aqui: o gate CYC-007 de fechamento ("Negócios Ganhos" exige ator humano +
 * Note + DealClosureEvent) já é coberto exaustivamente por tests/integration/dealClosureGate.test.ts
 * para os 3 caminhos. Aqui só se prova que a rejeição acontece ANTES de qualquer escrita de etapa
 * (nenhuma LeadStageHistory/LeadFieldChange órfã numa tentativa bloqueada).
 */

const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ORG = `test-stage-it-${RUN_ID}`;
const ORG_OTHER = `test-stage-it-other-${RUN_ID}`;

const withRlsBypass = <T>(fn: () => Promise<T>): Promise<T> =>
  requestContext.run({ bypassRls: true }, fn);
const asOrg = <T>(organizationId: string, fn: () => Promise<T>): Promise<T> =>
  requestContext.run({ tenantId: organizationId }, fn);

const leadUseCases = new LeadUseCases(new PrismaLeadRepository());
const leadRepository = new PrismaLeadRepository();
const crm360Repository = new PrismaCrm360Repository(new StripeChargeAdapter());

/** Etapa do funil padrão da organização, localizada pelo `code` (único por pipeline). */
async function stageByCode(organizationId: string, code: string, entity?: 'Lead' | 'Negocio') {
  return asOrg(organizationId, () =>
    prisma.crmPipelineStage.findFirstOrThrow({
      where: {
        code,
        pipeline: { organizationId, ...(entity ? { entity } : {}) },
      },
      include: { pipeline: true },
    }),
  );
}

/** Lead "negócio" já posicionado numa etapa do funil de Negócios (equivalente ao card no board). */
async function seedDealLead(
  organizationId: string,
  opts: { stageCode?: string; status?: LeadStatus } = {},
) {
  const stageCode = opts.stageCode ?? 'nova-oportunidade';
  const stage = await stageByCode(organizationId, stageCode, 'Negocio');
  return asOrg(organizationId, () =>
    prisma.lead.create({
      data: {
        organizationId,
        funnel: LeadFunnel.Negocio,
        status: opts.status ?? stage.leadStatus ?? LeadStatus.Nova_Oportunidade,
        pipelineId: stage.pipelineId,
        pipelineStageId: stage.id,
        probability: stage.probability,
        amount: 10_000,
        title: `Deal ${RUN_ID}`,
      },
    }),
  );
}

async function historyOf(organizationId: string, leadId: string) {
  return asOrg(organizationId, () =>
    prisma.leadStageHistory.findMany({
      where: { organizationId, leadId },
      orderBy: { enteredAt: 'asc' },
    }),
  );
}

async function openHistoryRows(organizationId: string, leadId: string) {
  const rows = await historyOf(organizationId, leadId);
  return rows.filter((row) => row.exitedAt === null);
}

beforeAll(async () => {
  await withRlsBypass(async () => {
    await prisma.organization.create({ data: { id: ORG, name: 'Test Org (stage IT)' } });
    await prisma.organization.create({ data: { id: ORG_OTHER, name: 'Test Org Other (stage IT)' } });
  });
  await asOrg(ORG, () => ensureDefaultPipelines(ORG));
  await asOrg(ORG_OTHER, () => ensureDefaultPipelines(ORG_OTHER));
});

afterEach(async () => {
  await withRlsBypass(async () => {
    for (const orgId of [ORG, ORG_OTHER]) {
      await prisma.dealClosureEvent.deleteMany({ where: { organizationId: orgId } });
      await prisma.leadFieldChange.deleteMany({ where: { organizationId: orgId } });
      await prisma.leadStageHistory.deleteMany({ where: { organizationId: orgId } });
      await prisma.note.deleteMany({ where: { lead: { organizationId: orgId } } });
      await prisma.lead.deleteMany({ where: { organizationId: orgId } });
      // Pipelines customizados criados por testes específicos (o funil padrão fica — é fixture).
      await prisma.crmPipeline.deleteMany({
        where: { organizationId: orgId, isDefault: false },
      });
    }
  });
});

afterAll(async () => {
  await withRlsBypass(async () => {
    for (const orgId of [ORG, ORG_OTHER]) {
      await prisma.dealClosureEvent.deleteMany({ where: { organizationId: orgId } });
      await prisma.leadFieldChange.deleteMany({ where: { organizationId: orgId } });
      await prisma.leadStageHistory.deleteMany({ where: { organizationId: orgId } });
      await prisma.note.deleteMany({ where: { lead: { organizationId: orgId } } });
      await prisma.lead.deleteMany({ where: { organizationId: orgId } });
      await prisma.crmPipeline.deleteMany({ where: { organizationId: orgId } });
      await prisma.organization.deleteMany({ where: { id: orgId } });
    }
  });
});

describe('CRM360 — updateLeadStage (PUT /api/crm/records/:id/stage)', () => {
  it('transição válida persiste estado consistente e abre LeadStageHistory', async () => {
    const lead = await seedDealLead(ORG);
    const target = await stageByCode(ORG, 'proposta-enviada', 'Negocio');

    const updated = await asOrg(ORG, () =>
      crm360Repository.updateLeadStage(ORG, lead.id, target.id, undefined, 'user-teste'),
    );
    expect((updated as { status: string }).status).toBe('Proposta Enviada');

    // Estado persistido relido do banco (não o objeto de retorno): as DUAS representações da
    // etapa (enum status + pipelineStageId) e os derivados (probability/funnel/pipelineId)
    // precisam convergir — é exatamente a divergência que o CRM-011 corrigiu.
    const persisted = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(persisted.status).toBe(LeadStatus.Proposta_Enviada);
    expect(persisted.pipelineStageId).toBe(target.id);
    expect(persisted.pipelineId).toBe(target.pipelineId);
    expect(persisted.probability).toBe(target.probability);
    expect(persisted.funnel).toBe(LeadFunnel.Negocio);
    expect(persisted.closedAt).toBeNull();

    const open = await openHistoryRows(ORG, lead.id);
    expect(open).toHaveLength(1);
    expect(open[0].stageId).toBe(target.id);
    expect(open[0].pipelineId).toBe(target.pipelineId);
    expect(open[0].stageName).toBe('Proposta Enviada');
    expect(open[0].probability).toBe(target.probability);
    expect(open[0].isWon).toBe(false);
    expect(open[0].isLost).toBe(false);
  });

  it('transições em sequência fecham a entrada anterior do histórico (exitedAt)', async () => {
    const lead = await seedDealLead(ORG);
    const proposta = await stageByCode(ORG, 'proposta-enviada', 'Negocio');
    const call = await stageByCode(ORG, 'call-visita', 'Negocio');

    await asOrg(ORG, () =>
      crm360Repository.updateLeadStage(ORG, lead.id, proposta.id, undefined, 'user-teste'),
    );
    await asOrg(ORG, () =>
      crm360Repository.updateLeadStage(ORG, lead.id, call.id, undefined, 'user-teste'),
    );

    const rows = await historyOf(ORG, lead.id);
    expect(rows).toHaveLength(2);
    const open = rows.filter((row) => row.exitedAt === null);
    expect(open).toHaveLength(1);
    expect(open[0].stageId).toBe(call.id);
    const closed = rows.find((row) => row.exitedAt !== null);
    expect(closed?.stageId).toBe(proposta.id);
    expect(closed?.exitedAt).not.toBeNull();

    const persisted = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(persisted.pipelineStageId).toBe(call.id);
    expect(persisted.probability).toBe(call.probability);
  });

  it('estágio inexistente é rejeitado sem tocar no lead nem gravar histórico', async () => {
    const lead = await seedDealLead(ORG);
    const before = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );

    await expect(
      asOrg(ORG, () =>
        crm360Repository.updateLeadStage(ORG, lead.id, 'stage-inexistente-xyz', undefined, 'u'),
      ),
    ).rejects.toThrow();

    const after = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(after.pipelineStageId).toBe(before.pipelineStageId);
    expect(after.status).toBe(before.status);
    expect(await historyOf(ORG, lead.id)).toHaveLength(0);
  });

  it('estágio pertencente a outro tenant é rejeitado (isolamento)', async () => {
    const lead = await seedDealLead(ORG);
    const foreignStage = await stageByCode(ORG_OTHER, 'proposta-enviada', 'Negocio');

    await expect(
      asOrg(ORG, () =>
        crm360Repository.updateLeadStage(ORG, lead.id, foreignStage.id, undefined, 'u'),
      ),
    ).rejects.toThrow();

    const untouched = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(untouched.pipelineStageId).not.toBe(foreignStage.id);
    expect(await historyOf(ORG, lead.id)).toHaveLength(0);
  });

  it('cross-pipeline no mesmo entity: etapa de pipeline customizado reponta pipelineId/stageId', async () => {
    const lead = await seedDealLead(ORG);
    const customPipeline = await asOrg(ORG, () =>
      prisma.crmPipeline.create({
        data: {
          name: `Pipeline Custom ${RUN_ID}`,
          entity: 'Negocio',
          isDefault: false,
          organizationId: ORG,
          stages: {
            create: [
              {
                name: 'Etapa Custom Qualificada',
                code: 'custom-qualificada',
                probability: 55,
                leadStatus: LeadStatus.Proposta_Enviada,
              },
            ],
          },
        },
        include: { stages: true },
      }),
    );
    const customStage = customPipeline.stages[0];

    await asOrg(ORG, () =>
      crm360Repository.updateLeadStage(ORG, lead.id, customStage.id, undefined, 'u'),
    );

    const persisted = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(persisted.pipelineId).toBe(customPipeline.id);
    expect(persisted.pipelineStageId).toBe(customStage.id);
    expect(persisted.probability).toBe(55);
    expect(persisted.status).toBe(LeadStatus.Proposta_Enviada);
    // Funil do registro segue o entity do pipeline da etapa de destino.
    expect(persisted.funnel).toBe(LeadFunnel.Negocio);

    const open = await openHistoryRows(ORG, lead.id);
    expect(open).toHaveLength(1);
    expect(open[0].pipelineId).toBe(customPipeline.id);
    expect(open[0].stageId).toBe(customStage.id);
    expect(open[0].stageName).toBe('Etapa Custom Qualificada');
  });

  it('cross-entity: mover registro do funil Negócio para etapa do funil Leads é rejeitado (POS3-42)', async () => {
    // O contrato mudou com a guarda POS3-42-STAGE-TRANSITIONS (commit 6069e6ae31): mover um
    // Negócio para etapa de pipeline Lead (ou vice-versa) era o bug que fazia o registro
    // "sumir" do funil de origem mantendo dados comerciais — agora é 400 e nada é escrito.
    const lead = await seedDealLead(ORG);
    const leadStage = await stageByCode(ORG, 'qualificacao-sdr', 'Lead');

    await expect(
      asOrg(ORG, () =>
        crm360Repository.updateLeadStage(ORG, lead.id, leadStage.id, undefined, 'u'),
      ),
    ).rejects.toThrow(/Transição de estágio inválida/);

    const persisted = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(persisted.funnel).toBe(LeadFunnel.Negocio);
    expect(persisted.pipelineStageId).not.toBe(leadStage.id);
    expect(persisted.status).not.toBe(LeadStatus.Qualificacao_SDR);
  });

  it('etapa de perda fecha o negócio (closedAt) e reabertura limpa closedAt', async () => {
    const lead = await seedDealLead(ORG);
    const perdido = await stageByCode(ORG, 'perdido', 'Negocio');
    const proposta = await stageByCode(ORG, 'proposta-enviada', 'Negocio');

    await asOrg(ORG, () =>
      crm360Repository.updateLeadStage(ORG, lead.id, perdido.id, undefined, 'u'),
    );
    const closed = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(closed.status).toBe(LeadStatus.Negocios_Perdidos);
    expect(closed.closedAt).not.toBeNull();

    const lostHistory = await openHistoryRows(ORG, lead.id);
    expect(lostHistory).toHaveLength(1);
    expect(lostHistory[0].isLost).toBe(true);

    // Reabertura: voltar para etapa aberta zera closedAt (mesma regra de updateStatus/update).
    await asOrg(ORG, () =>
      crm360Repository.updateLeadStage(ORG, lead.id, proposta.id, undefined, 'u'),
    );
    const reopened = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(reopened.status).toBe(LeadStatus.Proposta_Enviada);
    expect(reopened.closedAt).toBeNull();
  });

  it('etapa "Negócios Ganhos" sem actorUserId é bloqueada antes de qualquer escrita de etapa', async () => {
    const lead = await seedDealLead(ORG);
    const ganho = await stageByCode(ORG, 'ganho', 'Negocio');

    await expect(
      asOrg(ORG, () => crm360Repository.updateLeadStage(ORG, lead.id, ganho.id)),
    ).rejects.toThrow();

    const untouched = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(untouched.pipelineStageId).not.toBe(ganho.id);
    expect(untouched.status).not.toBe(LeadStatus.Negocios_Ganhos);
    // Gate rejeitou ANTES do update: nenhuma entrada de histórico nem campo alterado ficou
    // para trás de uma transição que não aconteceu.
    expect(await historyOf(ORG, lead.id)).toHaveLength(0);
    const events = await asOrg(ORG, () =>
      prisma.dealClosureEvent.findMany({ where: { organizationId: ORG, leadId: lead.id } }),
    );
    expect(events).toHaveLength(0);
  });

  it('expectedCloseDate atualiza o campo e grava LeadFieldChange (source=crm360)', async () => {
    const lead = await seedDealLead(ORG);
    const target = await stageByCode(ORG, 'proposta-enviada', 'Negocio');
    const newClose = new Date('2027-03-15T12:00:00.000Z');

    await asOrg(ORG, () =>
      crm360Repository.updateLeadStage(ORG, lead.id, target.id, newClose, 'user-teste'),
    );

    const persisted = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(persisted.expectedCloseAt?.toISOString()).toBe(newClose.toISOString());

    const changes = await asOrg(ORG, () =>
      prisma.leadFieldChange.findMany({
        where: { organizationId: ORG, leadId: lead.id, field: 'expectedCloseAt' },
      }),
    );
    expect(changes).toHaveLength(1);
    expect(changes[0].newValue).toBe(newClose.toISOString());
  });
});

describe('Caminho legado de status — updateStatus/update via LeadUseCases (PUT /api/leads/:id)', () => {
  it('mudança de status sincroniza pipelineStageId/probability e registra LeadStageHistory', async () => {
    const lead = await seedDealLead(ORG);
    const expectedStage = await stageByCode(ORG, 'proposta-enviada', 'Negocio');

    const updated = await asOrg(ORG, () =>
      leadUseCases.updateLeadStatus(ORG, lead.id, 'Proposta Enviada'),
    );
    expect((updated as { status: string }).status).toBe('Proposta Enviada');

    const persisted = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(persisted.status).toBe(LeadStatus.Proposta_Enviada);
    // O ponto do CRM-011: o Kanban legado só manda `status`, mas o repositório precisa derivar e
    // gravar a etapa do CrmPipeline correspondente — antes da correção, pipelineStageId ficava
    // congelado na etapa antiga e os relatórios de pipeline liam dados errados.
    expect(persisted.pipelineStageId).toBe(expectedStage.id);
    expect(persisted.pipelineId).toBe(expectedStage.pipelineId);
    expect(persisted.probability).toBe(expectedStage.probability);

    const open = await openHistoryRows(ORG, lead.id);
    expect(open).toHaveLength(1);
    expect(open[0].stageId).toBe(expectedStage.id);
  });

  it('edição completa (repo.update com status) também sincroniza a etapa do pipeline', async () => {
    const lead = await seedDealLead(ORG);
    const expectedStage = await stageByCode(ORG, 'call-visita', 'Negocio');

    await asOrg(ORG, () =>
      leadRepository.update(ORG, lead.id, { status: 'Call/Visita Agendada' } as never),
    );

    const persisted = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(persisted.status).toBe(LeadStatus.Call_Visita_Agendada);
    expect(persisted.pipelineStageId).toBe(expectedStage.id);
    expect(persisted.probability).toBe(expectedStage.probability);
  });

  it('status de fechamento seta closedAt e reabertura via status limpa closedAt', async () => {
    const lead = await seedDealLead(ORG);

    await asOrg(ORG, () =>
      leadUseCases.updateLeadStatus(ORG, lead.id, 'Negócios Perdidos'),
    );
    const closed = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(closed.status).toBe(LeadStatus.Negocios_Perdidos);
    expect(closed.closedAt).not.toBeNull();

    await asOrg(ORG, () =>
      leadUseCases.updateLeadStatus(ORG, lead.id, 'Proposta Enviada'),
    );
    const reopened = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(reopened.status).toBe(LeadStatus.Proposta_Enviada);
    expect(reopened.closedAt).toBeNull();
  });

  it('status desconhecido é rejeitado sem corromper o estado do lead', async () => {
    const lead = await seedDealLead(ORG);
    const before = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );

    await expect(
      asOrg(ORG, () =>
        leadUseCases.updateLeadStatus(ORG, lead.id, 'Etapa Que Nao Existe 123'),
      ),
    ).rejects.toThrow();

    const after = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(after.status).toBe(before.status);
    expect(after.pipelineStageId).toBe(before.pipelineStageId);
    expect(after.closedAt).toBe(before.closedAt);
  });

  it('lead de outro tenant não é encontrado pelo caminho de status (isolamento)', async () => {
    const lead = await seedDealLead(ORG);

    await expect(
      asOrg(ORG_OTHER, () =>
        leadUseCases.updateLeadStatus(ORG_OTHER, lead.id, 'Proposta Enviada'),
      ),
    ).rejects.toThrow(/not found/i);

    const untouched = await asOrg(ORG, () =>
      prisma.lead.findUniqueOrThrow({ where: { id: lead.id } }),
    );
    expect(untouched.pipelineStageId).toBe(lead.pipelineStageId);
    expect(await historyOf(ORG, lead.id)).toHaveLength(0);
  });
});

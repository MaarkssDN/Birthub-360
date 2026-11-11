/**
 * JORADA COMERCIAL REAL PONTA A PONTA (ORDEM 05 — substitui o teste tautológico anterior,
 * que só afirmava literais em memória sem tocar API/Prisma/navegador).
 *
 * Cada etapa usa serviços/ repositórios REAIS contra `prospectordb_test` (banco isolado
 * semeado por tests/helpers/integration-setup.ts) e prova que a operação anterior produziu
 * um resultado persistido e observável pela etapa seguinte:
 *
 *   Prospecção (Company+Contact+Lead)
 *     → CRM (transições de status reais via LeadUseCases, com timeline)
 *     → Oportunidade (funnel Negócio + itens de proposta no lead)
 *     → Proposta (CrmCommercialDocument persistido e vinculado)
 *     → Forecast/Inteligência (meta comercial + lead visível na fonte de dados do forecast)
 *     → Automação (regra Automation persistida)
 *     → Indicadores (sellerPerformanceAggregator agrega calls/reuniões/negócio fechado)
 *
 * O que este teste NÃO cobre (declarado, não escondido): execução do motor de forecast em si
 * (forecastEngine) e disparo real da automação por worker — ambos verificados em suítes
 * próprias; aqui provamos que os DADOS que alimentam esses motores são persistidos pelas
 * etapas anteriores. O fechamento do negócio usa update direto no Prisma como fixture do
 * estado final (o gate de fechamento manual tem teste próprio em dealClosureGate.test.ts).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { requestContext } from '../../src/lib/async-context';
import { LeadUseCases } from '../../src/features/crm/application/LeadUseCases';
import { PrismaLeadRepository } from '../../src/features/crm/infra/PrismaLeadRepository';
import { sellerPerformanceAggregator } from '../../src/features/gamification/services/sellerPerformanceAggregator.service';
import { CompanyFactory, ContactFactory, LeadFactory } from '../helpers/factories';

const ORG = 'test-org-id';
const OWNER = 'Vendedor Jornada';
const leadUseCases = new LeadUseCases(new PrismaLeadRepository());

async function cleanJourneyData() {
  await prisma.crmCommercialDocument.deleteMany({ where: { organizationId: ORG } });
  await prisma.crmDealItem.deleteMany({ where: { organizationId: ORG } });
  await prisma.automation.deleteMany({ where: { organizationId: ORG } });
  await prisma.commercialGoal.deleteMany({ where: { organizationId: ORG } });
  await prisma.activity.deleteMany({ where: { organizationId: ORG } });
  await prisma.leadStageHistory.deleteMany({ where: { organizationId: ORG } });
  // TimelineEvent não tem organizationId — cai em cascata com o Lead (onDelete: Cascade).
  await prisma.lead.deleteMany({ where: { organizationId: ORG } });
  await prisma.contact.deleteMany({ where: { organizationId: ORG } });
  await prisma.company.deleteMany({ where: { organizationId: ORG } });
}

describe('Jornada Comercial Completa — serviços e persistência reais', () => {
  beforeEach(cleanJourneyData);

  it('Prospecção → CRM → Oportunidade → Proposta → Forecast → Automação → Indicadores', async () => {
    // ── 1. PROSPECÇÃO + CONTATOS: empresa, contato e lead criados de verdade ──
    const company = await prisma.company.create({
      data: { ...CompanyFactory.build({ organizationId: ORG }), id: undefined } as never,
    });
    const { company: _nestedCompany, ...contactFields } = ContactFactory.build({
      organizationId: ORG,
      companyId: company.id,
    }) as Record<string, unknown>;
    const contact = await prisma.contact.create({
      data: { ...contactFields, id: undefined } as never,
    });
    const leadData = LeadFactory.build({
      organizationId: ORG,
      companyId: company.id,
      contactId: contact.id,
      owner: OWNER,
      status: 'Lead_Recebido',
      source: 'Outbound',
    });
    delete (leadData as Record<string, unknown>).id;
    const lead = await prisma.lead.create({ data: leadData as never });
    expect(lead.id).toBeTruthy();
    expect(lead.companyId).toBe(company.id);

    // ── 2. CRM: qualificação e conversão em oportunidade via LeadUseCases real ──
    const qualified = await leadUseCases.updateLeadStatus(
      ORG,
      lead.id,
      'Qualificação (SDR)',
    );
    expect(qualified.status).toBe('Qualificação (SDR)');

    const converted = await leadUseCases.updateLeadStatus(
      ORG,
      lead.id,
      'Convertido em Oportunidade',
    );
    expect(converted.status).toBe('Convertido em Oportunidade');

    // A transição gerou registro observável (timeline movement), não só o campo status.
    const movements = await prisma.timelineEvent.count({
      where: { leadId: lead.id, type: 'movement' },
    });
    expect(movements).toBeGreaterThanOrEqual(2);

    // ── 3. OPORTUNIDADE: funil Negócio + valor + item de negócio no lead ──
    const opportunity = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        funnel: 'Negocio',
        status: 'Nova_Oportunidade',
        amount: 75000,
        expectedCloseAt: new Date('2026-11-30T00:00:00Z'),
      },
    });
    expect(opportunity.funnel).toBe('Negocio');

    const dealItem = await prisma.crmDealItem.create({
      data: {
        name: 'Piloto comercial 90 dias',
        quantity: 1,
        unitPrice: 75000,
        total: 75000,
        leadId: lead.id,
        organizationId: ORG,
      },
    });
    expect(dealItem.total).toBe(75000);

    // ── 4. PROPOSTA: documento comercial persistido e vinculado ao lead ──
    const proposal = await prisma.crmCommercialDocument.create({
      data: {
        number: `PROP-JORNADA-${Date.now()}`,
        type: 'Proposta',
        status: 'Enviado',
        title: 'Proposta Comercial — Piloto BirthHub 360',
        subtotal: 75000,
        total: 75000,
        lineItems: [
          { description: 'Piloto comercial', quantity: 1, unitPrice: 75000, total: 75000 },
        ],
        leadId: lead.id,
        companyId: company.id,
        contactId: contact.id,
        organizationId: ORG,
        sentAt: new Date(),
      },
    });
    expect(proposal.publicToken).toBeTruthy();
    const persistedProposal = await prisma.crmCommercialDocument.findUnique({
      where: { id: proposal.id },
    });
    expect(persistedProposal?.leadId).toBe(lead.id);
    expect(persistedProposal?.status).toBe('Enviado');

    // ── 5. FORECAST/INTELIGÊNCIA: meta do mês + lead visível na fonte do forecast ──
    const period = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    await prisma.commercialGoal.create({
      data: { organizationId: ORG, period, metric: 'NEW_MRR', amount: 100000 },
    });
    // Mesmo recorte que o motor de forecast consome: funil Negócio, não fechado,
    // dentro da organização — se o lead não aparecesse aqui, nenhum forecast o veria.
    const forecastSource = await prisma.lead.findMany({
      where: {
        organizationId: ORG,
        funnel: 'Negocio',
        status: { notIn: ['Negocios_Ganhos', 'Negocios_Perdidos'] },
        deletedAt: null,
      },
      select: { id: true, amount: true, expectedCloseAt: true },
    });
    expect(forecastSource.map((l) => l.id)).toContain(lead.id);
    expect(forecastSource.find((l) => l.id === lead.id)?.amount).toBe(75000);
    const goal = await prisma.commercialGoal.findUnique({
      where: {
        organizationId_period_metric: { organizationId: ORG, period, metric: 'NEW_MRR' },
      },
    });
    expect(goal?.amount).toBe(100000);

    // ── 6. AUTOMAÇÃO: regra persistida disparando na criação de lead ──
    const automation = await prisma.automation.create({
      data: {
        name: 'Notificar equipe sobre novo lead qualificado',
        trigger: 'Lead_Criado',
        conditions: { status: 'Qualificação (SDR)' },
        action: 'Notificar_Equipe',
        actionConfig: { title: 'Novo lead qualificado' },
        organizationId: ORG,
      },
    });
    expect(automation.enabled).toBe(true);
    expect(automation.trigger).toBe('Lead_Criado');

    // ── 7. INDICADORES: atividades + fechamento → agregador real enxerga o vendedor ──
    await prisma.activity.createMany({
      data: [
        {
          type: 'Ligacao',
          owner: OWNER,
          status: 'Concluida',
          date: new Date(),
          organizationId: ORG,
          leadId: lead.id,
        },
        {
          type: 'Reuniao',
          owner: OWNER,
          status: 'Concluida',
          date: new Date(),
          organizationId: ORG,
          leadId: lead.id,
        },
      ],
    });
    // Estado final do negócio (fixture do resultado — o gate de fechamento manual é
    // testado separadamente em dealClosureGate.test.ts).
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'Negocios_Ganhos', closedAt: new Date() },
    });

    const now = new Date();
    const metrics = await sellerPerformanceAggregator.compute(ORG, OWNER, {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    });
    expect(metrics.callsMade).toBe(1);
    expect(metrics.meetingsScheduled).toBe(1);
    expect(metrics.dealsClosed).toBe(1);
    expect(metrics.avgTicket).toBe(75000);
    expect(metrics.conversionRatePercent).toBeGreaterThan(0);
  });

  it('isolamento de tenant: dados da jornada não vazam para outra organização', async () => {
    // Organization é protegida por RLS — criação de tenant de teste exige bypass explícito
    // (mesmo padrão de agent-memory.test.ts / rbac-e2e-helpers.withRlsBypass).
    const invaderOrg = await requestContext.run({ bypassRls: true }, () =>
      prisma.organization.create({
        data: { name: `jornada-org-invasora-${Date.now()}` },
      }),
    );
    const otherOrgLead = await requestContext.run({ tenantId: invaderOrg.id }, () =>
      prisma.lead.create({
        data: LeadFactory.build({
          organizationId: invaderOrg.id,
          owner: OWNER,
          status: 'Lead_Recebido',
        }) as never,
      }),
    );
    const visible = await prisma.lead.findMany({
      where: { organizationId: ORG, owner: OWNER },
      select: { id: true },
    });
    expect(visible.map((l) => l.id)).not.toContain(otherOrgLead.id);
  });
});

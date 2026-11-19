import { describe, it, expect, afterAll } from 'vitest';
import { prisma, withRlsContext } from '../../src/lib/prisma';
import { requestContext } from '../../src/lib/async-context';
import { runLandingLeadRetentionSweep } from '../../src/features/lgpd/jobs/landingLeadRetention.worker';
import { ANONYMIZED_CONTACT_NAME } from '../../src/shared/services/dataSubjectErasure.service';
import { LANDING_LEAD_SOURCE } from '../../src/shared/contracts/publicLead.constants';

// Handoff `.agents/handoffs/21-para-01-retencao-leads-landing-lgpd.md` — sweep de
// retenção dos leads `landing_360` sem avanço há > 90 dias (decisão do Marcelo,
// 2026-11-11, docs/lgpd/consentimento-lead.md §3.4). Mesmo padrão de
// tests/integration/auto-anonymize-sweep-idempotency.test.ts: o callback de
// `requestContext.run()` precisa ser `async` (PrismaPromise é lazy).
const withBypass = <T>(fn: () => Promise<T>): Promise<T> =>
  requestContext.run({ bypassRls: true }, fn);
const withTenant = <T>(tenantId: string, fn: () => Promise<T>): Promise<T> =>
  requestContext.run({ tenantId }, fn);

const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const ORG = `test-landing-retention-org-${suffix}`;

describe('runLandingLeadRetentionSweep — leads landing_360 > 90d sem avanço (Postgres real)', () => {
  afterAll(async () => {
    await withTenant(ORG, () => prisma.lead.deleteMany({ where: { organizationId: ORG } }));
    await withTenant(ORG, () => prisma.contact.deleteMany({ where: { organizationId: ORG } }));
    await withTenant(ORG, () => prisma.company.deleteMany({ where: { organizationId: ORG } }));
    await withBypass(() => prisma.organization.deleteMany({ where: { id: ORG } }));
  });

  it('anonimiza lead landing_360 parado em Lead_Recebido há > 90 dias; lead recente é preservado; reexecução é idempotente', async () => {
    await withBypass(async () => {
      await prisma.organization.create({ data: { id: ORG, name: 'Test Landing Retention Org' } });
    });

    const company = await withTenant(ORG, async () =>
      prisma.company.create({
        data: { legalName: 'Empresa Landing LTDA', tradeName: 'Empresa Landing' },
      }),
    );

    // Titular elegível: lead landing_360 em Lead_Recebido, atualizado há 100 dias.
    const staleContact = await withTenant(ORG, async () =>
      prisma.contact.create({
        data: {
          name: 'Titular Landing Abandonado',
          email: `landing-stale-${suffix}@example.com`,
          companyId: company.id,
        },
      }),
    );
    const staleLead = await withTenant(ORG, async () =>
      prisma.lead.create({
        data: {
          organizationId: ORG,
          companyId: company.id,
          contactId: staleContact.id,
          title: 'Demo landing abandonada',
          status: 'Lead_Recebido',
          source: LANDING_LEAD_SOURCE,
        },
      }),
    );
    await withTenant(ORG, async () => {
      await withRlsContext(
        (tx) =>
          tx.$executeRaw`UPDATE "Lead" SET "updatedAt" = NOW() - INTERVAL '100 days' WHERE id = ${staleLead.id}`,
      );
    });

    // Titular preservado: mesmo perfil, mas lead atualizado agora (dentro da janela).
    const freshContact = await withTenant(ORG, async () =>
      prisma.contact.create({
        data: {
          name: 'Titular Landing Recente',
          email: `landing-fresh-${suffix}@example.com`,
          companyId: company.id,
        },
      }),
    );
    await withTenant(ORG, async () =>
      prisma.lead.create({
        data: {
          organizationId: ORG,
          companyId: company.id,
          contactId: freshContact.id,
          title: 'Demo landing recente',
          status: 'Lead_Recebido',
          source: LANDING_LEAD_SOURCE,
        },
      }),
    );

    // Titular preservado pela guarda de relacionamento ativo: lead landing_360
    // velho, mas o MESMO contato tem outro lead em andamento recente.
    const activeContact = await withTenant(ORG, async () =>
      prisma.contact.create({
        data: {
          name: 'Titular Com Lead Ativo',
          email: `landing-active-${suffix}@example.com`,
          companyId: company.id,
        },
      }),
    );
    const staleLandingLead = await withTenant(ORG, async () =>
      prisma.lead.create({
        data: {
          organizationId: ORG,
          companyId: company.id,
          contactId: activeContact.id,
          title: 'Demo landing velha do contato ativo',
          status: 'Lead_Recebido',
          source: LANDING_LEAD_SOURCE,
        },
      }),
    );
    await withTenant(ORG, async () =>
      prisma.lead.create({
        data: {
          organizationId: ORG,
          companyId: company.id,
          contactId: activeContact.id,
          title: 'Lead comercial em andamento',
          status: 'Qualificacao_SDR',
          source: 'indicacao',
        },
      }),
    );
    await withTenant(ORG, async () => {
      await withRlsContext(
        (tx) =>
          tx.$executeRaw`UPDATE "Lead" SET "updatedAt" = NOW() - INTERVAL '100 days' WHERE id = ${staleLandingLead.id}`,
      );
    });

    // --- 1ª rodada ---
    const firstRun = await runLandingLeadRetentionSweep();
    expect(firstRun.anonymizedCount).toBeGreaterThanOrEqual(1);

    const staleAfter = await withTenant(ORG, async () =>
      prisma.contact.findUniqueOrThrow({ where: { id: staleContact.id } }),
    );
    expect(staleAfter.name).toBe(ANONYMIZED_CONTACT_NAME);
    expect(staleAfter.email).toBeNull();

    const freshAfter = await withTenant(ORG, async () =>
      prisma.contact.findUniqueOrThrow({ where: { id: freshContact.id } }),
    );
    expect(freshAfter.name).toBe('Titular Landing Recente');
    expect(freshAfter.email).toBe(`landing-fresh-${suffix}@example.com`);

    const activeAfter = await withTenant(ORG, async () =>
      prisma.contact.findUniqueOrThrow({ where: { id: activeContact.id } }),
    );
    expect(activeAfter.name).toBe('Titular Com Lead Ativo');

    // --- 2ª rodada: idempotente, não lança e não reprocessa ---
    await expect(runLandingLeadRetentionSweep()).resolves.not.toThrow();
    const staleSecond = await withTenant(ORG, async () =>
      prisma.contact.findUniqueOrThrow({ where: { id: staleContact.id } }),
    );
    expect(staleSecond.name).toBe(ANONYMIZED_CONTACT_NAME);
  });
});

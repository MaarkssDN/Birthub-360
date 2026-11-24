import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prismaMock } from '../../../../tests/mocks/prisma.js';
import { createInMemoryCadenceEnrollmentStore } from '../../../../tests/mocks/inMemoryCadenceEnrollmentStore.js';
import { recordOptOut } from '../application/optOutService.js';
import { InMemoryOptOutRepository } from '../infra/InMemoryOptOutRepository.js';
import { scanAndAdvanceCadenceRuns } from '../jobs/cadenceRun.worker.js';
import { AdaptiveMultichannelCadenceService } from '../services/adaptiveMultichannelCadence.service.js';
import { selfDrivingCrmService } from '../services/selfDrivingCrm.service.js';

// O singleton `adaptiveMultichannelCadenceService` é substituído apenas para o caminho
// selfDrivingCrm (isLeadOptedOut iria ao Prisma real); a classe real continua disponível
// para os testes do próprio serviço — mesmo padrão de outboxIdempotency.test.ts.
vi.mock('../services/adaptiveMultichannelCadence.service.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../services/adaptiveMultichannelCadence.service.js')>();
  return {
    ...actual,
    adaptiveMultichannelCadenceService: {
      isLeadOptedOut: vi.fn(async () => false),
    },
  };
});

/**
 * Regressão do handoff 44→17 (auditoria ONDA3-44-CADENCE): opt-out gravado SOMENTE por
 * e-mail ou telefone (sem leadId) não casava quando a consulta usava sujeito `{ leadId }`
 * parcial — `subjectsMatch` exige identificador compartilhado. Estes testes provam que os
 * caminhos de cadência agora montam o sujeito completo.
 */
describe('Opt-out com sujeito completo (leadId + e-mail + telefone)', () => {
  const orgId = 'org-optout-subject-44';

  beforeEach(() => {
    selfDrivingCrmService.clear();
    vi.restoreAllMocks();
    prismaMock.lead.findFirst.mockReset();
    prismaMock.lead.findMany.mockReset();
  });

  describe('AdaptiveMultichannelCadenceService.executeNextStep', () => {
    it('suprime passo quando opt-out foi gravado apenas por e-mail (sem leadId), via contato do enrollment', async () => {
      const optOutRepo = new InMemoryOptOutRepository();
      const service = new AdaptiveMultichannelCadenceService(
        createInMemoryCadenceEnrollmentStore(),
        optOutRepo,
      );
      // Lead inexistente no banco mockado — resolveOptOutSubject degrada para os
      // identificadores do enrollment sem derrubar o passo.
      prismaMock.lead.findFirst.mockResolvedValue(null as any);

      const enrollment = await service.enrollLead({
        organizationId: orgId,
        cadenceId: 'default-b2b-cadence',
        leadId: 'lead-email-only-optout',
        contactEmail: 'titular.suprimido@empresa.com',
        contactPhone: '',
      });

      // Opt-out registrado SÓ pelo e-mail — sem leadId.
      await recordOptOut(optOutRepo, {
        organizationId: orgId,
        scope: 'email',
        subject: { email: 'titular.suprimido@empresa.com' },
        originChannel: 'email',
        reason: 'Resposta "SAIR" ao e-mail de cadência',
      });

      const result = await service.executeNextStep(enrollment.enrollmentId, orgId);
      expect(result.suppressedByOptOut).toBe(true);
      expect(result.success).toBe(false);
      expect(result.suppressionReason).toContain('opt-out');
    });

    it('suprime passo quando opt-out foi gravado apenas por telefone e o enrollment não tem contato — resolve via lead no banco', async () => {
      const optOutRepo = new InMemoryOptOutRepository();
      // Enrollment criado por automação sem contato (cadenceIntegration.service); o contato
      // real do lead no banco é quem carrega o telefone do opt-out.
      prismaMock.lead.findFirst.mockResolvedValue({
        contact: { email: null, whatsapp: null, phone: '+55 11 98888-7777' },
      } as any);

      const store = createInMemoryCadenceEnrollmentStore();
      const service = new AdaptiveMultichannelCadenceService(store, optOutRepo);
      const enrollment = await store.enroll({
        organizationId: orgId,
        cadenceId: 'default-b2b-cadence',
        leadId: 'lead-phone-only-optout',
      });

      // scope 'global': o primeiro passo da cadência modelo é e-mail — um opt-out restrito a
      // 'whatsapp' não bloquearia esse passo (correto por canal); o que está em teste aqui é o
      // CASAMENTO por telefone, não o escopo.
      await recordOptOut(optOutRepo, {
        organizationId: orgId,
        scope: 'global',
        subject: { phoneE164: '+5511988887777' },
        originChannel: 'whatsapp',
        reason: 'Pedido de descadastro por WhatsApp',
      });

      const result = await service.executeNextStep(enrollment.enrollmentId, orgId);
      expect(result.suppressedByOptOut).toBe(true);
      expect(result.success).toBe(false);
    });

    it('isLeadOptedOut retorna true para opt-out gravado só por e-mail do contato do lead', async () => {
      const optOutRepo = new InMemoryOptOutRepository();
      const service = new AdaptiveMultichannelCadenceService(
        createInMemoryCadenceEnrollmentStore(),
        optOutRepo,
      );
      prismaMock.lead.findFirst.mockResolvedValue({
        contact: { email: 'descadastro@alvo.com', whatsapp: null, phone: null },
      } as any);

      await recordOptOut(optOutRepo, {
        organizationId: orgId,
        scope: 'global',
        subject: { email: 'descadastro@alvo.com' },
        originChannel: 'email',
      });

      await expect(service.isLeadOptedOut(orgId, 'lead-sem-optout-link')).resolves.toBe(true);
    });
  });

  describe('SelfDrivingCrmService.detectStagnatedLeads', () => {
    it('marca lead como inelegível quando opt-out existe só por e-mail do contato', async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      prismaMock.lead.findMany.mockResolvedValueOnce([
        {
          id: 'lead-db-optout-email',
          title: 'Lead Opt-out Email',
          status: 'Lead_Recebido',
          lastInteraction: thirtyDaysAgo,
          updatedAt: thirtyDaysAgo,
          createdAt: thirtyDaysAgo,
          contact: {
            name: 'Titular Email',
            email: 'naoqueremos@empresa.com',
            whatsapp: null,
            phone: null,
          },
          company: null,
        } as any,
      ]);

      await recordOptOut(selfDrivingCrmService.getOptOutRepository(), {
        organizationId: orgId,
        scope: 'email',
        subject: { email: 'naoqueremos@empresa.com' },
        originChannel: 'email',
        reason: 'Opt-out só por e-mail, sem leadId',
      });

      const results = await selfDrivingCrmService.detectStagnatedLeads({
        organizationId: orgId,
        inactivityThresholdDays: 15,
      });

      expect(results).toHaveLength(1);
      expect(results[0].isOptedOut).toBe(true);
      expect(results[0].eligibleForReactivation).toBe(false);
      expect(results[0].ineligibilityReason).toContain('opt-out');
    });
  });
});

describe('Worker de cadência — sequência precisa ser do mesmo tenant do run', () => {
  const orgRun = 'org-run-tenant';
  const orgSeq = 'org-seq-tenant';

  beforeEach(() => {
    vi.restoreAllMocks();
    prismaMock.cadenceRun.findMany.mockReset();
    prismaMock.cadenceSequence.findMany.mockReset();
    prismaMock.cadenceRun.findFirst.mockReset();
  });

  it('run cuja sequenceId pertence a OUTRA organização é encerrado como failed, nunca despacha', async () => {
    prismaMock.cadenceRun.findMany.mockResolvedValue([
      { id: 'run-cross-tenant', organizationId: orgRun, sequenceId: 'seq-de-outro-tenant' },
    ] as any);
    // A query agora filtra organizationId ∈ orgs dos runs; o mock devolve a linha
    // cross-tenant mesmo assim — a conferência par-a-par no consumidor é a segunda trava.
    prismaMock.cadenceSequence.findMany.mockResolvedValue([
      {
        id: 'seq-de-outro-tenant',
        organizationId: orgSeq,
        name: 'Sequência de outro tenant',
        touches: [{ order: 1, channel: 'email', delayHoursFromPrevious: 0, templateRef: 'oi' }],
      },
    ] as any);
    // findById do repositório devolve null → encerramento failed segue o fluxo sem write real.
    prismaMock.cadenceRun.findFirst.mockResolvedValue(null as any);

    const result = await scanAndAdvanceCadenceRuns(new Date('2026-11-24T12:00:00-03:00'));

    expect(result.processed).toBe(0);
    expect(result.errors).toBe(0);
    expect(result.failedInvalidSequence).toBe(1);
    // A busca de sequências carrega organizationId no where (defesa em profundidade).
    expect(prismaMock.cadenceSequence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: { in: [orgRun] } }),
      }),
    );
  });

  it('run com sequência do MESMO tenant segue para advanceCadenceRun (processed conta tentativa)', async () => {
    prismaMock.cadenceRun.findMany.mockResolvedValue([
      { id: 'run-ok', organizationId: orgRun, sequenceId: 'seq-mesmo-tenant' },
    ] as any);
    prismaMock.cadenceSequence.findMany.mockResolvedValue([
      {
        id: 'seq-mesmo-tenant',
        organizationId: orgRun,
        name: 'Sequência própria',
        touches: [{ order: 1, channel: 'email', delayHoursFromPrevious: 0, templateRef: 'oi' }],
      },
    ] as any);
    // advanceCadenceRun → findById retorna null → lança erro capturado por run (errors=1).
    // O que importa aqui: a sequência foi aceita (não foi para failedInvalidSequence).
    prismaMock.cadenceRun.findFirst.mockResolvedValue(null as any);

    const result = await scanAndAdvanceCadenceRuns(new Date('2026-11-24T12:00:00-03:00'));

    expect(result.failedInvalidSequence).toBe(0);
    expect(result.errors + result.processed).toBe(1);
  });
});

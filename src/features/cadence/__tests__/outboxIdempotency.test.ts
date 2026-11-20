import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInMemoryCadenceEnrollmentStore } from '../../../../tests/mocks/inMemoryCadenceEnrollmentStore.js';
import { domainEventMesh } from '../../../lib/queue/domainEventMesh.service.js';
import { recordOptOut } from '../application/optOutService.js';
import { InMemoryOptOutRepository } from '../infra/InMemoryOptOutRepository.js';
import { AdaptiveMultichannelCadenceService } from '../services/adaptiveMultichannelCadence.service.js';
import { selfDrivingCrmService } from '../services/selfDrivingCrm.service.js';

// Mantém a classe real de AdaptiveMultichannelCadenceService, mas substitui apenas o
// singleton `adaptiveMultichannelCadenceService` (usado por selfDrivingCrm.service para
// isLeadOptedOut, que iria ao Prisma) — mesmo padrão de tests/unit/cadence/selfDrivingCrm.service.test.ts.
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
 * Handoff 16→00 (onda-3): produtores do DomainEventMesh sem idempotencyKey — parcela do
 * Agente 17 (cadência). Garante que todo `domainEventMesh.publish` de
 * src/features/cadence/** passa uma chave estável derivada da identidade do fato de
 * negócio (formato `dominio:{entityId}`, nunca randomUUID) e que republicar o mesmo fato
 * não duplica o registro na outbox (dedup por (organizationId, idempotencyKey)).
 */
describe('Cadência — idempotencyKey nos produtores do DomainEventMesh (handoff 16→00)', () => {
  const orgId = 'org-idem-cadence';

  beforeEach(() => {
    domainEventMesh.clearProcessedEvents();
    selfDrivingCrmService.clear();
  });

  const outboxRecords = () => domainEventMesh.getOutboxRecords();
  const recordsOfType = (eventType: string) =>
    outboxRecords().filter((r) => r.eventType === eventType);

  describe('AdaptiveMultichannelCadenceService', () => {
    it('registerOptOutAndHalt republicado para o mesmo lead gera um único evento na outbox', async () => {
      const service = new AdaptiveMultichannelCadenceService(
        createInMemoryCadenceEnrollmentStore(),
        new InMemoryOptOutRepository(),
      );

      const params = {
        organizationId: orgId,
        leadId: 'lead-optout-idem',
        channelSource: 'whatsapp' as const,
        reason: 'palavra-chave SAIR',
      };
      await service.registerOptOutAndHalt(params);
      await service.registerOptOutAndHalt(params); // retry genuíno do mesmo fato

      const records = recordsOfType('CROSS_CHANNEL_OPTOUT_ENFORCED');
      expect(records).toHaveLength(1);
      expect(records[0].idempotencyKey).toBe('optout-registered:lead-optout-idem');
    });

    it('executeNextStep suprimido por opt-out emite chave estável por enrollment+step', async () => {
      const optOutRepo = new InMemoryOptOutRepository();
      const service = new AdaptiveMultichannelCadenceService(
        createInMemoryCadenceEnrollmentStore(),
        optOutRepo,
      );

      const enrollment = await service.enrollLead({
        organizationId: orgId,
        cadenceId: 'default-b2b-cadence',
        leadId: 'lead-step-optout',
        contactEmail: 'ops@lead.com',
        contactPhone: '+5511900000000',
      });

      // Opt-out global registrado direto no repo: a matrícula segue 'active', então
      // executeNextStep alcança a trava de opt-out e publica CROSS_CHANNEL_OPTOUT_ENFORCED.
      await recordOptOut(optOutRepo, {
        organizationId: orgId,
        scope: 'global',
        subject: { leadId: 'lead-step-optout' },
        originChannel: 'whatsapp',
        reason: 'descadastro',
      });

      const result = await service.executeNextStep(enrollment.enrollmentId, orgId);
      expect(result.suppressedByOptOut).toBe(true);

      const records = recordsOfType('CROSS_CHANNEL_OPTOUT_ENFORCED');
      expect(records).toHaveLength(1);
      expect(records[0].idempotencyKey).toBe(`optout-step-enforced:${enrollment.enrollmentId}:1`);
    });
  });

  describe('SelfDrivingCrmService', () => {
    async function seedRecommendation(leadId: string) {
      for (const channel of ['voice_call', 'voice_call', 'whatsapp'] as const) {
        await selfDrivingCrmService.registerEngagementSignal({
          organizationId: orgId,
          leadId,
          channel,
          signalType: channel === 'whatsapp' ? 'WHATSAPP_REPLIED' : 'CALL_UNANSWERED',
        });
      }
      const rec = await selfDrivingCrmService.evaluateCadenceOptimization({
        organizationId: orgId,
        leadId,
      });
      expect(rec).not.toBeNull();
      return rec!;
    }

    it('aprovação repetida da mesma recomendação não duplica CADENCE_CHANGE_APPROVED nem LEAD_REACTIVATED', async () => {
      const rec = await seedRecommendation('lead-appr-idem');

      await selfDrivingCrmService.approveCadenceRecommendation({
        organizationId: orgId,
        recommendationId: rec.id,
        approvedBy: 'supervisor-1',
      });
      await selfDrivingCrmService.approveCadenceRecommendation({
        organizationId: orgId,
        recommendationId: rec.id,
        approvedBy: 'supervisor-1',
      });

      const approved = recordsOfType('CADENCE_CHANGE_APPROVED');
      const reactivated = recordsOfType('LEAD_REACTIVATED');
      expect(approved).toHaveLength(1);
      expect(reactivated).toHaveLength(1);
      expect(approved[0].idempotencyKey).toBe(`cadence-change-approved:${rec.id}`);
      expect(reactivated[0].idempotencyKey).toBe(`lead-reactivated:lead-appr-idem:${rec.id}`);
    });

    it('detectStagnatedLeads repetido no mesmo estado do lead não duplica LEAD_STAGNATED nem LEAD_REACTIVATION_SUGGESTED', async () => {
      const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
      selfDrivingCrmService.seedLead({
        organizationId: orgId,
        leadId: 'lead-stag-idem',
        leadName: 'Transportes Idem',
        currentStage: 'Diagnóstico',
        lastActivityAt: twentyDaysAgo,
        hasActiveDeal: false,
        isWonOrLost: false,
      });

      await selfDrivingCrmService.detectStagnatedLeads({ organizationId: orgId });
      await selfDrivingCrmService.detectStagnatedLeads({ organizationId: orgId });

      const stagnated = recordsOfType('LEAD_STAGNATED');
      const suggested = recordsOfType('LEAD_REACTIVATION_SUGGESTED');
      expect(stagnated).toHaveLength(1);
      expect(suggested).toHaveLength(1);
      expect(stagnated[0].idempotencyKey).toMatch(/^lead-stagnated:lead-stag-idem:\d+$/);
      expect(suggested[0].idempotencyKey).toMatch(
        /^lead-reactivation-suggested:lead-stag-idem:\d+$/,
      );
    });
  });
});

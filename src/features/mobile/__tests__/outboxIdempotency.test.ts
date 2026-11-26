import { beforeEach, describe, expect, it } from 'vitest';
import { domainEventMesh } from '../../../lib/queue/domainEventMesh.service.js';
import { mobileEdgeAiService } from '../mobileEdgeAi.service.js';

/**
 * Handoff 16→00 (onda-3): produtores do DomainEventMesh sem idempotencyKey — parcela do
 * Agente 09 (mobile). Garante que os dois `domainEventMesh.publish` de
 * src/features/mobile/mobileEdgeAi.service.ts passam uma chave estável derivada da
 * identidade do fato de negócio (nunca randomUUID) e que republicar o mesmo fato não
 * duplica o registro na outbox (dedup por (organizationId, idempotencyKey)).
 *
 * Decisão de chave (ver comentário no service):
 * - OFFLINE_BRIEFING_ACCESSED → `briefing-access:{briefingId}:{online|offline}` — o
 *   briefingId identifica o briefing em cache; um novo cache é um fato novo.
 * - GEOFENCE_PROXIMITY_DETECTED → `geofence-proximity:{geofenceId}:{sellerId}:{YYYY-MM-DD}` —
 *   sem id de evento do cliente, o bucket de data separa detecções de dias distintos.
 */
describe('Mobile Edge AI — idempotencyKey nos produtores do DomainEventMesh (handoff 16→00)', () => {
  const orgId = 'org-idem-mobile';

  beforeEach(() => {
    domainEventMesh.clearProcessedEvents();
    mobileEdgeAiService.clear();
  });

  const outboxRecords = () => domainEventMesh.getOutboxRecords();
  const recordsOfType = (eventType: string) =>
    outboxRecords().filter((r) => r.eventType === eventType);

  const seedBriefing = () =>
    mobileEdgeAiService.cacheVisitBriefing({
      organizationId: orgId,
      dealId: 'deal-idem-01',
      briefing: {
        companyName: 'Viação Ouro e Prata Frotas',
        targetContactName: 'Carlos Silveira',
        targetContactRole: 'Diretor Operacional',
        meetingObjective: 'Proposta de frota',
        keyOpportunities: ['Redução de custo'],
        knownObjections: [],
        revOpsRisks: [],
        recommendedTalkingPoints: [],
      } as any,
    });

  const seedGeofence = () =>
    mobileEdgeAiService.registerGeofence({
      organizationId: orgId,
      rule: {
        companyName: 'Sede Logística São Paulo',
        latitude: -23.5505,
        longitude: -46.6333,
        radiusMeters: 300,
        active: true,
      } as any,
    });

  it('getVisitBriefing repetido para o mesmo briefing não duplica OFFLINE_BRIEFING_ACCESSED', async () => {
    await seedBriefing();

    await mobileEdgeAiService.getVisitBriefing({
      organizationId: orgId,
      dealId: 'deal-idem-01',
      offlineMode: true,
    });
    // Retry genuíno do mesmo fato (mesmo briefing, mesmo modo).
    await mobileEdgeAiService.getVisitBriefing({
      organizationId: orgId,
      dealId: 'deal-idem-01',
      offlineMode: true,
    });

    const records = recordsOfType('OFFLINE_BRIEFING_ACCESSED');
    expect(records).toHaveLength(1);
    expect(records[0].idempotencyKey).toMatch(/^briefing-access:brf-.+:offline$/);
  });

  it('acesso online e offline do mesmo briefing geram fatos distintos (chaves diferentes)', async () => {
    await seedBriefing();

    await mobileEdgeAiService.getVisitBriefing({
      organizationId: orgId,
      dealId: 'deal-idem-01',
      offlineMode: false,
    });
    await mobileEdgeAiService.getVisitBriefing({
      organizationId: orgId,
      dealId: 'deal-idem-01',
      offlineMode: true,
    });

    const records = recordsOfType('OFFLINE_BRIEFING_ACCESSED');
    expect(records).toHaveLength(2);
    expect(new Set(records.map((r) => r.idempotencyKey)).size).toBe(2);
  });

  it('processGeofenceLocation repetido não duplica GEOFENCE_PROXIMITY_DETECTED no mesmo dia', async () => {
    await seedGeofence();

    const params = {
      organizationId: orgId,
      sellerId: 'seller-lucas',
      latitude: -23.5506,
      longitude: -46.6334,
      accuracyMeters: 12,
      consentOptIn: true,
    };
    await mobileEdgeAiService.processGeofenceLocation(params);
    await mobileEdgeAiService.processGeofenceLocation(params); // retry do mesmo fato

    const records = recordsOfType('GEOFENCE_PROXIMITY_DETECTED');
    expect(records).toHaveLength(1);
    expect(records[0].idempotencyKey).toMatch(
      /^geofence-proximity:geo-.+:seller-lucas:\d{4}-\d{2}-\d{2}$/,
    );
  });
});

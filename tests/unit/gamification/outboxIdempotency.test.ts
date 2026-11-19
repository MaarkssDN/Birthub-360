import { beforeEach, describe, expect, it, vi } from 'vitest';

// Handoff 16→00 (onda-3) + handoff 04→02: produtores do DomainEventMesh devem passar
// opts.idempotencyKey estável (identidade do fato de negócio, nunca randomUUID).
// Aqui verificamos que todos os call sites de src/features/gamification/** emitem
// chaves determinísticas derivadas da identidade do fato (dominio:{entityId}).
// A mecânica de dedup na outbox já é coberta em tests/unit/queue/outbox.remed05.test.ts.

const publishMock = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock('../../../src/lib/queue/domainEventMesh.service.js', () => ({
  domainEventMesh: { publish: publishMock },
}));

import { behavioralEngineService } from '../../../src/features/gamification/services/behavioralEngine.service.js';
import { warRoomArenaService } from '../../../src/features/gamification/services/warRoomArena.service.js';

const orgId = 'org-outbox-idem-gamification';
const sellerId = 'seller-idem-01';

function highSampleMetrics() {
  return {
    callsCount: 30,
    meetingsCount: 1, // 3.3% conversão -> gargalo cold_call_conversion
    qualifiedCount: 1,
    dealsClosed: 0,
    wonRevenue: 0,
    conversionRatePercent: 3.3,
  };
}

describe('Outbox idempotencyKey — produtores gamification (Agente 02)', () => {
  beforeEach(() => {
    publishMock.mockClear();
    behavioralEngineService.clear();
    warRoomArenaService.clear();
  });

  it('COMMERCIAL_BOTTLENECK_DETECTED: chave estável por bottleneck detectado', async () => {
    const bottlenecks = await behavioralEngineService.detectBottlenecks({
      organizationId: orgId,
      sellerId,
      sellerName: 'Vendedor Idem',
      performanceMetrics: highSampleMetrics(),
    });

    expect(bottlenecks.length).toBeGreaterThanOrEqual(1);
    for (const call of publishMock.mock.calls) {
      expect(call[0].eventType).toBe('COMMERCIAL_BOTTLENECK_DETECTED');
    }
    const bottleneck = bottlenecks.find((b) => b.metric === 'cold_call_conversion')!;
    const call = publishMock.mock.calls.find(
      (c) => c[0].payload.bottleneckId === bottleneck.id,
    )!;
    expect(call[1]).toEqual({ idempotencyKey: `bottleneck-detected:${bottleneck.id}` });
  });

  it('ADAPTIVE_MISSION_SUGGESTED: chave estável por missionId', async () => {
    const [bottleneck] = await behavioralEngineService.detectBottlenecks({
      organizationId: orgId,
      sellerId,
      sellerName: 'Vendedor Idem',
      performanceMetrics: highSampleMetrics(),
    });
    publishMock.mockClear();

    const mission = await behavioralEngineService.generateAdaptiveMission({
      organizationId: orgId,
      bottleneck,
    });

    expect(publishMock).toHaveBeenCalledTimes(1);
    const [event, opts] = publishMock.mock.calls[0];
    expect(event.eventType).toBe('ADAPTIVE_MISSION_SUGGESTED');
    expect(opts).toEqual({ idempotencyKey: `adaptive-mission:${mission.id}` });
  });

  it('ADAPTIVE_MISSION_COMPLETED e SELLER_XP_REWARDED: chaves estáveis por missão e vendedor', async () => {
    const [bottleneck] = await behavioralEngineService.detectBottlenecks({
      organizationId: orgId,
      sellerId,
      sellerName: 'Vendedor Idem',
      performanceMetrics: highSampleMetrics(),
    });
    const mission = await behavioralEngineService.generateAdaptiveMission({
      organizationId: orgId,
      bottleneck,
    });
    await behavioralEngineService.acceptMission(orgId, mission.id, sellerId);
    publishMock.mockClear();

    const result = await behavioralEngineService.claimMissionReward({
      organizationId: orgId,
      missionId: mission.id,
      sellerId,
      evidence: {
        completedCount: mission.verifiableCriteria.targetCount,
        averageScore: mission.verifiableCriteria.minScore ?? 100,
        evidenceHash: 'hash-evidencia-idem-1',
        verifierSource: 'roleplay_engine',
      },
    });

    expect(result.success).toBe(true);
    expect(publishMock).toHaveBeenCalledTimes(2);
    const [completedEvent, completedOpts] = publishMock.mock.calls[0];
    const [xpEvent, xpOpts] = publishMock.mock.calls[1];
    expect(completedEvent.eventType).toBe('ADAPTIVE_MISSION_COMPLETED');
    expect(completedOpts).toEqual({
      idempotencyKey: `adaptive-mission-completed:${mission.id}`,
    });
    expect(xpEvent.eventType).toBe('SELLER_XP_REWARDED');
    expect(xpOpts).toEqual({ idempotencyKey: `seller-xp:${sellerId}:${mission.id}` });
    expect(xpOpts.idempotencyKey).not.toContain('undefined');
  });

  it('WAR_ROOM_DUEL_RESOLVED: chave estável por roomId — fechamento repetido não muda a chave', async () => {
    const room = await warRoomArenaService.createRoom({
      organizationId: orgId,
      roomName: 'Arena Idem',
      mode: 'objection_duel',
      creatorUserId: sellerId,
      creatorName: 'Desafiante Idem',
    });
    await warRoomArenaService.joinRoom({
      organizationId: orgId,
      roomId: room.roomId,
      userId: 'defender-idem-01',
      name: 'Defensor Idem',
      role: 'defender',
    });
    await warRoomArenaService.submitObjectionRound({
      organizationId: orgId,
      roomId: room.roomId,
      challengerId: sellerId,
      defenderId: 'defender-idem-01',
      objectionPrompt: 'Sua solução está cara',
      defenderResponseText: 'Compreendo a preocupação. O ROI compensa em 6 meses e podemos agendar uma reunião na quinta.',
      timeTakenSeconds: 45,
    });
    await warRoomArenaService.resolveRoundEvaluation({
      organizationId: orgId,
      roomId: room.roomId,
      roundNumber: 1,
    });
    publishMock.mockClear();

    await warRoomArenaService.closeRoomAndReward({ organizationId: orgId, roomId: room.roomId });
    await warRoomArenaService.closeRoomAndReward({ organizationId: orgId, roomId: room.roomId });

    expect(publishMock).toHaveBeenCalledTimes(2);
    for (const call of publishMock.mock.calls) {
      expect(call[0].eventType).toBe('WAR_ROOM_DUEL_RESOLVED');
      expect(call[1]).toEqual({ idempotencyKey: `war-room:${room.roomId}` });
    }
    // Mesma chave nas duas chamadas → a UNIQUE parcial da outbox deduplica o retry.
    expect(publishMock.mock.calls[0][1].idempotencyKey).toBe(
      publishMock.mock.calls[1][1].idempotencyKey,
    );
  });
});

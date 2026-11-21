import { describe, expect, it, beforeEach, vi } from 'vitest';
import { multiRegionResilienceService } from '../../../src/lib/runtime/services/multiRegionResilience.service.js';
import { domainEventMesh } from '../../../src/lib/queue/domainEventMesh.service.js';

describe('MultiRegionResilienceService — Evolução 19', () => {
  beforeEach(() => {
    multiRegionResilienceService.clear();
  });

  it('deve consultar e listar o health check de todas as regiões configuradas', async () => {
    const regions = await multiRegionResilienceService.listAllRegions();
    expect(regions).toHaveLength(3);

    const saEast = await multiRegionResilienceService.getRegionHealth('sa-east-1');
    expect(saEast.status).toBe('healthy');
    expect(saEast.latencyMs).toBeLessThan(50);
    expect(saEast.cacheHitRatio).toBeGreaterThan(0.9);
  });

  it('deve registrar telemetria dinâmica de degradação regional', async () => {
    await multiRegionResilienceService.registerTelemetry({
      region: 'sa-east-1',
      status: 'degraded',
      latencyMs: 380,
      errorRatePercent: 4.8,
      activeWorkersCount: 12,
      cacheHitRatio: 0.81,
      lastHealthCheckIso: new Date().toISOString(),
    });

    const updated = await multiRegionResilienceService.getRegionHealth('sa-east-1');
    expect(updated.status).toBe('degraded');
    expect(updated.latencyMs).toBe(380);
  });

  it('deve executar o chaveamento de failover controlado para região saudável preservando estado', async () => {
    const failover = await multiRegionResilienceService.triggerFailover({
      fromRegion: 'sa-east-1',
      toRegion: 'us-east-1',
      reason: 'Rompimento de fibra e latência anômala em sa-east-1',
      organizationId: 'tenant-enterprise-01',
    });

    expect(failover.failoverId).toBeDefined();
    expect(failover.status).toBe('completed');
    expect(failover.fromRegion).toBe('sa-east-1');
    expect(failover.toRegion).toBe('us-east-1');
    expect(failover.statePreserved).toBe(true);
    expect(failover.reroutedTrafficPercent).toBe(100);

    const status = await multiRegionResilienceService.getFailoverStatus(failover.failoverId);
    expect(status?.status).toBe('completed');
  });

  it('publica MULTI_REGION_FAILOVER_TRIGGERED com idempotencyKey determinística por failover', async () => {
    const spy = vi.spyOn(domainEventMesh, 'publish');
    try {
      const first = await multiRegionResilienceService.triggerFailover({
        fromRegion: 'sa-east-1',
        toRegion: 'us-east-1',
        reason: 'Latência anômala em sa-east-1',
        organizationId: 'tenant-enterprise-01',
      });
      const second = await multiRegionResilienceService.triggerFailover({
        fromRegion: 'sa-east-1',
        toRegion: 'us-west-2',
        reason: 'Segunda transição de failover',
        organizationId: 'tenant-enterprise-01',
      });

      expect(spy).toHaveBeenCalledTimes(2);

      const keyFirst = spy.mock.calls[0][1]?.idempotencyKey;
      const keySecond = spy.mock.calls[1][1]?.idempotencyKey;

      // Chave determinística: derivada do failoverId do fato de negócio, nunca randomUUID por publish.
      expect(keyFirst).toBe(
        `multi-region-failover:sa-east-1->us-east-1:${first.failoverId}`,
      );
      expect(keySecond).toBe(
        `multi-region-failover:sa-east-1->us-west-2:${second.failoverId}`,
      );
      // Failovers genuinamente novos (failoverIds distintos) nunca colidem na chave.
      expect(keyFirst).not.toBe(keySecond);
      expect(spy.mock.calls[0][0].eventType).toBe('MULTI_REGION_FAILOVER_TRIGGERED');
    } finally {
      spy.mockRestore();
    }
  });

  it('deve recusar failover quando origem e destino forem idênticos', async () => {
    await expect(
      multiRegionResilienceService.triggerFailover({
        fromRegion: 'sa-east-1',
        toRegion: 'sa-east-1',
        reason: 'Teste inválido',
      }),
    ).rejects.toThrow(/não podem ser idênticas/);
  });
});

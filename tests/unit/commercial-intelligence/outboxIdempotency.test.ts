import { beforeEach, describe, expect, it, vi } from 'vitest';

// Handoff 16→00 (onda-3): produtores do DomainEventMesh devem passar
// opts.idempotencyKey estável (dominio:{entityId}) — decisão do coordenador.
// Aqui verificamos que os produtores de CRM/BI/commercial-intelligence emitem
// chaves determinísticas derivadas da identidade do fato de negócio.

const publishMock = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock('../../../src/lib/queue/domainEventMesh.service.js', () => ({
  domainEventMesh: { publish: publishMock },
}));

import { PredictiveRevenueOracleService } from '../../../src/features/commercial-intelligence/services/predictiveRevenueOracle.service.js';
import { valueRealizationService } from '../../../src/features/commercial-intelligence/services/valueRealization.service.js';
import { InMemoryOracleReader, ORACLE_FIXED_NOW, seedRealHistory } from './oracleTestDoubles.js';

const orgA = 'org-outbox-idem-alpha';

describe('Outbox idempotencyKey — produtores commercial-intelligence (Agente 04)', () => {
  beforeEach(() => {
    publishMock.mockClear();
    valueRealizationService.clear();
  });

  it('REVENUE_FORECAST_PROJECTED: chave estável por (org, período) — recomputar o cockpit não duplica', async () => {
    const reader = new InMemoryOracleReader();
    const service = new PredictiveRevenueOracleService({
      reader,
      now: () => ORACLE_FIXED_NOW,
    });
    seedRealHistory(reader, orgA);

    await service.getCockpitData(orgA);
    await service.getCockpitData(orgA);

    expect(publishMock).toHaveBeenCalledTimes(2);
    for (const call of publishMock.mock.calls) {
      expect(call[0].eventType).toBe('REVENUE_FORECAST_PROJECTED');
      expect(call[1]).toEqual({
        idempotencyKey: `revenue-forecast:${orgA}:${'2026-10'}`,
      });
    }
    // Mesma chave nas duas chamadas → a UNIQUE parcial da outbox deduplica retries.
    expect(publishMock.mock.calls[0][1].idempotencyKey).toBe(
      publishMock.mock.calls[1][1].idempotencyKey,
    );
  });

  it('WHAT_IF_SCENARIO_SIMULATED: chave derivada do id da simulação (fato por execução)', async () => {
    const reader = new InMemoryOracleReader();
    const service = new PredictiveRevenueOracleService({
      reader,
      now: () => ORACLE_FIXED_NOW,
    });
    seedRealHistory(reader, orgA);

    const w = await service.runWhatIfSimulation({
      organizationId: orgA,
      name: 'Aceleração',
      horizonDays: 90,
    });

    expect(w.status).toBe('ok');
    expect(publishMock).toHaveBeenCalledTimes(1);
    const [event, opts] = publishMock.mock.calls[0];
    expect(event.eventType).toBe('WHAT_IF_SCENARIO_SIMULATED');
    expect(opts.idempotencyKey).toBe(`what-if:${w.simulationId}`);
    expect(opts.idempotencyKey).not.toContain('undefined');
  });

  it('VALUE_REALIZATION_MEASURED: chave por (tracker, índice da medição) — medições distintas não colidem', async () => {
    const tracker = await valueRealizationService.createTrackerFromPromise({
      organizationId: orgA,
      commitmentId: 'prom-idem-1',
      customerCompanyName: 'Transportadora Idem',
      metricType: 'productivity_gain',
      indicatorName: 'Produtividade',
      baselineValue: 50,
      targetValue: 100,
      unit: '%',
      deadline: new Date().toISOString(),
      responsibleOwnerName: 'Owner',
    });

    await valueRealizationService.recordObservedValue({
      organizationId: orgA,
      trackerId: tracker.id,
      observedValue: 60,
      evidence: 'Medição 1',
      measuredBy: 'Owner',
    });
    await valueRealizationService.recordObservedValue({
      organizationId: orgA,
      trackerId: tracker.id,
      observedValue: 70,
      evidence: 'Medição 2',
      measuredBy: 'Owner',
    });

    expect(publishMock).toHaveBeenCalledTimes(2);
    expect(publishMock.mock.calls[0][1]).toEqual({
      idempotencyKey: `value-realization:${tracker.id}:1`,
    });
    expect(publishMock.mock.calls[1][1]).toEqual({
      idempotencyKey: `value-realization:${tracker.id}:2`,
    });
  });
});

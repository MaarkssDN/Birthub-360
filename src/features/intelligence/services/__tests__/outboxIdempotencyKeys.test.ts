import { beforeEach, describe, expect, it, vi } from 'vitest';

// Handoff 16→00 (onda-3 / waveE): produtores de IA e automações devem publicar no
// DomainEventMesh com `opts.idempotencyKey` estável — identidade do fato de negócio,
// nunca randomUUID solto. Estes testes verificam que cada call site do domínio passa
// a chave correta (formato `dominio:{entityId}` ou id da execução) no segundo argumento.

const mocks = vi.hoisted(() => ({
  publish: vi.fn(),
  prismaCount: vi.fn(),
}));

vi.mock('../../../../lib/queue/domainEventMesh.service.js', () => ({
  domainEventMesh: { publish: mocks.publish },
}));

vi.mock('../../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../../../lib/prisma.js', () => ({
  prisma: { aIPendingAction: { count: mocks.prismaCount } },
}));

import { DevilsAdvocateAgent } from '../../agents/tactical/devilsAdvocate.agent.js';
import { PromiseGuardianAgent } from '../../agents/tactical/promiseGuardian.agent.js';
import { InMemoryWinLossAutopsyRepository } from '../../infra/winLossAutopsyRepository.js';
import { checkCircuitBreaker } from '../autonomyCircuitBreaker.service.js';
import { AutonomyGovernorService } from '../autonomyGovernor.service.js';
import { MethodologicalDigitalTwinService } from '../methodologicalDigitalTwin.service.js';
import { WinLossAutopsyService } from '../winLossAutopsy.service.js';

function lastPublishCall() {
  const call = mocks.publish.mock.calls.at(-1);
  expect(call).toBeDefined();
  return { event: call![0], opts: call![1] };
}

describe('Produtores IA/automações — idempotencyKey na outbox (handoff 16→00)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.publish.mockResolvedValue({ eventId: 'evt-1' });
  });

  it('AutonomyGovernor: AUTONOMY_LIMIT_EXCEEDED usa o id da avaliação como chave', async () => {
    const service = new AutonomyGovernorService();
    const params = {
      organizationId: 'org-1',
      agentRole: 'sdr-voice',
      actionType: 'send_whatsapp',
      actionPayload: {},
      estimatedValueCents: 10_000_000, // acima da alçada default (R$ 50.000,00)
    };

    await service.evaluateAction(params);
    const first = lastPublishCall();
    expect(first.event.eventType).toBe('AUTONOMY_LIMIT_EXCEEDED');
    expect(first.opts.idempotencyKey).toMatch(/^autonomy-eval:eval-/);

    // Cada avaliação é um fato distinto (actionId novo) — chaves nunca colidem.
    await service.evaluateAction(params);
    const second = lastPublishCall();
    expect(second.opts.idempotencyKey).not.toBe(first.opts.idempotencyKey);
  });

  it('AutonomyCircuitBreaker: TRIPPED usa a transição (org + timestamp) como chave', async () => {
    // 2 erros em 20 tentativas = 10% > threshold de downgrade (5%).
    mocks.prismaCount.mockResolvedValueOnce(20).mockResolvedValueOnce(2);

    await checkCircuitBreaker('org-cb-idem');

    const { event, opts } = lastPublishCall();
    expect(event.eventType).toBe('AUTONOMY_CIRCUIT_BREAKER_TRIPPED');
    expect(opts.idempotencyKey).toMatch(/^circuit-breaker-tripped:org-cb-idem:\d{4}-\d{2}-\d{2}T/);
  });

  it('PromiseGuardian: PROMISE_COMMITMENT_DETECTED usa o id do compromisso', async () => {
    const agent = new PromiseGuardianAgent();
    const detected = await agent.extractCommitmentsFromInteraction({
      organizationId: 'org-1',
      interactionId: 'int-1',
      sourceType: 'whatsapp',
      content: 'Vou te enviar a proposta amanhã de manhã.',
      sellerName: 'Ana',
      dealId: 'deal-1',
    });

    expect(detected.length).toBeGreaterThan(0);
    const { event, opts } = lastPublishCall();
    expect(event.eventType).toBe('PROMISE_COMMITMENT_DETECTED');
    expect(opts.idempotencyKey).toBe(`promise-commitment:${detected[0].id}`);
  });

  it('DevilsAdvocate: DEVILS_ADVOCATE_ALERT usa dealId + analysisDate da execução', async () => {
    const agent = new DevilsAdvocateAgent();
    const analysis = await agent.evaluateDealForecast('org-1', 'deal-1', {
      currentProbability: 80,
      daysInCurrentStage: 18, // > 1.5x a média (8d) → estagnação
      daysSinceLastInteraction: 10, // ≥ 7 → risco de ghosting
      unresolvedObjections: ['preço'],
      competitorsMentioned: ['Concorrente X'],
    });

    expect(analysis.optimismBiasDetected).toBe(true);
    const { event, opts } = lastPublishCall();
    expect(event.eventType).toBe('DEVILS_ADVOCATE_ALERT');
    // Reavaliações futuras do mesmo deal geram analysisDate novo → não são suprimidas.
    expect(opts.idempotencyKey).toBe(`devils-advocate:deal-1:${analysis.analysisDate}`);
  });

  it('MethodologicalDigitalTwin: METHODOLOGICAL_MENTORSHIP_COMPLETED usa o exerciseId', async () => {
    const service = new MethodologicalDigitalTwinService();
    const exercise = await service.startMentorshipExercise({
      organizationId: 'org-1',
      sellerId: 'seller-1',
      techniqueId: 'tech-spin-implication',
    });

    await service.evaluateSellerResponse({
      organizationId: 'org-1',
      exerciseId: exercise.exerciseId,
      sellerId: 'seller-1',
      responseText: 'Qual o impacto do custo de inação no seu orçamento?',
      recordedDurationSeconds: 60,
    });

    const { event, opts } = lastPublishCall();
    expect(event.eventType).toBe('METHODOLOGICAL_MENTORSHIP_COMPLETED');
    expect(opts.idempotencyKey).toBe(`mentorship:${exercise.exerciseId}`);
  });

  it('WinLossAutopsy: WIN_LOSS_AUTOPSY_COMPLETED usa o id do relatório gerado', async () => {
    const service = new WinLossAutopsyService(new InMemoryWinLossAutopsyRepository());
    const report = await service.generateAutopsy({
      organizationId: 'org-1',
      dealId: 'deal-9',
      outcome: 'DEAL_WON',
      dealTitle: 'Contrato Enterprise',
      companyName: 'Cliente XPTO',
      dealValue: 120000,
      timelineEvents: [],
      messagesAndNotes: [],
    });

    const { event, opts } = lastPublishCall();
    expect(event.eventType).toBe('WIN_LOSS_AUTOPSY_COMPLETED');
    expect(opts.idempotencyKey).toBe(`win-loss-autopsy:${report.id}`);
  });
});

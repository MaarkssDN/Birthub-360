/**
 * HITL — recordHumanDecisionFeedback: grava o AuditLog da decisão humana e dispara a reflexão do
 * LearningAgent em background, sem nunca propagar falhas para a rota.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const auditCreate = vi.fn();
vi.mock('../../../../../src/lib/prisma.js', () => ({
  prisma: { auditLog: { create: (...args: unknown[]) => auditCreate(...args) } },
}));
vi.mock('../../../../../src/lib/logger.js', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
const reflectAndLearn = vi.fn();
vi.mock('../../../../../src/features/intelligence/agents/learning.agent.js', () => ({
  LearningAgent: class {
    reflectAndLearn = reflectAndLearn;
  },
}));

const { recordHumanDecisionFeedback } = await import(
  '../../../../../src/features/intelligence/services/aiPendingAction.service.js'
);
const { logger } = await import('../../../../../src/lib/logger.js');

afterEach(() => vi.clearAllMocks());

describe('recordHumanDecisionFeedback', () => {
  it('registra aprovação no AuditLog e aciona o LearningAgent', async () => {
    auditCreate.mockResolvedValue({});
    reflectAndLearn.mockResolvedValue('ok');
    await recordHumanDecisionFeedback({
      organizationId: 'org-1',
      actorId: 'user-1',
      actionId: 'act-1',
      decision: 'APPROVE',
      actionType: 'send_email',
      rationale: 'ok',
      leadId: 'lead-1',
    });
    const data = auditCreate.mock.calls[0][0].data;
    expect(data).toMatchObject({
      tenantId: 'org-1',
      actorId: 'user-1',
      action: 'AI_PENDING_ACTION_APPROVED',
      entity: 'AIPendingAction',
      entityId: 'act-1',
    });
    expect(JSON.parse(data.details)).toMatchObject({ leadId: 'lead-1', rationale: 'ok' });
    await vi.waitFor(() => expect(reflectAndLearn).toHaveBeenCalledWith('org-1', 'user-1'));
  });

  it('registra rejeição com nulos e loga erro do LearningAgent sem propagar', async () => {
    auditCreate.mockResolvedValue({});
    reflectAndLearn.mockRejectedValue(new Error('llm fora'));
    await recordHumanDecisionFeedback({
      organizationId: 'org-1',
      actorId: 'user-1',
      actionId: 'act-2',
      decision: 'REJECT',
    });
    const data = auditCreate.mock.calls[0][0].data;
    expect(data.action).toBe('AI_PENDING_ACTION_REJECTED');
    expect(JSON.parse(data.details)).toMatchObject({ leadId: null, rationale: null });
    await vi.waitFor(() => expect(logger.warn).toHaveBeenCalled());
  });

  it('não aciona o LearningAgent sem actorId e engole falha do AuditLog', async () => {
    auditCreate.mockResolvedValueOnce({});
    await recordHumanDecisionFeedback({
      organizationId: 'org-1',
      actorId: '',
      actionId: 'act-3',
      decision: 'APPROVE',
    });
    expect(reflectAndLearn).not.toHaveBeenCalled();

    auditCreate.mockRejectedValueOnce(new Error('db fora'));
    await expect(
      recordHumanDecisionFeedback({
        organizationId: 'org-1',
        actorId: 'user-1',
        actionId: 'act-4',
        decision: 'APPROVE',
      }),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});

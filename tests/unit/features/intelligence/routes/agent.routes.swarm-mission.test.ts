import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const acquireSlotMock = vi.fn();
const releaseSlotMock = vi.fn();
const executeMissionMock = vi.fn();
const executeMissionStreamMock = vi.fn();
const logSwarmActionMock = vi.fn(async () => undefined);

vi.mock('../../../../../src/features/intelligence/services/swarmAudit.service.js', () => ({
  getSwarmAuditLogs: vi.fn(async () => ({ logs: [], total: 0 })),
  logSwarmAction: (...args: unknown[]) => logSwarmActionMock(...args),
}));
vi.mock('../../../../../src/features/intelligence/services/swarmConcurrency.service.js', () => ({
  acquireMissionSlot: (...args: unknown[]) => acquireSlotMock(...args),
  releaseMissionSlot: (...args: unknown[]) => releaseSlotMock(...args),
  getSwarmConcurrencyState: vi.fn(() => ({ maxConcurrent: 4, active: 0, waiting: 0 })),
}));
vi.mock('../../../../../src/features/intelligence/services/autonomyCircuitBreaker.service.js', () => ({
  getCircuitBreakerState: vi.fn(() => null),
}));
vi.mock('../../../../../src/features/intelligence/services/swarmScheduler.service.js', () => ({
  getSwarmSloSnapshot: vi.fn(),
}));
vi.mock('../../../../../src/features/intelligence/services/evaluationMetrics.service.js', () => ({
  getEvaluationMetricsSnapshot: vi.fn(),
}));
vi.mock('../../../../../src/features/intelligence/services/voicebox.service.js', () => ({
  synthesizeSpeech: vi.fn(),
}));
vi.mock('../../../../../src/features/intelligence/agents/supervisor.agent.js', () => ({
  SwarmOrchestrator: class {
    executeMission(...args: unknown[]) {
      return executeMissionMock(...args);
    }
    executeMissionStream(...args: unknown[]) {
      return executeMissionStreamMock(...args);
    }
  },
}));
vi.mock('../../../../../src/features/intelligence/agents/learning.agent.js', () => ({
  LearningAgent: vi.fn(),
}));
vi.mock('../../../../../src/lib/ai/gateway.js', () => ({
  getAiModel: vi.fn(),
  logAiUsage: vi.fn(),
}));
vi.mock('../../../../../src/features/intelligence/services/guardrails.service.js', () => ({
  redactAndTrackPiiLeak: vi.fn(async (t: string) => t),
}));

import { agentRoutes } from '@/features/intelligence/routes/agent.routes';
import { errorHandler } from '@/shared/middlewares/errorHandler';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as unknown as { user: { id: string; organizationId: string; role: string } }).user = {
      id: 'test-user',
      organizationId: 'org-1',
      role: 'GESTOR',
    };
    next();
  });
  app.use('/api/agent', agentRoutes);
  app.use(errorHandler);
  return app;
}

const validBody = { mission: 'qualificar lead X', sessionId: 'sess-1' };

beforeEach(() => {
  vi.clearAllMocks();
  acquireSlotMock.mockResolvedValue('acquired');
  executeMissionMock.mockResolvedValue([{ content: 'resposta do swarm' }]);
  executeMissionStreamMock.mockImplementation(
    async (_m: string, _s: string, onEvent: (e: unknown) => void) => {
      onEvent({ type: 'agent_result', agent: 'closer', content: 'ok' });
    },
  );
});

describe('POST /api/agent/swarm/mission', () => {
  it('rejeita characterId desconhecido com 400', async () => {
    const res = await request(buildApp())
      .post('/api/agent/swarm/mission')
      .send({ ...validBody, characterId: 'nao-existe' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('characterId');
  });

  it('retorna 409 quando a missão é duplicada (idempotência)', async () => {
    acquireSlotMock.mockResolvedValue('duplicate');
    const res = await request(buildApp()).post('/api/agent/swarm/mission').send(validBody);
    expect(res.status).toBe(409);
    expect(releaseSlotMock).not.toHaveBeenCalled();
  });

  it('retorna 429 quando a capacidade do enxame está esgotada', async () => {
    acquireSlotMock.mockResolvedValue('timeout');
    const res = await request(buildApp()).post('/api/agent/swarm/mission').send(validBody);
    expect(res.status).toBe(429);
  });

  it('executa a missão e devolve as mensagens no envelope data', async () => {
    const res = await request(buildApp()).post('/api/agent/swarm/mission').send({
      ...validBody,
      characterId: 'orbit',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messages).toEqual(['resposta do swarm']);
    expect(executeMissionMock).toHaveBeenCalledWith('qualificar lead X', 'sess-1', undefined);
    expect(releaseSlotMock).toHaveBeenCalledWith('org-1', 'sess-1');
    expect(logSwarmActionMock).toHaveBeenCalled();
  });

  it('gera sessionId quando não informado', async () => {
    const { sessionId: _omit, ...body } = validBody;
    const res = await request(buildApp()).post('/api/agent/swarm/mission').send(body);
    expect(res.status).toBe(200);
    expect(executeMissionMock.mock.calls[0][1]).toMatch(/^swarm-mission-/);
  });
});

describe('POST /api/agent/swarm/stream', () => {
  it('rejeita characterId desconhecido com 400', async () => {
    const res = await request(buildApp())
      .post('/api/agent/swarm/stream')
      .send({ ...validBody, characterId: 'fantasma' });
    expect(res.status).toBe(400);
  });

  it('emite evento SSE de erro DUPLICATE_MISSION para slot duplicado', async () => {
    acquireSlotMock.mockResolvedValue('duplicate');
    const res = await request(buildApp()).post('/api/agent/swarm/stream').send(validBody);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.text).toContain('DUPLICATE_MISSION');
  });

  it('emite evento SSE de erro QUEUE_TIMEOUT para slot timeout', async () => {
    acquireSlotMock.mockResolvedValue('timeout');
    const res = await request(buildApp()).post('/api/agent/swarm/stream').send(validBody);
    expect(res.text).toContain('QUEUE_TIMEOUT');
  });

  it('executa o stream e encerra com evento end', async () => {
    const res = await request(buildApp()).post('/api/agent/swarm/stream').send(validBody);
    expect(res.text).toContain('agent_result');
    expect(res.text).toContain('event: end');
    expect(releaseSlotMock).toHaveBeenCalledWith('org-1', 'sess-1');
  });

  it('emite evento queued quando acquireMissionSlot reporta posição', async () => {
    acquireSlotMock.mockImplementation(
      async (_org: string, _sid: string, onQueued?: (pos: number) => void) => {
        onQueued?.(3);
        return 'acquired';
      },
    );
    const res = await request(buildApp()).post('/api/agent/swarm/stream').send(validBody);
    expect(res.text).toContain('event: queued');
    expect(res.text).toContain('"position":3');
  });
});

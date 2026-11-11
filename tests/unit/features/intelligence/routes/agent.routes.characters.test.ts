import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Central de Personagens — GET /api/agent/characters* (missão integração 29 personagens).

const getSwarmAuditLogsMock = vi.fn();
const getSwarmConcurrencyStateMock = vi.fn();
const getCircuitBreakerStateMock = vi.fn();

vi.mock('../../../../../src/features/intelligence/services/swarmAudit.service.js', () => ({
  getSwarmAuditLogs: (...args: unknown[]) => getSwarmAuditLogsMock(...args),
  logSwarmAction: vi.fn(async () => undefined),
}));
vi.mock('../../../../../src/features/intelligence/services/swarmConcurrency.service.js', () => ({
  acquireMissionSlot: vi.fn(async () => 'acquired'),
  releaseMissionSlot: vi.fn(),
  getSwarmConcurrencyState: (...args: unknown[]) => getSwarmConcurrencyStateMock(...args),
}));
vi.mock('../../../../../src/features/intelligence/services/autonomyCircuitBreaker.service.js', () => ({
  getCircuitBreakerState: (...args: unknown[]) => getCircuitBreakerStateMock(...args),
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
  SwarmOrchestrator: vi.fn(),
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

function buildApp(organizationId = 'org-1', role = 'GESTOR') {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as unknown as { user: { id: string; organizationId: string; role: string } }).user = {
      id: 'test-user',
      organizationId,
      role,
    };
    next();
  });
  app.use('/api/agent', agentRoutes);
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  getSwarmAuditLogsMock.mockResolvedValue({ logs: [], total: 0 });
  getSwarmConcurrencyStateMock.mockReturnValue({ maxConcurrent: 4, active: 0, waiting: 0 });
  getCircuitBreakerStateMock.mockReturnValue(null);
});

describe('GET /api/agent/characters', () => {
  it('devolve os 29 personagens com vínculo runtime real', async () => {
    const res = await request(buildApp()).get('/api/agent/characters');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const chars = res.body.data.characters;
    expect(chars).toHaveLength(29);
    const ids = chars.map((c: { id: string }) => c.id);
    expect(new Set(ids).size).toBe(29);
    // todo personagem carrega runtime derivado de registros reais
    for (const c of chars) {
      expect(c.runtime).toBeDefined();
      expect(c.runtime.kind).toBeTruthy();
      expect(c.runtime.dispatch).toBeTruthy();
    }
    // amostras de vínculo verificável
    const axiom = chars.find((c: { id: string }) => c.id === 'axiom');
    expect(axiom.runtime.httpRoute).toBe('/api/agent/commercial-cell/ldr-intelligence/run');
    const ledger = chars.find((c: { id: string }) => c.id === 'ledger');
    expect(ledger.runtime.status).toBe('unavailable');
    const aegis = chars.find((c: { id: string }) => c.id === 'aegis');
    expect(aegis.runtime.dispatch).toBe('swarm-stream');
  });

  it('enriquece status swarm-stream como degraded quando circuit breaker OPEN', async () => {
    getCircuitBreakerStateMock.mockReturnValue({ state: 'OPEN' });
    const res = await request(buildApp()).get('/api/agent/characters');
    expect(res.status).toBe(200);
    const orbit = res.body.data.characters.find((c: { id: string }) => c.id === 'orbit');
    expect(orbit.runtime.status).toBe('degraded');
    expect(res.body.data.swarm.circuitBreaker.state).toBe('OPEN');
  });

  it('escopa dados de atividade por organizationId', async () => {
    getSwarmAuditLogsMock.mockResolvedValue({
      logs: [{ id: 'l1', agentType: 'SUPERVISOR', action: 'swarm_mission_start', result: 'success', createdAt: '2026-11-10T00:00:00Z' }],
      total: 1,
    });
    const res = await request(buildApp('org-xyz')).get('/api/agent/characters/activity?limit=5');
    expect(res.status).toBe(200);
    expect(getSwarmAuditLogsMock).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-xyz', limit: 5 }),
    );
  });

  it('GET /:id devolve detalhe ou 404', async () => {
    const ok = await request(buildApp()).get('/api/agent/characters/axiom');
    expect(ok.status).toBe(200);
    expect(ok.body.data.id).toBe('axiom');
    const nf = await request(buildApp()).get('/api/agent/characters/nao-existe');
    expect(nf.status).toBe(404);
  });

  it('GET /concurrency reflete o estado do gate para a org', async () => {
    getSwarmConcurrencyStateMock.mockReturnValue({ maxConcurrent: 4, active: 2, waiting: 1 });
    const res = await request(buildApp('org-cc')).get('/api/agent/characters/concurrency');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ maxConcurrent: 4, active: 2, waiting: 1 });
    expect(getSwarmConcurrencyStateMock).toHaveBeenCalledWith('org-cc');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

/**
 * Rotas da Central de Personagens (`/api/agent/characters*`,
 * `src/features/characters/characterRuntime.routes.ts`).
 *
 * O router é montado sob `/api/agent` em produção (herda authenticateToken +
 * requireTenant); aqui injetamos `req.user.organizationId` via middleware para
 * exercitar a lógica real: catálogo + vínculo runtime, degradação por circuit
 * breaker OPEN, activity com limite clampado e 404 honesto.
 */

const { getSwarmAuditLogsMock, getSwarmConcurrencyStateMock, getCircuitBreakerStateMock } =
  vi.hoisted(() => ({
    getSwarmAuditLogsMock: vi.fn(),
    getSwarmConcurrencyStateMock: vi.fn(),
    getCircuitBreakerStateMock: vi.fn(),
  }));

vi.mock('@/features/intelligence/services/swarmAudit.service', () => ({
  getSwarmAuditLogs: (...args: unknown[]) => getSwarmAuditLogsMock(...args),
}));

vi.mock('@/features/intelligence/services/swarmConcurrency.service', () => ({
  getSwarmConcurrencyState: (...args: unknown[]) => getSwarmConcurrencyStateMock(...args),
}));

vi.mock('@/features/intelligence/services/autonomyCircuitBreaker.service', () => ({
  getCircuitBreakerState: (...args: unknown[]) => getCircuitBreakerStateMock(...args),
}));

import { characterRuntimeRoutes } from '@/features/characters/characterRuntime.routes';
import { errorHandler } from '@/shared/middlewares/errorHandler';

const app = express();
app.use(express.json());
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as Request & { user: { organizationId: string } }).user = {
    organizationId: 'org-test-1',
  };
  next();
});
app.use('/api/agent/characters', characterRuntimeRoutes);
app.use(errorHandler);

const AUDIT_LOG = {
  id: 'log-1',
  organizationId: 'org-test-1',
  agentType: 'supervisor',
  action: 'mission.dispatch',
  result: 'success',
  details: {},
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  getSwarmAuditLogsMock.mockReset();
  getSwarmAuditLogsMock.mockResolvedValue({ logs: [AUDIT_LOG], total: 1 });
  getSwarmConcurrencyStateMock.mockReset();
  getSwarmConcurrencyStateMock.mockReturnValue({ maxConcurrent: 2, active: 0, waiting: 0 });
  getCircuitBreakerStateMock.mockReset();
  getCircuitBreakerStateMock.mockReturnValue(null);
});

describe('GET /api/agent/characters', () => {
  it('retorna catálogo completo com vínculo runtime e estado do enxame', async () => {
    const res = await request(app).get('/api/agent/characters');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.characters.length).toBeGreaterThan(0);
    const first = res.body.data.characters[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first.runtime).toHaveProperty('status');
    expect(first.runtime).toHaveProperty('dispatch');
    expect(res.body.data.swarm).toEqual({
      concurrency: { maxConcurrent: 2, active: 0, waiting: 0 },
      circuitBreaker: null,
    });
    expect(getCircuitBreakerStateMock).toHaveBeenCalledWith('org-test-1');
    expect(getSwarmConcurrencyStateMock).toHaveBeenCalledWith('org-test-1');
  });

  it('degrada honestamente personagens swarm-stream quando circuit breaker está OPEN', async () => {
    getCircuitBreakerStateMock.mockReturnValue({ state: 'OPEN' });

    const res = await request(app).get('/api/agent/characters');
    expect(res.status).toBe(200);
    expect(res.body.data.swarm.circuitBreaker).toEqual({ state: 'OPEN' });

    const swarmCharacters = res.body.data.characters.filter(
      (c: { runtime: { dispatch: string } }) => c.runtime.dispatch === 'swarm-stream',
    );
    expect(swarmCharacters.length).toBeGreaterThan(0);
    for (const c of swarmCharacters) {
      expect(c.runtime.status).toBe('degraded');
      expect(c.runtime.reason).toContain('Circuit breaker');
    }
  });
});

describe('GET /api/agent/characters/activity', () => {
  it('retorna logs de auditoria com limite clampado', async () => {
    const res = await request(app).get('/api/agent/characters/activity?limit=500');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ logs: [AUDIT_LOG], total: 1 });
    expect(getSwarmAuditLogsMock).toHaveBeenCalledWith({
      organizationId: 'org-test-1',
      limit: 100, // clamp em 100
    });
  });

  it('propaga erro para o errorHandler quando o audit log falha', async () => {
    getSwarmAuditLogsMock.mockRejectedValue(new Error('db down'));
    const res = await request(app).get('/api/agent/characters/activity');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/agent/characters/concurrency', () => {
  it('retorna estado do gate de concorrência', async () => {
    const res = await request(app).get('/api/agent/characters/concurrency');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ maxConcurrent: 2, active: 0, waiting: 0 });
  });
});

describe('GET /api/agent/characters/:id', () => {
  it('retorna detalhe de personagem existente com atividade recente', async () => {
    const res = await request(app).get('/api/agent/characters/axiom');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('axiom');
    expect(res.body.data.runtime).toBeDefined();
    expect(getSwarmAuditLogsMock).toHaveBeenCalledWith({
      organizationId: 'org-test-1',
      limit: 10,
    });
  });

  it('retorna 404 honesto para personagem inexistente', async () => {
    const res = await request(app).get('/api/agent/characters/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('não encontrado');
  });
});

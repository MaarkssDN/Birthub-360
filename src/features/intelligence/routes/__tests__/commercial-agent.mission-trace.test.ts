/**
 * GET /api/commercial-agent/mission/:id/trace — BT360-DT-0039 (TAREFA-SANEAMENTO-005).
 *
 * Antes desta correção a rota montava um `AgentCenterTrace` SINTÉTICO a partir de Lead /
 * OptOutRecord / Activity do CRM — lead com score virava "Giselle COMPLETED", lead com
 * atividade virava "Patrícia COMPLETED" e ausência de opt-out virava "Guardião COMPLETED",
 * sem nenhuma execução real de agente por trás. A rota agora delega a
 * `getCommercialMissionTrace`, que lê `AgentHandoffMessage` + `AgentExecution` persistidos e a
 * trilha de consentimento LGPD. Estes testes trancam o contrato novo: missão sem registro
 * persistido é 404 (nunca trace fabricado) e `default` resolve a missão mais recente.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const { getCommercialMissionTraceMock } = vi.hoisted(() => ({
  getCommercialMissionTraceMock: vi.fn(),
}));

vi.mock('@/features/intelligence/services/commercialMissionTrace.service.js', () => ({
  getCommercialMissionTrace: (...args: unknown[]) => getCommercialMissionTraceMock(...args),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

import { commercialAgentRoutes } from '../commercial-agent.routes.js';

function buildApp() {
  const app = express();
  app.use((req, _res, next) => {
    (req as express.Request & { user: unknown }).user = {
      id: 'user-1',
      email: 'vendedor@tenant-a.test',
      role: 'ADMIN',
      organizationId: 'org-a',
    };
    next();
  });
  app.use('/api/commercial-agent', commercialAgentRoutes);
  return app;
}

const persistedTrace = {
  missionId: 'mission-abc',
  requestedMissionId: 'default',
  missionKey: 'mission-abc',
  generatedAt: '2026-11-10T00:00:00.000Z',
  title: 'Missão autônoma mission-abc',
  accountName: 'Conta não identificada',
  status: 'COMPLETED',
  root: 'Agent Runtime (execução persistida)',
  rootNodes: [],
  directors: {
    giselle: { status: 'COMPLETED', specialists: [] },
    patricia: { status: 'COMPLETED', specialists: [] },
    guardiao: { status: 'COMPLETED', specialists: [] },
  },
  executions: [],
  handoffs: [],
  consent: {
    organizationAiConsent: null,
    externalPiiConsentGranted: false,
    auditChain: {
      status: 'VERIFIED',
      valid: true,
      totalRecords: 0,
      reason: null,
      checkedAt: '2026-11-10T00:00:00.000Z',
      events: [],
    },
  },
};

describe('GET /api/commercial-agent/mission/:id/trace', () => {
  beforeEach(() => {
    getCommercialMissionTraceMock.mockReset();
  });

  it('retorna 404 quando não existe missão persistida — nunca trace sintético', async () => {
    getCommercialMissionTraceMock.mockResolvedValue(null);

    const res = await request(buildApp()).get('/api/commercial-agent/mission/default/trace');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(getCommercialMissionTraceMock).toHaveBeenCalledWith({
      db: expect.anything(),
      organizationId: 'org-a',
      requestedMissionId: 'default',
    });
  });

  it('retorna o trace real persistido para `default`', async () => {
    getCommercialMissionTraceMock.mockResolvedValue(persistedTrace);

    const res = await request(buildApp()).get('/api/commercial-agent/mission/default/trace');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.missionId).toBe('mission-abc');
    expect(res.body.data.executions).toEqual([]);
    expect(res.body.data.consent.auditChain.status).toBe('VERIFIED');
  });

  it('remove o prefixo `mission-` do id antes de consultar o serviço', async () => {
    getCommercialMissionTraceMock.mockResolvedValue({ ...persistedTrace, missionId: 'm-1' });

    const res = await request(buildApp()).get('/api/commercial-agent/mission/mission-m-1/trace');

    expect(res.status).toBe(200);
    expect(getCommercialMissionTraceMock).toHaveBeenCalledWith(
      expect.objectContaining({ requestedMissionId: 'm-1' }),
    );
  });

  it('propaga erro do serviço para o error handler (sem fallback silencioso)', async () => {
    getCommercialMissionTraceMock.mockRejectedValue(new Error('db indisponível'));

    const res = await request(buildApp()).get('/api/commercial-agent/mission/default/trace');

    expect(res.status).toBeGreaterThanOrEqual(500);
  });
});

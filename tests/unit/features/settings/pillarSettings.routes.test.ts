import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '@/shared/middlewares/errorHandler';
import { PillarSettingsValidationError } from '@/features/settings/domain/pillarSettings.js';
import { PillarSettingsServiceError } from '@/features/settings/services/pillarSettings.service.js';

const getMock = vi.fn();
const updateMock = vi.fn();

vi.mock('@/features/settings/services/pillarSettings.service.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/settings/services/pillarSettings.service.js')>();
  return {
    ...actual,
    pillarSettingsService: {
      get: (...args: unknown[]) => getMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
  };
});

const { pillarSettingsRoutes } = await import(
  '@/features/settings/routes/pillarSettings.routes.js'
);

function buildApp(user: { id: string; organizationId: string; role: string } | null) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (user) (req as { user?: typeof user }).user = user;
    next();
  });
  app.use('/api/settings/pillars', pillarSettingsRoutes);
  app.use(errorHandler);
  return app;
}

const ADMIN = { id: 'admin-1', organizationId: 'org-1', role: 'ADMIN' };
const VIEW = { pillar: 'hub', values: { stagnationDays: 14 }, configured: false, updatedAt: null };

describe('pillarSettings.routes', () => {
  beforeEach(() => {
    getMock.mockReset();
    updateMock.mockReset();
    getMock.mockResolvedValue(VIEW);
    updateMock.mockResolvedValue({ ...VIEW, configured: true });
  });

  it('GET /:pillar devolve as configurações do tenant autenticado', async () => {
    const res = await request(buildApp(ADMIN)).get('/api/settings/pillars/hub');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: VIEW });
    expect(getMock).toHaveBeenCalledWith('org-1', 'hub');
  });

  it('GET com slug desconhecido responde 404 e não chama o service', async () => {
    const res = await request(buildApp(ADMIN)).get('/api/settings/pillars/desconhecido');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/desconhecido/i);
    expect(getMock).not.toHaveBeenCalled();
  });

  it('GET propaga 400 de validação do domínio', async () => {
    getMock.mockRejectedValueOnce(new PillarSettingsValidationError('Campo "values" deve ser um objeto.'));
    const res = await request(buildApp(ADMIN)).get('/api/settings/pillars/hub');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/objeto/i);
  });

  it('GET propaga status do PillarSettingsServiceError', async () => {
    getMock.mockRejectedValueOnce(
      new PillarSettingsServiceError('Contexto de organização é obrigatório.', 400),
    );
    const res = await request(buildApp(ADMIN)).get('/api/settings/pillars/market');
    expect(res.status).toBe(400);
    expect(getMock).toHaveBeenCalledWith('org-1', 'market');
  });

  it('GET encaminha erro inesperado ao error handler', async () => {
    getMock.mockRejectedValueOnce(new Error('boom'));
    const res = await request(buildApp(ADMIN)).get('/api/settings/pillars/hub');
    expect(res.status).toBeGreaterThanOrEqual(500);
  });

  it('PUT exige ADMIN e persiste values', async () => {
    const payload = { values: { stagnationDays: 21 } };
    const res = await request(buildApp(ADMIN))
      .put('/api/settings/pillars/hub')
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(updateMock).toHaveBeenCalledWith('org-1', 'admin-1', 'hub', payload.values);
  });

  it('PUT bloqueia papel não-ADMIN com 403', async () => {
    const res = await request(buildApp({ ...ADMIN, role: 'SDR' }))
      .put('/api/settings/pillars/hub')
      .send({ values: { stagnationDays: 21 } });
    expect(res.status).toBe(403);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('PUT sem autenticação responde 401', async () => {
    const res = await request(buildApp(null))
      .put('/api/settings/pillars/hub')
      .send({ values: {} });
    expect(res.status).toBe(401);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('PUT com pilar inexistente responde 404', async () => {
    const res = await request(buildApp(ADMIN))
      .put('/api/settings/pillars/xyz')
      .send({ values: {} });
    expect(res.status).toBe(404);
    expect(updateMock).not.toHaveBeenCalled();
  });
});

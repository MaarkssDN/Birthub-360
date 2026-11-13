/**
 * F4 (PR #243): cobre a linha de rota nova `GET /bitrix-sync-health` em
 * commercialIntelligence.routes.ts — monta o router REAL (com `requireRole` de
 * ADMIN/GESTOR ativo, como em produção) e injeta um controller stub via container
 * (mesmo padrão de tests/unit/features/billing/routes/usage.routes.test.ts).
 * Garante que a rota está registrada, passa pelo RBAC e delega ao handler.
 */
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { container } from '@/shared/di/container';
import { commercialIntelligenceRoutes } from '@/features/commercial-intelligence/routes/commercialIntelligence.routes';
import { errorHandler } from '@/shared/middlewares/errorHandler';
import type { CommercialIntelligenceController } from '@/features/commercial-intelligence/presentation/CommercialIntelligenceController';

const URL = '/api/commercial-intelligence/bitrix-sync-health';

const getBitrixSyncHealth = vi.fn();

function buildApp(role = 'GESTOR') {
  container.register(
    'CommercialIntelligenceController',
    { getBitrixSyncHealth } as unknown as CommercialIntelligenceController,
  );

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as unknown as { user: { id: string; organizationId: string; role: string } }).user = {
      id: 'user-1',
      organizationId: 'org-1',
      role,
    };
    next();
  });
  app.use('/api/commercial-intelligence', commercialIntelligenceRoutes);
  app.use(errorHandler);
  return app;
}

describe('GET /api/commercial-intelligence/bitrix-sync-health (F4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rota registrada: GESTOR recebe 200 e o handler é invocado', async () => {
    const health = { connected: true, totalOpen: 3, linked: 3, linkedRate: 100 };
    getBitrixSyncHealth.mockImplementation(async (_req: unknown, res: { json: (v: unknown) => void }) =>
      res.json({ success: true, data: health }),
    );

    const res = await request(buildApp('GESTOR')).get(URL);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: health });
    expect(getBitrixSyncHealth).toHaveBeenCalledTimes(1);
  });

  it('RBAC preservado: papel fora de ADMIN/GESTOR recebe 403 e o handler não roda', async () => {
    const res = await request(buildApp('SDR')).get(URL);

    expect(res.status).toBe(403);
    expect(getBitrixSyncHealth).not.toHaveBeenCalled();
  });
});

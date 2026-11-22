import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type {
  OrganizationModulesRepository,
  OrganizationModulesStoredState,
} from '../../../../src/features/organization-modules/domain/OrganizationModules.js';
import { organizationModulesRoutes } from '../../../../src/features/organization-modules/routes/organizationModules.routes.js';
import {
  OrganizationModulesService,
  OrganizationModulesServiceError,
  organizationModulesService,
} from '../../../../src/features/organization-modules/services/organizationModules.service.js';

class InMemoryRepo implements OrganizationModulesRepository {
  private data = new Map<string, OrganizationModulesStoredState>();

  async load(organizationId: string): Promise<OrganizationModulesStoredState | null> {
    const found = this.data.get(organizationId);
    return found ? { ...found } : null;
  }

  async save(organizationId: string, state: OrganizationModulesStoredState): Promise<void> {
    this.data.set(organizationId, { ...state });
  }
}

describe('OrganizationModules — Optimistic Locking & CAS Concurrency (DIV-AGENTE-02-001)', () => {
  const ORG_ID = 'org-concurrency-test';
  const USER_A = 'admin-user-a';
  const USER_B = 'admin-user-b';

  it('incrementa version sequencialmente a cada mutação bem-sucedida e no completeOnboarding', async () => {
    const repo = new InMemoryRepo();
    const service = new OrganizationModulesService(repo);

    const initial = await service.get(ORG_ID);
    expect(initial.version).toBe(1);

    const v1 = await service.enable(ORG_ID, USER_A, 'social-selling');
    expect(v1.version).toBe(2);

    const v2 = await service.enable(ORG_ID, USER_A, 'hub-inteligencia');
    expect(v2.version).toBe(3);

    const v3 = await service.completeOnboarding(ORG_ID, USER_A, new Date(), 3);
    expect(v3.version).toBe(4);
  });

  it('rejeita com 409 Conflict se expectedVersion for defasada em relação ao banco', async () => {
    const repo = new InMemoryRepo();
    const service = new OrganizationModulesService(repo);

    // Estado inicial: version = 1
    await service.enable(ORG_ID, USER_A, 'social-selling'); // vira version = 2

    // Admin B tenta atualizar assumindo que ainda está na version 1
    const promise = service.replace(
      ORG_ID,
      USER_B,
      ['crm-comercial', 'social-selling', 'hub-inteligencia'],
      1,
    );

    await expect(promise).rejects.toThrow(OrganizationModulesServiceError);
    await expect(promise).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining('Conflito de concorrência'),
    });
  });

  it('duas atualizações simultâneas com mesma versão base resultam em uma aprovada e uma 409 Conflict', async () => {
    const repo = new InMemoryRepo();
    const service = new OrganizationModulesService(repo);

    // Salva estado inicial
    await service.enable(ORG_ID, USER_A, 'social-selling'); // version = 2

    // Ambos os admins leram version = 2
    const current = await service.get(ORG_ID);
    expect(current.version).toBe(2);

    // Ambos disparam mutações concorrentes com expectedVersion = 2
    const results = await Promise.allSettled([
      service.enable(ORG_ID, USER_A, 'hub-inteligencia', 2),
      service.disable(ORG_ID, USER_B, 'social-selling', 2),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exatamente uma teve sucesso e uma foi rejeitada com 409
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const error = (rejected[0] as PromiseRejectedResult).reason;
    expect(error).toBeInstanceOf(OrganizationModulesServiceError);
    expect(error.statusCode).toBe(409);
    expect(error.message).toContain('Conflito de concorrência');

    // A versão final após a mutação vencedora é 3
    const finalState = await service.get(ORG_ID);
    expect(finalState.version).toBe(3);
  });

  it('rotas HTTP extraem expectedVersion via If-Match e body e retornam 409 em conflito', async () => {
    const app = express();
    app.use(express.json());
    app.use((req: any, _res, next) => {
      req.user = { id: USER_A, organizationId: ORG_ID, role: 'ADMIN' };
      next();
    });
    app.use('/api/organization-modules', organizationModulesRoutes);

    const mockView = {
      organizationId: ORG_ID,
      activeModules: ['crm-comercial'],
      catalog: [],
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
      updatedBy: USER_A,
      version: 2,
    } as any;

    vi.spyOn(organizationModulesService, 'get').mockResolvedValueOnce(mockView);
    const getRes = await request(app).get('/api/organization-modules');
    expect(getRes.status).toBe(200);

    vi.spyOn(organizationModulesService, 'completeOnboarding').mockResolvedValueOnce(mockView);
    const onbRes = await request(app)
      .post('/api/organization-modules/onboarding/complete')
      .set('If-Match', '"2"')
      .send({});
    expect(onbRes.status).toBe(200);
    expect(organizationModulesService.completeOnboarding).toHaveBeenCalledWith(
      ORG_ID,
      USER_A,
      expect.any(Date),
      2,
    );

    vi.spyOn(organizationModulesService, 'replace').mockResolvedValueOnce(mockView);
    const putRes = await request(app)
      .put('/api/organization-modules')
      .send({ modules: ['crm-comercial'], version: 3 });
    expect(putRes.status).toBe(200);
    expect(organizationModulesService.replace).toHaveBeenCalledWith(
      ORG_ID,
      USER_A,
      ['crm-comercial'],
      3,
    );

    vi.spyOn(organizationModulesService, 'enable').mockResolvedValueOnce(mockView);
    const postRes = await request(app)
      .post('/api/organization-modules/social-selling')
      .send({ expectedVersion: 4 });
    expect(postRes.status).toBe(200);
    expect(organizationModulesService.enable).toHaveBeenCalledWith(
      ORG_ID,
      USER_A,
      'social-selling',
      4,
    );

    vi.spyOn(organizationModulesService, 'disable').mockRejectedValueOnce(
      new OrganizationModulesServiceError('Conflito de concorrência CAS', 409),
    );
    const delRes = await request(app).delete('/api/organization-modules/social-selling');
    expect(delRes.status).toBe(409);
    expect(delRes.body.error).toContain('Conflito de concorrência CAS');
  });
});

import { describe, expect, it } from 'vitest';
import type {
  OrganizationModulesRepository,
  OrganizationModulesStoredState,
} from '../../../../src/features/organization-modules/domain/OrganizationModules.js';
import {
  OrganizationModulesService,
  OrganizationModulesServiceError,
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

  it('incrementa version sequencialmente a cada mutação bem-sucedida', async () => {
    const repo = new InMemoryRepo();
    const service = new OrganizationModulesService(repo);

    const initial = await service.get(ORG_ID);
    expect(initial.version).toBe(1);

    const v1 = await service.enable(ORG_ID, USER_A, 'social-selling');
    expect(v1.version).toBe(2);

    const v2 = await service.enable(ORG_ID, USER_A, 'hub-inteligencia');
    expect(v2.version).toBe(3);
  });

  it('rejeita com 409 Conflict se expectedVersion for defasada em relação ao banco', async () => {
    const repo = new InMemoryRepo();
    const service = new OrganizationModulesService(repo);

    // Estado inicial: version = 1
    await service.enable(ORG_ID, USER_A, 'social-selling'); // vira version = 2

    // Admin B tenta atualizar assumindo que ainda está na version 1
    const promise = service.replace(ORG_ID, USER_B, ['crm-comercial', 'social-selling', 'hub-inteligencia'], 1);

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
});

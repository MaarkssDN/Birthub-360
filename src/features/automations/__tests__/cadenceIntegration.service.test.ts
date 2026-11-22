import { beforeEach, describe, expect, it } from 'vitest';
import { createInMemoryCadenceEnrollmentStore } from '../../../../tests/mocks/inMemoryCadenceEnrollmentStore.js';
import { CadenceIntegrationService } from '../cadenceIntegration.service.js';

describe('CadenceIntegrationService (P3.4)', () => {
  let service: CadenceIntegrationService;
  let store: ReturnType<typeof createInMemoryCadenceEnrollmentStore>;

  beforeEach(() => {
    // Store durável fake injetado — prova que enrollments persistem via porta
    // IMultichannelCadenceEnrollmentStore (mesma semântica do PrismaMultichannelCadenceEnrollmentStore:
    // cópias + update explícito), sem exigir Postgres no teste unitário.
    store = createInMemoryCadenceEnrollmentStore();
    service = new CadenceIntegrationService(store);
  });

  it('exige organizationId válido (tenancy check)', async () => {
    await expect(
      service.executeCadenceAction('', 'lead-1', {
        cadenceId: 'cad-1',
        action: 'move_to_step',
        stepIndex: 1,
      }),
    ).rejects.toThrow('Tenancy violation: organizationId obrigatório');
  });

  it('exige leadId válido', async () => {
    await expect(
      service.executeCadenceAction('org-1', '', {
        cadenceId: 'cad-1',
        action: 'move_to_step',
        stepIndex: 1,
      }),
    ).rejects.toThrow('leadId obrigatório para integração com cadência');
  });

  it('move_to_step: matricula e posiciona o lead no passo desejado', async () => {
    const result = await service.executeCadenceAction('org-enterprise', 'lead-alpha', {
      cadenceId: 'default-b2b-cadence',
      action: 'move_to_step',
      stepIndex: 2,
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('move_to_step');
    expect(result.details?.currentStep).toBe(2);

    const enrollment = await store.findByLead('org-enterprise', 'lead-alpha');
    expect(enrollment).toBeDefined();
    expect(enrollment?.currentStep).toBe(2);
  });

  it('pause: pausa a cadência para o lead', async () => {
    // Matricular primeiro
    await service.executeCadenceAction('org-1', 'lead-beta', {
      cadenceId: 'default-b2b-cadence',
      action: 'move_to_step',
      stepIndex: 1,
    });

    const result = await service.executeCadenceAction('org-1', 'lead-beta', {
      cadenceId: 'default-b2b-cadence',
      action: 'pause',
      pauseDays: 5,
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('pause');
    expect(result.details?.pausedDays).toBe(5);

    const enrollment = await store.findByLead('org-1', 'lead-beta');
    expect(enrollment?.status).toBe('paused');
  });

  it('resume: retoma uma cadência pausada', async () => {
    await service.executeCadenceAction('org-1', 'lead-gamma', {
      cadenceId: 'default-b2b-cadence',
      action: 'move_to_step',
      stepIndex: 1,
    });
    await service.executeCadenceAction('org-1', 'lead-gamma', {
      cadenceId: 'default-b2b-cadence',
      action: 'pause',
    });

    const result = await service.executeCadenceAction('org-1', 'lead-gamma', {
      cadenceId: 'default-b2b-cadence',
      action: 'resume',
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('resume');

    const enrollment = await store.findByLead('org-1', 'lead-gamma');
    expect(enrollment?.status).toBe('active');
  });

  it('restart: reinicia a cadência no passo 1', async () => {
    const result = await service.executeCadenceAction('org-1', 'lead-delta', {
      cadenceId: 'default-b2b-cadence',
      action: 'restart',
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('restart');
    expect(result.details?.currentStep).toBe(1);

    const enrollment = await store.findByLead('org-1', 'lead-delta');
    expect(enrollment?.status).toBe('active');
    expect(enrollment?.currentStep).toBe(1);
  });

  it('move_to_step sem stepIndex usa o passo padrão 1', async () => {
    const result = await service.executeCadenceAction('org-1', 'lead-sem-step', {
      cadenceId: 'cad-1',
      action: 'move_to_step',
    });

    expect(result.success).toBe(true);
    expect(result.details?.currentStep).toBe(1);

    const enrollment = await store.findByLead('org-1', 'lead-sem-step');
    expect(enrollment?.currentStep).toBe(1);
  });

  it('pause sem enrollment existente retorna sucesso sem mutação', async () => {
    const result = await service.executeCadenceAction('org-1', 'lead-sem-enrollment', {
      cadenceId: 'cad-1',
      action: 'pause',
      pauseDays: 3,
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('pause');
    expect(result.details?.pausedDays).toBe(3);
    expect(await store.findByLead('org-1', 'lead-sem-enrollment')).toBeUndefined();
  });

  it('resume sem enrollment existente retorna sucesso sem mutação', async () => {
    const result = await service.executeCadenceAction('org-1', 'lead-sem-enrollment', {
      cadenceId: 'cad-1',
      action: 'resume',
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('resume');
    expect(await store.findByLead('org-1', 'lead-sem-enrollment')).toBeUndefined();
  });

  it('ação de cadência não suportada lança erro explícito', async () => {
    await expect(
      service.executeCadenceAction('org-1', 'lead-1', {
        cadenceId: 'cad-1',
        action: 'acao_inexistente' as never,
      }),
    ).rejects.toThrow('não suportada');
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { AdaptiveMultichannelCadenceService } from '../../../src/features/cadence/services/adaptiveMultichannelCadence.service.js';
import { InMemoryOptOutRepository } from '../../../src/features/cadence/infra/InMemoryOptOutRepository.js';
import { createInMemoryCadenceEnrollmentStore } from '../../mocks/inMemoryCadenceEnrollmentStore.js';

describe('AdaptiveMultichannelCadenceService — Evolução 10 (Cadência Multicanal & Opt-Out Unificado)', () => {
  let service: AdaptiveMultichannelCadenceService;
  const orgId = 'org-cadence-tenant-001';

  beforeEach(() => {
    // Store de enrollment e repositório de opt-out injetados: os testes unitários não tocam
    // Postgres — o fake prova a mesma semântica da porta (cópias, update explícito).
    service = new AdaptiveMultichannelCadenceService(
      createInMemoryCadenceEnrollmentStore(),
      new InMemoryOptOutRepository(),
    );
  });

  it('deve matricular lead e avançar passos multicanal com sucesso', async () => {
    const enrollment = await service.enrollLead({
      organizationId: orgId,
      cadenceId: 'default-b2b-cadence',
      leadId: 'lead-multichannel-1',
      contactEmail: 'diretor@logistica.com.br',
      contactPhone: '+5511977776666',
    });

    expect(enrollment.enrollmentId).toBeDefined();
    expect(enrollment.status).toBe('active');
    expect(enrollment.currentStep).toBe(1);

    // Executar Passo 1 (E-mail)
    const step1Result = await service.executeNextStep(enrollment.enrollmentId, orgId);
    expect(step1Result.channel).toBe('email');
    expect(step1Result.success).toBe(true);
    expect(step1Result.suppressedByOptOut).toBe(false);

    // Executar Passo 2 (WhatsApp)
    const step2Result = await service.executeNextStep(enrollment.enrollmentId, orgId);
    expect(step2Result.channel).toBe('whatsapp');
    expect(step2Result.success).toBe(true);
  });

  it('deve persistir avanços de passo via update do store (não mutação de referência)', async () => {
    const enrollment = await service.enrollLead({
      organizationId: orgId,
      cadenceId: 'default-b2b-cadence',
      leadId: 'lead-persistence-check',
      contactEmail: 'ops@persistente.com.br',
      contactPhone: '+5511900000000',
    });

    await service.executeNextStep(enrollment.enrollmentId, orgId);

    const persisted = await service.getEnrollment(orgId, enrollment.enrollmentId);
    expect(persisted?.currentStep).toBe(2);
    expect(persisted?.lastActionAt).toBeDefined();
  });

  it('deve aplicar trava de Opt-Out Unificado cross-channel e suprimir passos subsequentes', async () => {
    const enrollment = await service.enrollLead({
      organizationId: orgId,
      cadenceId: 'default-b2b-cadence',
      leadId: 'lead-optout-target',
      contactEmail: 'gerente@frota-optout.com.br',
      contactPhone: '+5511966665555',
    });

    // Lead pede para sair via WhatsApp (ex: respondeu "SAIR" ou "CANCELAR")
    const optOut = await service.registerOptOutAndHalt({
      organizationId: orgId,
      leadId: 'lead-optout-target',
      channelSource: 'whatsapp',
      reason: 'Cliente enviou palavra-chave de descadastro "SAIR"',
    });

    expect(optOut.halted).toBe(true);
    expect(optOut.channelsSuppressed).toContain('email');
    expect(optOut.channelsSuppressed).toContain('whatsapp');
    expect(optOut.channelsSuppressed).toContain('voice');

    // A matrícula foi marcada como opted_out no store durável
    const persisted = await service.getEnrollment(orgId, enrollment.enrollmentId);
    expect(persisted?.status).toBe('opted_out');

    // Tentativa de executar próximo passo deve ser suprimida
    const nextStep = await service.executeNextStep(enrollment.enrollmentId, orgId);
    expect(nextStep.suppressedByOptOut).toBe(true);
    expect(nextStep.success).toBe(false);
  });

  it('deve rejeitar matrícula sem organizationId (Tenancy Guard)', async () => {
    await expect(
      service.enrollLead({
        organizationId: '',
        cadenceId: 'default-b2b-cadence',
        leadId: 'lead-invalid',
        contactEmail: 'test@invalid.com',
        contactPhone: '123',
      }),
    ).rejects.toThrow(/Tenancy violation/);
  });
});

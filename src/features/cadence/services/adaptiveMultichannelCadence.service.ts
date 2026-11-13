import { randomUUID } from 'node:crypto';
import { logger } from '../../../lib/logger.js';
import { domainEventMesh } from '../../../lib/queue/domainEventMesh.service.js';
import {
  isOptedOut,
  normalizeOptOutSubject,
  recordOptOut,
  type OptOutRepository,
} from '../application/optOutService.js';
import { prismaOptOutRepository } from '../infra/PrismaOptOutRepository.js';
import {
  type CadenceChannel,
  type CadenceStep,
  type IMultichannelCadencePort,
  type IMultichannelCadenceEnrollmentStore,
  type MultichannelCadenceEnrollment,
  type StepDispatchResult,
} from '../../../shared/contracts/multichannelCadence.contract.js';
import { prismaMultichannelCadenceEnrollmentStore } from '../../../shared/infra/PrismaMultichannelCadenceEnrollmentStore.js';

export class AdaptiveMultichannelCadenceService implements IMultichannelCadencePort {
  private cadenceStepsStore = new Map<string, CadenceStep[]>();

  constructor(
    private readonly enrollmentsStore: IMultichannelCadenceEnrollmentStore = prismaMultichannelCadenceEnrollmentStore,
    private readonly optOutRepo: OptOutRepository = prismaOptOutRepository,
  ) {
    // Configurar uma cadência modelo padrão (Passo 1: E-mail -> Passo 2: WhatsApp -> Passo 3: Voz)
    this.cadenceStepsStore.set('default-b2b-cadence', [
      {
        stepNumber: 1,
        channel: 'email',
        action: 'send_email',
        delayHoursAfterPrevious: 0,
        condition: 'always',
      },
      {
        stepNumber: 2,
        channel: 'whatsapp',
        action: 'send_whatsapp',
        delayHoursAfterPrevious: 24,
        condition: 'no_reply',
      },
      {
        stepNumber: 3,
        channel: 'voice',
        action: 'initiate_voice_call',
        delayHoursAfterPrevious: 48,
        condition: 'no_reply',
      },
    ]);
  }

  /**
   * Matricula um lead em uma cadência multicanal.
   */
  async enrollLead(params: {
    organizationId: string;
    cadenceId: string;
    leadId: string;
    contactEmail: string;
    contactPhone: string;
  }): Promise<MultichannelCadenceEnrollment> {
    if (!params.organizationId || params.organizationId.trim() === '') {
      throw new Error('Tenancy violation: organizationId obrigatório para matrícula em cadência');
    }

    const enrollment = await this.enrollmentsStore.enroll({
      organizationId: params.organizationId,
      cadenceId: params.cadenceId,
      leadId: params.leadId,
      contactEmail: params.contactEmail,
      contactPhone: params.contactPhone,
    });

    logger.info(
      `[MultichannelCadence] Lead ${params.leadId} matriculado na cadência ${params.cadenceId} no tenant ${params.organizationId}.`,
    );

    return enrollment;
  }

  /**
   * Executa o próximo passo da cadência, respeitando a trava de opt-out unificado.
   */
  async executeNextStep(enrollmentId: string, organizationId: string): Promise<StepDispatchResult> {
    const enrollment = await this.enrollmentsStore.get(organizationId, enrollmentId);

    if (!enrollment) {
      throw new Error(`Enrollment ${enrollmentId} não encontrado no tenant ${organizationId}`);
    }

    if (enrollment.status === 'opted_out' || enrollment.status === 'completed') {
      return {
        stepNumber: enrollment.currentStep,
        channel: 'email',
        executedAt: new Date().toISOString(),
        success: false,
        suppressedByOptOut: true,
        suppressionReason: `Cadência já finalizada ou suspensa por opt-out prévio (status: ${enrollment.status})`,
      };
    }

    const steps = this.cadenceStepsStore.get(enrollment.cadenceId) || [];
    const step = steps.find((s) => s.stepNumber === enrollment.currentStep);

    if (!step) {
      await this.enrollmentsStore.update(organizationId, enrollmentId, { status: 'completed' });
      return {
        stepNumber: enrollment.currentStep,
        channel: 'email',
        executedAt: new Date().toISOString(),
        success: true,
        suppressedByOptOut: false,
      };
    }

    // Checagem de Opt-Out Cross-Channel (persistente — tabela OptOutRecord, não mais Map volátil)
    const optedOut = await isOptedOut(this.optOutRepo, organizationId, {
      leadId: enrollment.leadId,
    }, step.channel);

    if (optedOut) {
      logger.warn(
        `[MultichannelCadence] Disparo suprimido no canal [${step.channel}] para lead ${enrollment.leadId} por solicitação de opt-out unificado.`,
      );

      await this.enrollmentsStore.update(organizationId, enrollmentId, { status: 'opted_out' });

      await domainEventMesh.publish({
        eventType: 'CROSS_CHANNEL_OPTOUT_ENFORCED',
        eventVersion: '1.0.0',
        organizationId,
        correlationId: `optout-${enrollment.leadId}`,
        producer: 'multichannel-cadence-engine',
        aggregateId: enrollment.leadId,
        payload: {
          leadId: enrollment.leadId,
          channel: step.channel,
          reason: 'Opt-out unificado detectado e aplicado a todos os canais',
        },
      });

      return {
        stepNumber: step.stepNumber,
        channel: step.channel,
        executedAt: new Date().toISOString(),
        success: false,
        suppressedByOptOut: true,
        suppressionReason: `Disparo retido: titular solicitou opt-out cross-channel para o canal ${step.channel}.`,
      };
    }

    // Execução simulada bem-sucedida do passo
    const executedAt = new Date().toISOString();
    await this.enrollmentsStore.update(organizationId, enrollmentId, {
      currentStep: enrollment.currentStep + 1,
      lastActionAt: executedAt,
    });

    logger.info(
      `[MultichannelCadence] Passo ${step.stepNumber} (${step.channel}) executado com sucesso para lead ${enrollment.leadId}.`,
    );

    return {
      stepNumber: step.stepNumber,
      channel: step.channel,
      executedAt,
      success: true,
      suppressedByOptOut: false,
      messageId: `msg-${randomUUID()}`,
    };
  }

  /**
   * Registra opt-out formal e bloqueia imediatamente todos os canais para o lead.
   */
  async registerOptOutAndHalt(params: {
    organizationId: string;
    leadId: string;
    channelSource: CadenceChannel;
    reason: string;
  }): Promise<{ halted: boolean; channelsSuppressed: CadenceChannel[] }> {
    if (!params.organizationId) {
      throw new Error('Tenancy violation: organizationId obrigatório');
    }

    // Regra LGPD / Art. 18: Opt-out em um canal cessa imediatamente todos os canais da organização.
    // Persistido na tabela OptOutRecord (scope 'global') — sobrevive a restart e vale para todos
    // os canais que consultam `isOptedOut`/`assertNotOptedOut`.
    await recordOptOut(this.optOutRepo, {
      organizationId: params.organizationId,
      scope: 'global',
      subject: { leadId: params.leadId },
      originChannel: params.channelSource,
      reason: params.reason,
    });

    // Marcar todas as matrículas do lead no tenant como opted_out (durável).
    await this.enrollmentsStore.updateByLead(params.organizationId, params.leadId, {
      status: 'opted_out',
    });

    await domainEventMesh.publish({
      eventType: 'CROSS_CHANNEL_OPTOUT_ENFORCED',
      eventVersion: '1.0.0',
      organizationId: params.organizationId,
      correlationId: `optout-${params.leadId}`,
      producer: 'multichannel-cadence-engine',
      aggregateId: params.leadId,
      payload: {
        leadId: params.leadId,
        channelSource: params.channelSource,
        reason: params.reason,
      },
    });

    logger.info(
      `[MultichannelCadence] Opt-out cross-channel registrado para lead ${params.leadId} via ${params.channelSource}. Todos os canais bloqueados.`,
    );

    return {
      halted: true,
      channelsSuppressed: ['email', 'whatsapp', 'voice'],
    };
  }

  async getEnrollment(
    organizationId: string,
    enrollmentId: string,
  ): Promise<MultichannelCadenceEnrollment | undefined> {
    return this.enrollmentsStore.get(organizationId, enrollmentId);
  }

  async findEnrollmentByLead(
    organizationId: string,
    leadId: string,
  ): Promise<MultichannelCadenceEnrollment | undefined> {
    return this.enrollmentsStore.findByLead(organizationId, leadId);
  }

  /**
   * `true` se existe QUALQUER OptOutRecord do lead no tenant — equivalente ao antigo
   * `optOutRegistry` volátil, agora consultando a tabela durável `OptOutRecord`.
   */
  async isLeadOptedOut(organizationId: string, leadId: string): Promise<boolean> {
    const matches = await this.optOutRepo.findMatches(
      organizationId,
      normalizeOptOutSubject({ leadId }),
    );
    return matches.length > 0;
  }
}

export const adaptiveMultichannelCadenceService = new AdaptiveMultichannelCadenceService();

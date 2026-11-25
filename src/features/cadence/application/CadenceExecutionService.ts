import { randomUUID } from 'node:crypto';
import { logger } from '../../../lib/logger.js';
import '../../../lib/eventsBus.js';
import {
  type CallWindow,
  DEFAULT_CALL_WINDOW,
  isWithinCallWindow,
} from '../../../shared/policies/coldCall.policy.js';
import type {
  CadenceChannel,
  OptOutRepository,
  OptOutSubject,
} from '../../../shared/domain/optOut.js';
import type { CadenceRateLimitPolicy } from '../domain/rateLimit.js';
import { isOptedOut } from '../../../shared/services/optOutService.js';
import type { LeadSubject, LeadSubjectResolver } from './cadenceService.js';
import { isValidIanaTimeZone } from '../domain/businessWindow.js';
import {
  type CadenceRateLimitPort,
  evaluateRateLimitForUpcomingTouch,
} from './rateLimitService.js';
import type {
  CadenceExecutionPort,
  EnqueueSwarmActionInput,
  EnqueueSwarmActionResult,
  SwarmCadenceChannel,
  SwarmDeliveryNotificationListener,
  SwarmTouchNotification,
} from './CadenceExecutionPort.js';

export interface TaskCreationPort {
  createTask(input: {
    organizationId: string;
    leadId: string;
    title: string;
    observations?: string | null;
    date: Date;
    owner?: string | null;
  }): Promise<{ id: string }>;
}

export interface DispatchChannelResult {
  result: 'delivered' | 'failed' | 'bounced';
  providerMessageId?: string | null;
  error?: string | null;
}

export interface CadenceChannelDispatcherPort {
  dispatchWhatsApp(input: {
    organizationId: string;
    leadId: string;
    phone?: string | null;
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<DispatchChannelResult>;

  dispatchEmail(input: {
    organizationId: string;
    leadId: string;
    email?: string | null;
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<DispatchChannelResult>;

  dispatchVoice(input: {
    organizationId: string;
    leadId: string;
    phone?: string | null;
    agentType?: 'sdr' | 'closer';
    metadata?: Record<string, unknown>;
  }): Promise<DispatchChannelResult>;
}

export interface CadenceExecutionServiceDeps {
  optOutRepo: OptOutRepository;
  subjectResolver: LeadSubjectResolver;
  rateLimitPort?: CadenceRateLimitPort;
  rateLimitPolicy?: CadenceRateLimitPolicy;
  isWithinBusinessWindow?: (now: Date, leadTimeZone?: string | null) => boolean;
  businessWindow?: CallWindow;
  dispatcher?: CadenceChannelDispatcherPort;
  taskPort?: TaskCreationPort;
  notificationListeners?: SwarmDeliveryNotificationListener[];
}

function resolveCallWindowFromEnv(): CallWindow {
  const start = process.env.SDR_CALL_WINDOW_START
    ? Number(process.env.SDR_CALL_WINDOW_START)
    : DEFAULT_CALL_WINDOW.startHour;
  const end = process.env.SDR_CALL_WINDOW_END
    ? Number(process.env.SDR_CALL_WINDOW_END)
    : DEFAULT_CALL_WINDOW.endHour;
  const timeZone = process.env.SDR_CALL_TIMEZONE || DEFAULT_CALL_WINDOW.timeZone;
  return {
    startHour: Number.isFinite(start) ? start : 9,
    endHour: Number.isFinite(end) ? end : 18,
    weekdaysOnly: true,
    timeZone,
  };
}

export class CadenceExecutionService implements CadenceExecutionPort {
  private readonly listeners = new Set<SwarmDeliveryNotificationListener>();

  constructor(private readonly deps: CadenceExecutionServiceDeps) {
    if (deps.notificationListeners) {
      for (const listener of deps.notificationListeners) {
        this.listeners.add(listener);
      }
    }
  }

  isWithinBusinessWindow(now: Date, leadTimeZone?: string | null): boolean {
    if (this.deps.isWithinBusinessWindow) {
      return this.deps.isWithinBusinessWindow(now, leadTimeZone);
    }
    const window = this.deps.businessWindow ?? resolveCallWindowFromEnv();
    // POS4-17-CADENCE-TZ: quando o lead tem fuso resolvido e válido, ele vence o fuso configurado
    // (env/default) — a janela passa a ser a do destinatário, não a do servidor/tenant.
    const effectiveWindow =
      leadTimeZone && isValidIanaTimeZone(leadTimeZone)
        ? { ...window, timeZone: leadTimeZone.trim() }
        : window;
    return isWithinCallWindow(now, effectiveWindow);
  }

  onDeliveryStatus(listener: SwarmDeliveryNotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async notifyDeliveryStatus(notification: SwarmTouchNotification): Promise<void> {
    logger.info(
      {
        actionId: notification.actionId,
        leadId: notification.leadId,
        channel: notification.channel,
        status: notification.status,
        organizationId: notification.organizationId,
      },
      `[CadenceExecutionPort] Notificação de entrega de toque: ${notification.status}`,
    );

    // Dispara para todos os listeners registrados
    for (const listener of this.listeners) {
      try {
        await listener(notification);
      } catch (err) {
        logger.error(
          { err, actionId: notification.actionId },
          '[CadenceExecutionPort] Falha no listener de notificação de toque do Swarm.',
        );
      }
    }
  }

  async enqueueAction(
    input: EnqueueSwarmActionInput,
    options?: { now?: Date; autoExecute?: boolean },
  ): Promise<EnqueueSwarmActionResult> {
    const now = options?.now ?? new Date();
    const actionId = randomUUID();

    // 1. Validar e resolver sujeito de contato para o lead (inclui o fuso do destinatário,
    // usado pela janela comercial por lead — POS4-17-CADENCE-TZ)
    let subject: LeadSubject;
    try {
      subject = await this.deps.subjectResolver.resolve(input.organizationId, input.leadId);
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await this.notifyDeliveryStatus({
        actionId,
        leadId: input.leadId,
        organizationId: input.organizationId,
        channel: input.channel,
        status: 'failed',
        occurredAt: now,
        details: { reason: 'lead-not-found', error: errorMsg },
      });
      return {
        accepted: false,
        actionId,
        status: 'rejected',
        rejectionReason: 'lead-not-found',
        deliveryStatus: 'failed',
        error: errorMsg,
      };
    }

    // 2. Trava de Opt-Out (válida para canais externos)
    if (this.isExternalChannel(input.channel)) {
      const optedOut = await isOptedOut(
        this.deps.optOutRepo,
        input.organizationId,
        subject,
        input.channel as CadenceChannel,
      );

      if (optedOut) {
        await this.notifyDeliveryStatus({
          actionId,
          leadId: input.leadId,
          organizationId: input.organizationId,
          channel: input.channel,
          status: 'failed',
          occurredAt: now,
          details: { reason: 'opted-out' },
        });
        return {
          accepted: false,
          actionId,
          status: 'rejected',
          rejectionReason: 'opted-out',
          deliveryStatus: 'failed',
          error: `Lead ${input.leadId} possui opt-out registrado para o canal ${input.channel} ou globalmente.`,
        };
      }
    }

    // 3. Janela Comercial (válida para canais externos)
    if (this.isExternalChannel(input.channel)) {
      const withinWindow = this.isWithinBusinessWindow(now, subject.timeZone ?? null);
      if (!withinWindow) {
        await this.notifyDeliveryStatus({
          actionId,
          leadId: input.leadId,
          organizationId: input.organizationId,
          channel: input.channel,
          status: 'failed',
          occurredAt: now,
          details: { reason: 'outside-business-window' },
        });
        return {
          accepted: false,
          actionId,
          status: 'rejected',
          rejectionReason: 'outside-business-window',
          deliveryStatus: 'failed',
          error: 'Toque rejeitado: fora da janela comercial configurada.',
        };
      }
    }

    // 4. Rate Limit (válido para canais externos quando porta injetada)
    if (this.isExternalChannel(input.channel) && this.deps.rateLimitPort) {
      const blockReason = await evaluateRateLimitForUpcomingTouch(this.deps.rateLimitPort, {
        organizationId: input.organizationId,
        leadId: input.leadId,
        email: subject.email ?? null,
        channel: input.channel as CadenceChannel,
        now,
        policy: this.deps.rateLimitPolicy,
      });

      if (blockReason) {
        await this.notifyDeliveryStatus({
          actionId,
          leadId: input.leadId,
          organizationId: input.organizationId,
          channel: input.channel,
          status: 'failed',
          occurredAt: now,
          details: { reason: blockReason },
        });
        return {
          accepted: false,
          actionId,
          status: 'rejected',
          rejectionReason: blockReason,
          deliveryStatus: 'failed',
          error: `Toque bloqueado por política de volume da cadência: ${blockReason}.`,
        };
      }
    }

    // 5. Se autoExecute for solicitado, despacha imediatamente
    if (options?.autoExecute) {
      return this.executeDispatchedAction(actionId, input, subject, now);
    }

    // 6. Não há fila persistente de ações do Swarm neste serviço (contrato dormente —
    //    POS3-44-DORMANT-CONTRACTS): nenhum consumidor de produção chama `enqueueAction` e
    //    `src/lib/queue/**` pertence a outro domínio. Retornar `status: 'queued'` aqui seria
    //    sucesso falso — nada seria executado depois. Falhamos explicitamente até que um
    //    consumidor real forneça uma fila de verdade.
    await this.notifyDeliveryStatus({
      actionId,
      leadId: input.leadId,
      organizationId: input.organizationId,
      channel: input.channel,
      status: 'failed',
      occurredAt: now,
      details: { reason: 'queue-unavailable' },
    });
    return {
      accepted: false,
      actionId,
      status: 'rejected',
      rejectionReason: 'queue-unavailable',
      deliveryStatus: 'failed',
      error:
        'Fila persistente de ações do Swarm não implementada: enqueueAction só despacha com autoExecute até que um consumidor forneça uma fila real.',
    };
  }

  async executeAction(
    input: EnqueueSwarmActionInput,
    options?: { now?: Date },
  ): Promise<EnqueueSwarmActionResult> {
    return this.enqueueAction(input, { ...options, autoExecute: true });
  }

  private isExternalChannel(channel: SwarmCadenceChannel): boolean {
    return channel === 'whatsapp' || channel === 'email' || channel === 'voice';
  }

  private async executeDispatchedAction(
    actionId: string,
    input: EnqueueSwarmActionInput,
    subject: OptOutSubject,
    now: Date,
  ): Promise<EnqueueSwarmActionResult> {
    try {
      if (input.channel === 'task') {
        if (!this.deps.taskPort) {
          throw new Error('Porta de criação de tarefas (TaskCreationPort) não configurada.');
        }
        const createdTask = await this.deps.taskPort.createTask({
          organizationId: input.organizationId,
          leadId: input.leadId,
          title: `[Swarm] ${input.metadata.recommendationReason}: ${input.metadata.triggerDetail ?? 'Ação sugerida'}`,
          observations: input.content ?? null,
          date: input.scheduledFor ?? now,
        });

        await this.notifyDeliveryStatus({
          actionId,
          leadId: input.leadId,
          organizationId: input.organizationId,
          channel: 'task',
          status: 'delivered',
          occurredAt: now,
          details: { providerMessageId: createdTask.id, metadata: input.metadata },
        });

        return {
          accepted: true,
          actionId,
          status: 'executed',
          deliveryStatus: 'delivered',
          providerMessageId: createdTask.id,
        };
      }

      if (!this.deps.dispatcher) {
        throw new Error(
          'Dispatcher de canais externos (CadenceChannelDispatcherPort) não configurado.',
        );
      }

      let dispatchOutcome: DispatchChannelResult;

      if (input.channel === 'whatsapp') {
        dispatchOutcome = await this.deps.dispatcher.dispatchWhatsApp({
          organizationId: input.organizationId,
          leadId: input.leadId,
          phone: subject.phoneE164,
          content: input.content ?? '',
          metadata: input.metadata,
        });
      } else if (input.channel === 'email') {
        dispatchOutcome = await this.deps.dispatcher.dispatchEmail({
          organizationId: input.organizationId,
          leadId: input.leadId,
          email: subject.email,
          content: input.content ?? '',
          metadata: input.metadata,
        });
      } else if (input.channel === 'voice') {
        dispatchOutcome = await this.deps.dispatcher.dispatchVoice({
          organizationId: input.organizationId,
          leadId: input.leadId,
          phone: subject.phoneE164,
          agentType: 'sdr',
          metadata: input.metadata,
        });
      } else {
        return {
          accepted: false,
          actionId,
          status: 'rejected',
          rejectionReason: 'unsupported-channel',
          deliveryStatus: 'failed',
          error: `Canal não suportado: ${input.channel}`,
        };
      }

      // Notifica o status real devolvido pelo canal
      await this.notifyDeliveryStatus({
        actionId,
        leadId: input.leadId,
        organizationId: input.organizationId,
        channel: input.channel,
        status: dispatchOutcome.result,
        occurredAt: now,
        details: {
          providerMessageId: dispatchOutcome.providerMessageId,
          error: dispatchOutcome.error,
          metadata: input.metadata,
        },
      });

      return {
        accepted: dispatchOutcome.result === 'delivered',
        actionId,
        status: dispatchOutcome.result === 'delivered' ? 'executed' : 'rejected',
        deliveryStatus: dispatchOutcome.result,
        error: dispatchOutcome.error,
        providerMessageId: dispatchOutcome.providerMessageId,
      };
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await this.notifyDeliveryStatus({
        actionId,
        leadId: input.leadId,
        organizationId: input.organizationId,
        channel: input.channel,
        status: 'failed',
        occurredAt: now,
        details: { error: errorMsg },
      });
      return {
        accepted: false,
        actionId,
        status: 'rejected',
        rejectionReason: 'internal-error',
        deliveryStatus: 'failed',
        error: errorMsg,
      };
    }
  }
}

/**
 * Voice Command Router — pipeline comando falado → autorização → confirmação → commit real
 * Squad 60 — Tito (Comandos de Voz e Ações)
 *
 * Vínculo comando→ferramenta executora (B-07):
 * - interpreta a transcrição (intent.parser);
 * - autoriza o ator por tipo de comando (permission.guard);
 * - exige confirmação ativa e válida para comandos críticos (confirmation.manager);
 * - executa SOMENTE via executor real vinculado — executor ausente ou simulado
 *   produz falha honesta, nunca falso positivo.
 */

import { randomUUID } from 'node:crypto';
import { logger } from '../../../lib/logger.js';
import {
  executeVoiceCommandWithCommit,
  type DatabaseMutationRunner,
  type VoiceCommandExecutionResult,
  type VoiceCommandPayload,
  type VoiceCommandType,
} from './command.processor.js';
import { VoiceCommandConfirmationManager } from './confirmation.manager.js';
import { parseVoiceTranscript } from './intent.parser.js';
import {
  authorizeVoiceCommand,
  type VoiceCommandActor,
} from './permission.guard.js';

/** Comandos que exigem confirmação ativa do usuário antes de executar (B-07). */
export const CRITICAL_VOICE_COMMANDS: ReadonlySet<VoiceCommandType> = new Set([
  'update_deal_stage',
  'schedule_meeting',
  'generic_action',
]);

export type VoiceCommandRouterStatus =
  | 'executed'
  | 'failed'
  | 'needs_confirmation'
  | 'confirmation_cancelled'
  | 'confirmation_expired'
  | 'confirmation_denied'
  | 'denied'
  | 'ambiguous'
  | 'incomplete'
  | 'unrecognized'
  | 'executor_not_bound';

export interface VoiceCommandRouterResult {
  status: VoiceCommandRouterStatus;
  commandId?: string;
  type?: VoiceCommandType;
  organizationId: string;
  /** Resultado do commit real quando status === 'executed' | 'failed' */
  execution?: VoiceCommandExecutionResult;
  confirmationId?: string;
  expiresAt?: string;
  reason?: string;
  candidates?: VoiceCommandType[];
  missingSlots?: string[];
}

export interface VoiceCommandRequest {
  transcript: string;
  actor: VoiceCommandActor;
  commandId?: string;
  /**
   * Decisão do usuário sobre uma confirmação pendente.
   * Quando presente, o transcript é irrelevante: o comando pendente original
   * é o que será executado (ou cancelado).
   * 'confirm' consome o token (uso único) e executa.
   * 'cancel' descarta sem executar.
   */
  confirmation?: { confirmationId: string; decision: 'confirm' | 'cancel' };
}

export type VoiceCommandExecutorRegistry = Partial<
  Record<VoiceCommandType, DatabaseMutationRunner>
>;

export interface VoiceCommandRouterOptions {
  executors: VoiceCommandExecutorRegistry;
  confirmations?: VoiceCommandConfirmationManager;
}

function baseResult(
  status: VoiceCommandRouterStatus,
  organizationId: string,
  extra?: Partial<VoiceCommandRouterResult>,
): VoiceCommandRouterResult {
  return { status, organizationId, ...extra };
}

function resolveExecutor(
  executors: VoiceCommandExecutorRegistry,
  type: VoiceCommandType,
  organizationId: string,
):
  | { ok: true; executor: DatabaseMutationRunner }
  | { ok: false; failure: VoiceCommandRouterResult } {
  const executor = executors[type];
  if (!executor) {
    logger.error(
      { type, organizationId },
      'VoiceHub: nenhum executor real vinculado para o comando de voz',
    );
    return {
      ok: false,
      failure: baseResult('executor_not_bound', organizationId, {
        type,
        reason: `Nenhum executor real configurado para o comando '${type}'.`,
      }),
    };
  }
  return { ok: true, executor };
}

async function runExecution(
  command: VoiceCommandPayload,
  executor: DatabaseMutationRunner,
  organizationId: string,
): Promise<VoiceCommandRouterResult> {
  const execution = await executeVoiceCommandWithCommit(command, executor);
  return {
    status: execution.success ? 'executed' : 'failed',
    commandId: command.commandId,
    type: command.type,
    organizationId,
    execution,
  };
}

export function createVoiceCommandRouter(options: VoiceCommandRouterOptions) {
  const confirmations =
    options.confirmations ?? new VoiceCommandConfirmationManager();

  /**
   * Resolve uma decisão de confirmação (confirm/cancel) sem depender do
   * transcript falado — o comando pendente original é o alvo da decisão.
   */
  async function resolveConfirmation(
    request: VoiceCommandRequest,
  ): Promise<VoiceCommandRouterResult | undefined> {
    const decision = request.confirmation;
    if (!decision) return undefined;

    const { actor } = request;

    if (decision.decision === 'cancel') {
      confirmations.cancel(decision.confirmationId);
      return baseResult('confirmation_cancelled', actor.organizationId, {
        confirmationId: decision.confirmationId,
        reason: 'Confirmação cancelada pelo usuário. Nenhuma ação foi executada.',
      });
    }

    const consumed = confirmations.consume(decision.confirmationId); // uso único

    if (consumed.status === 'not_found') {
      return baseResult('confirmation_expired', actor.organizationId, {
        confirmationId: decision.confirmationId,
        reason: 'Confirmação inexistente ou já utilizada. Execução bloqueada.',
      });
    }
    if (consumed.status === 'expired') {
      return baseResult('confirmation_expired', actor.organizationId, {
        type: consumed.pending.command.type,
        confirmationId: decision.confirmationId,
        reason: 'Confirmação expirada. Refaça o comando para gerar nova confirmação.',
      });
    }

    const pendingCommand = consumed.pending.command;

    // Tenancy binding (revisão Silas A2): a confirmação só pode ser usada por
    // um ator do MESMO tenant E do MESMO usuário que originou o comando.
    // Sem isso, um confirmationId válido poderia disparar mutação em outro tenant.
    if (pendingCommand.organizationId !== actor.organizationId) {
      logger.warn(
        {
          commandId: pendingCommand.commandId,
          type: pendingCommand.type,
          confirmationId: decision.confirmationId,
          pendingOrganizationId: pendingCommand.organizationId,
          actorOrganizationId: actor.organizationId,
        },
        'VoiceHub [B-07]: confirmação rejeitada — organização do ator difere da organização criadora',
      );
      return baseResult('confirmation_denied', actor.organizationId, {
        commandId: pendingCommand.commandId,
        type: pendingCommand.type,
        confirmationId: decision.confirmationId,
        reason: 'Confirmação não pertence à organização do ator. Execução bloqueada.',
      });
    }

    if (pendingCommand.userId !== actor.userId) {
      logger.warn(
        {
          commandId: pendingCommand.commandId,
          type: pendingCommand.type,
          confirmationId: decision.confirmationId,
          pendingUserId: pendingCommand.userId,
          actorUserId: actor.userId,
        },
        'VoiceHub [B-07]: confirmação rejeitada — usuário do ator difere do usuário criador',
      );
      return baseResult('confirmation_denied', actor.organizationId, {
        commandId: pendingCommand.commandId,
        type: pendingCommand.type,
        confirmationId: decision.confirmationId,
        reason: 'Confirmação emitida para outro usuário. Somente o criador do comando pode confirmá-lo.',
      });
    }

    // Autorização revalidada no momento da confirmação (ator/papel podem ter mudado).
    const authorization = authorizeVoiceCommand(actor, pendingCommand.type);
    if (!authorization.allowed) {
      logger.warn(
        { commandId: pendingCommand.commandId, type: pendingCommand.type, userId: actor.userId },
        'VoiceHub: confirmação de comando crítico negada por autorização',
      );
      return baseResult('confirmation_denied', actor.organizationId, {
        commandId: pendingCommand.commandId,
        type: pendingCommand.type,
        confirmationId: decision.confirmationId,
        reason: authorization.reason,
      });
    }

    const bound = resolveExecutor(options.executors, pendingCommand.type, actor.organizationId);
    if (!bound.ok) {
      return { ...bound.failure, confirmationId: decision.confirmationId };
    }

    logger.info(
      { commandId: pendingCommand.commandId, type: pendingCommand.type, confirmationId: decision.confirmationId },
      'VoiceHub [B-07]: confirmação ativa válida — executando comando crítico',
    );

    return runExecution(pendingCommand, bound.executor, actor.organizationId);
  }

  async function processVoiceCommand(
    request: VoiceCommandRequest,
  ): Promise<VoiceCommandRouterResult> {
    const { actor } = request;

    // 0. Decisão de confirmação tem precedência sobre qualquer transcript.
    const confirmationResult = await resolveConfirmation(request);
    if (confirmationResult) return confirmationResult;

    // 1. Interpretação da intenção — nunca executa nada por si só.
    const parsed = parseVoiceTranscript(request.transcript);

    if (parsed.status === 'unrecognized') {
      return baseResult('unrecognized', actor.organizationId, {
        reason: parsed.reason,
      });
    }
    if (parsed.status === 'ambiguous') {
      return baseResult('ambiguous', actor.organizationId, {
        candidates: parsed.candidates,
        reason: parsed.reason,
      });
    }
    if (parsed.status === 'incomplete' || !parsed.intent) {
      return baseResult('incomplete', actor.organizationId, {
        type: parsed.intent?.type,
        missingSlots: parsed.missingSlots,
        reason: parsed.reason,
      });
    }

    const { type, parameters } = parsed.intent;
    const commandId = request.commandId ?? randomUUID();

    // 2. Autorização por comando — nunca enfraquecer.
    const authorization = authorizeVoiceCommand(actor, type);
    if (!authorization.allowed) {
      logger.warn(
        { commandId, type, userId: actor.userId, organizationId: actor.organizationId },
        'VoiceHub: comando de voz negado por autorização',
      );
      return baseResult('denied', actor.organizationId, {
        commandId,
        type,
        reason: authorization.reason,
      });
    }

    const command: VoiceCommandPayload = {
      commandId,
      type,
      organizationId: actor.organizationId,
      userId: actor.userId,
      parameters,
    };

    // 3. Vínculo comando→executor: ausência de executor real é falha honesta.
    const bound = resolveExecutor(options.executors, type, actor.organizationId);
    if (!bound.ok) {
      return { ...bound.failure, commandId };
    }

    // 4. Confirmação ativa para comandos críticos.
    if (CRITICAL_VOICE_COMMANDS.has(type)) {
      const pending = confirmations.create(command);
      logger.info(
        { commandId, type, confirmationId: pending.confirmationId, organizationId: actor.organizationId },
        'VoiceHub [B-07]: comando crítico aguardando confirmação ativa do usuário',
      );
      return baseResult('needs_confirmation', actor.organizationId, {
        commandId,
        type,
        confirmationId: pending.confirmationId,
        expiresAt: pending.expiresAt,
        reason: `Ação crítica '${type}' requer confirmação explícita do usuário antes de executar.`,
      });
    }

    // 5. Comandos não críticos executam diretamente — resposta só após commit real.
    return runExecution(command, bound.executor, actor.organizationId);
  }

  return { processVoiceCommand, confirmations };
}

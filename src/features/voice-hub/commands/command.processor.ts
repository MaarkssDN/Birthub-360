/**
 * Voice Command Execution & Transactional Commit Processor
 * Bloqueador B-07: Comprovar execução de comandos de voz — resposta positiva só após commit no banco.
 * Squad 60 — Tito (Comandos de Voz e Ações)
 */

import { randomUUID } from 'node:crypto';
import { logger } from '../../../lib/logger.js';

export type VoiceCommandType =
  | 'create_lead'
  | 'update_deal_stage'
  | 'schedule_meeting'
  | 'log_activity'
  | 'generic_action';

export interface VoiceCommandPayload {
  commandId?: string;
  type: VoiceCommandType;
  organizationId: string;
  userId: string;
  parameters: Record<string, unknown>;
}

export interface VoiceCommandExecutionResult {
  commandId: string;
  type: VoiceCommandType;
  organizationId: string;
  success: boolean;
  confirmed: boolean;
  committedAt?: string;
  data?: unknown;
  error?: string;
}

export class VoiceCommandCommitError extends Error {
  public readonly commandId: string;
  public readonly commandType: VoiceCommandType;

  constructor(commandId: string, commandType: VoiceCommandType, causeMessage: string) {
    super(`Falha ao persistir comando de voz '${commandType}' no banco de dados: ${causeMessage}`);
    this.name = 'VoiceCommandCommitError';
    this.commandId = commandId;
    this.commandType = commandType;
  }
}

export interface DatabaseMutationRunner {
  mutate(organizationId: string, command: VoiceCommandPayload): Promise<unknown>;
}

/**
 * Processador central de comandos de voz com garantia de confirmação atômica pós-commit.
 * REGRA INVIOLÁVEL: A UI/Voz NUNCA receberá confirmed: true se a mutação no banco falhar ou for revertida.
 */
export async function executeVoiceCommandWithCommit(
  command: VoiceCommandPayload,
  dbRunner: DatabaseMutationRunner,
): Promise<VoiceCommandExecutionResult> {
  const commandId = command.commandId ?? randomUUID();

  logger.info(
    { commandId, type: command.type, organizationId: command.organizationId, userId: command.userId },
    'VoiceHub: iniciando processamento transacional de comando de voz',
  );

  try {
    // Executa a mutação persistente no banco de dados
    const mutationResult = await dbRunner.mutate(command.organizationId, command);

    const committedAt = new Date().toISOString();

    logger.info(
      { commandId, type: command.type, organizationId: command.organizationId, committedAt },
      'VoiceHub [B-07]: comando de voz persistido no banco com sucesso. Emitindo confirmação positiva.',
    );

    return {
      commandId,
      type: command.type,
      organizationId: command.organizationId,
      success: true,
      confirmed: true,
      committedAt,
      data: mutationResult,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    logger.error(
      { err, commandId, type: command.type, organizationId: command.organizationId },
      'VoiceHub [B-07]: falha no commit do banco. Confirmação POSITIVA BLOQUEADA para prevenir estado fantasma.',
    );

    return {
      commandId,
      type: command.type,
      organizationId: command.organizationId,
      success: false,
      confirmed: false,
      error: errorMessage,
    };
  }
}

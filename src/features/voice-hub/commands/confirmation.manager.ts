/**
 * Voice Command Confirmation Manager
 * Squad 60 — Tito (Comandos de Voz e Ações)
 *
 * Confirmação ativa obrigatória (B-07) para comandos críticos:
 * - confirmação tem TTL e expira;
 * - token é de uso único (consume remove);
 * - cancelamento explícito não executa nada;
 * - confirmação expirada/inexistente NUNCA executa.
 */

import type { VoiceCommandPayload } from './command.processor.js';

export interface PendingVoiceConfirmation {
  confirmationId: string;
  command: VoiceCommandPayload;
  createdAt: string;
  expiresAt: string;
}

export type ConfirmationConsumeResult =
  | { status: 'found'; pending: PendingVoiceConfirmation }
  | { status: 'not_found' }
  | { status: 'expired'; pending: PendingVoiceConfirmation };

export class VoiceCommandConfirmationManager {
  private readonly pending = new Map<string, PendingVoiceConfirmation>();
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(options?: { ttlMs?: number; now?: () => number }) {
    this.ttlMs = options?.ttlMs ?? 120_000; // 2 minutos de janela de confirmação
    this.now = options?.now ?? Date.now;
  }

  create(command: VoiceCommandPayload): PendingVoiceConfirmation {
    const confirmationId = `vconf-${command.commandId ?? this.now().toString(36)}`;
    const createdAt = new Date(this.now()).toISOString();
    const pending: PendingVoiceConfirmation = {
      confirmationId,
      command,
      createdAt,
      expiresAt: new Date(this.now() + this.ttlMs).toISOString(),
    };
    this.pending.set(confirmationId, pending);
    return pending;
  }

  /**
   * Consome (uso único) uma confirmação. Remove do mapa em qualquer desfecho
   * para garantir execução única — tokens expirados são descartados.
   */
  consume(confirmationId: string): ConfirmationConsumeResult {
    const pending = this.pending.get(confirmationId);
    if (!pending) {
      return { status: 'not_found' };
    }

    this.pending.delete(confirmationId); // uso único: nunca reutilizável

    if (new Date(pending.expiresAt).getTime() <= this.now()) {
      return { status: 'expired', pending };
    }

    return { status: 'found', pending };
  }

  /** Cancelamento explícito: descarta sem executar. */
  cancel(confirmationId: string): boolean {
    return this.pending.delete(confirmationId);
  }

  /** Inspeção somente-leitura (não consome). */
  peek(confirmationId: string): PendingVoiceConfirmation | undefined {
    const pending = this.pending.get(confirmationId);
    if (!pending) return undefined;
    if (new Date(pending.expiresAt).getTime() <= this.now()) {
      this.pending.delete(confirmationId);
      return undefined;
    }
    return pending;
  }

  get size(): number {
    return this.pending.size;
  }
}

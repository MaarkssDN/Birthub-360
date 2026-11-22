/**
 * Porta de execução e orquestração de toques para o Enxame Comercial Autônomo.
 *
 * Handoff bloqueador: .agents/handoffs/onda-15/13-para-17-disparo-cadencia-enxame.md
 * Dono: Agente 17 (Cadência Multicanal e Ciclo de Receita).
 *
 * Responsabilidades:
 * 1. Ponto único de entrada para o Swarm despachar ações de contato com metadados de contexto
 *    (motivo da recomendação, score, tenantId, papel do agente).
 * 2. Validação rigorosa de políticas comerciais antes do envio:
 *    - Opt-out unificado (global ou por canal) via OptOutRepository.
 *    - Janela comercial permitida (SDR_CALL_WINDOW_START / END / TIMEZONE) via coldCall.policy.
 *    - Rate limits por organização/contato/domínio e channel-spacing via rateLimitService.
 * 3. Suporte aos canais do Swarm: WhatsApp, E-mail, SDR Voice e Tarefa interna no CRM.
 * 4. Notificação bidirecional de status de entrega do toque ('delivered', 'bounced', 'replied', 'failed').
 */

import type { CadenceChannel } from '../domain/optOut.js';
import type { RateLimitBlockReason } from '../domain/rateLimit.js';

/**
 * Canais suportados para ações orquestradas entre o Swarm e a Cadência.
 * Além dos três canais externos reais de Cadência ('whatsapp', 'email', 'voice'),
 * inclui 'task' para tarefas internas geradas no CRM.
 */
export type SwarmCadenceChannel = CadenceChannel | 'task';

/**
 * Status de entrega do toque notificados de volta para o Swarm:
 * - 'delivered': toque entregue com sucesso (e-mail enviado, whatsapp entregue, chamada iniciada, tarefa registrada)
 * - 'bounced': falha de entrega por endereço/telefone inexistente ou rejeitado pelo provedor
 * - 'replied': lead respondeu ao contato (resposta detectada no canal)
 * - 'failed': falha técnica, bloqueio de segurança, rate limit ou recusa fora da janela comercial
 */
export type SwarmDeliveryStatus = 'delivered' | 'bounced' | 'replied' | 'failed';

/**
 * Motivos de rejeição antes do disparo.
 */
export type SwarmRejectionReason =
  | 'outside-business-window'
  | 'opted-out'
  | RateLimitBlockReason
  | 'lead-not-found'
  | 'missing-contact-info'
  | 'unsupported-channel'
  | 'internal-error';

/**
 * Metadados de contexto que acompanham toda ação do Swarm.
 */
export interface SwarmActionMetadata {
  recommendationReason: string;
  score?: number | null;
  agentRole?: string;
  triggerDetail?: string;
  correlationId?: string;
  [key: string]: unknown;
}

/**
 * Payload de entrada para enfileirar uma ação a partir do Swarm.
 */
export interface EnqueueSwarmActionInput {
  organizationId: string;
  leadId: string;
  channel: SwarmCadenceChannel;
  /** Conteúdo ou template da mensagem, roteiro de voz, ou descrição da tarefa */
  content?: string;
  /** Data solicitada para o toque (opcional) */
  scheduledFor?: Date;
  /** Metadados de contexto do Swarm */
  metadata: SwarmActionMetadata;
}

/**
 * Resultado do enfileiramento ou tentativa de despacho da ação.
 */
export interface EnqueueSwarmActionResult {
  accepted: boolean;
  actionId: string;
  status: 'queued' | 'executed' | 'rejected';
  rejectionReason?: SwarmRejectionReason;
  deliveryStatus?: SwarmDeliveryStatus;
  nextEligibleAt?: Date;
  error?: string | null;
  providerMessageId?: string | null;
}

/**
 * Evento de notificação de status de entrega de um toque para o Swarm.
 */
export interface SwarmTouchNotification {
  actionId: string;
  leadId: string;
  organizationId: string;
  channel: SwarmCadenceChannel;
  status: SwarmDeliveryStatus;
  occurredAt: Date;
  details?: {
    reason?: string | null;
    error?: string | null;
    providerMessageId?: string | null;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Listener para receber notificações de status de entrega.
 */
export type SwarmDeliveryNotificationListener = (
  notification: SwarmTouchNotification,
) => Promise<void> | void;

/**
 * Interface principal do serviço / porta de execução da Cadência para o Enxame.
 */
export interface CadenceExecutionPort {
  /**
   * Enfileira uma ação de contato para um lead, aplicando as travas de opt-out, janela comercial
   * e rate limit. Se options.autoExecute for true e a ação for elegível, executa imediatamente.
   */
  enqueueAction(
    input: EnqueueSwarmActionInput,
    options?: { now?: Date; autoExecute?: boolean },
  ): Promise<EnqueueSwarmActionResult>;

  /**
   * Executa diretamente a ação de contato se todas as políticas e janelas comerciais permitirem.
   */
  executeAction(
    input: EnqueueSwarmActionInput,
    options?: { now?: Date },
  ): Promise<EnqueueSwarmActionResult>;

  /**
   * Notifica os inscritos (Swarm, observabilidade, audit logs) sobre o status de entrega de um toque.
   */
  notifyDeliveryStatus(notification: SwarmTouchNotification): Promise<void>;

  /**
   * Registra um listener para eventos de entrega de toques.
   * Retorna uma função de desinscrição (cleanup).
   */
  onDeliveryStatus(listener: SwarmDeliveryNotificationListener): () => void;

  /**
   * Valida se a data/hora fornecida está dentro da janela comercial permitida.
   */
  isWithinBusinessWindow(now: Date): boolean;
}

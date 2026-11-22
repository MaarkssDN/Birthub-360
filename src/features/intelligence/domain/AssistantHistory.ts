/**
 * Tipos de domínio e Porta (Repository) para Histórico de Mensagens do Assistente (Chatbook)
 * (Estilo B — Porta leve com injeção explícita, sem container de DI)
 */

import type { PlaybookKey } from '../../../config/playbooks.js';

export interface AssistantHistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  brand: PlaybookKey;
  createdAt: Date;
}

export interface CreateAssistantMessageInput {
  organizationId: string;
  userId: string;
  brand: PlaybookKey;
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantHistoryRepository {
  listRecent(
    organizationId: string,
    userId: string,
    brand: PlaybookKey,
    limit?: number,
  ): Promise<AssistantHistoryMessage[]>;

  appendTurn(
    organizationId: string,
    userId: string,
    brand: PlaybookKey,
    userText: string,
    assistantText: string,
  ): Promise<void>;
}

/**
 * Tipos de domínio e Porta (Repository) para Guardrails de IA e Telemetria de Redação de PII
 * (Estilo B — Porta leve com injeção explícita, sem container de DI)
 */

export interface GuardrailEventEntity {
  id: string;
  type: string;
  source: string;
  organizationId: string;
  createdAt?: Date;
}

export interface CreateGuardrailEventData {
  type: string;
  source: string;
  organizationId: string;
}

export interface GuardrailRepository {
  recordEvent(data: CreateGuardrailEventData): Promise<GuardrailEventEntity | null>;
}

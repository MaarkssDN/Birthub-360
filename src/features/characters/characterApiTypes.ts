import type { CharacterDefinition, CharacterLayer, CharacterState } from './characterCatalog.js';
import type { CharacterAgentKind, CharacterDispatch } from './characterRuntime.js';

/**
 * Contrato do endpoint `GET /api/agent/characters` — personagem do catálogo
 * canônico + vínculo de runtime derivado de registros reais.
 */

export interface CharacterRuntimePayload {
  kind: CharacterAgentKind;
  status: 'available' | 'degraded' | 'unavailable';
  reason: string | null;
  httpRoute: string | null;
  capabilities: string[];
  requiresApproval: boolean;
  risk: string | null;
  dispatch: CharacterDispatch;
}

export interface CharacterApiEntry extends CharacterDefinition {
  runtime: CharacterRuntimePayload;
}

export interface CharactersApiResponse {
  characters: CharacterApiEntry[];
  swarm: {
    concurrency: { maxConcurrent: number; active: number; waiting: number };
    circuitBreaker: { state: string } | null;
  };
  generatedAt: string;
}

export interface SwarmAuditLogEntry {
  id: string;
  agentType: string;
  action: string;
  result: 'success' | 'error';
  sessionId?: string;
  correlationId?: string;
  errorMessage?: string;
  createdAt: string;
}

export type { CharacterLayer, CharacterState };

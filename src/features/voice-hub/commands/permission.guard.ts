/**
 * Voice Command Authorization Guard
 * Squad 60 — Tito (Comandos de Voz e Ações)
 *
 * Autorização por comando: cada tipo de comando exige um papel mínimo do ator.
 * NUNCA enfraquecer permissões — 'viewer' não executa mutações de voz.
 */

import type { VoiceCommandType } from './command.processor.js';

export type VoiceActorRole = 'viewer' | 'agent' | 'manager' | 'admin';

export interface VoiceCommandActor {
  userId: string;
  organizationId: string;
  role: VoiceActorRole;
}

export interface VoiceAuthorizationResult {
  allowed: boolean;
  reason?: string;
}

const ROLE_RANK: Record<VoiceActorRole, number> = {
  viewer: 0,
  agent: 1,
  manager: 2,
  admin: 3,
};

/** Papel mínimo exigido por tipo de comando de voz. */
const MINIMUM_ROLE: Record<VoiceCommandType, VoiceActorRole> = {
  create_lead: 'agent',
  log_activity: 'agent',
  schedule_meeting: 'agent',
  update_deal_stage: 'manager',
  generic_action: 'admin',
};

/**
 * Autoriza (ou nega) a execução de um comando de voz para o ator informado.
 * Negação é sempre explícita e honesta — nunca silenciosa.
 */
export function authorizeVoiceCommand(
  actor: VoiceCommandActor,
  commandType: VoiceCommandType,
): VoiceAuthorizationResult {
  const required = MINIMUM_ROLE[commandType];

  if (ROLE_RANK[actor.role] >= ROLE_RANK[required]) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Permissão negada: comando '${commandType}' exige papel '${required}' ou superior; ator possui '${actor.role}'.`,
  };
}

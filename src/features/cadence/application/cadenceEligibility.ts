import type { CadenceChannel } from '../domain/cadence.js';
import type { OptOutRepository } from '../domain/optOut.js';
import type { LeadSubjectResolver } from './cadenceService.js';
import { isOptedOut } from './optOutService.js';

/**
 * TAREFA-SANEAMENTO-035 / BT360-DT-0080 — verificação em lote de opt-out no momento do início da
 * cadência (`POST /api/cadence/runs`).
 *
 * Antes desta função, a rota só consultava opt-out quando o lead tinha `contactId` e apenas para
 * o PRIMEIRO canal da sequência (`checkOptOutStatus` em `cadence.routes.ts`). Leads sem contato
 * vinculado entravam na fila do `cadence-run-scanner` sem nenhuma trava, e um opt-out restrito a
 * um canal posterior da sequência (ex.: `voice` num run cujo primeiro toque é `email`) só era
 * descoberto quando o worker chegasse naquele toque — gerando runs condenados desde o início,
 * sobrecarga de fila e relatórios de cadência com leads inelegíveis.
 *
 * Esta função resolve o sujeito do lead UMA vez (leadId + e-mail + telefone via contato) e
 * consulta o registro unificado `OptOutRecord` para CADA canal distinto presente na sequência —
 * `scope: 'global'` bloqueia qualquer canal; `scope` de canal só bloqueia se aquele canal estiver
 * na régua. Canais da sequência sem opt-out correspondente não bloqueiam (opt-out é por canal,
 * não veto total — ver `scopeBlocksChannel` em `shared/domain/optOut.ts`).
 *
 * Erros de resolução/consulta propagam para o chamador (a rota devolve 500 via errorHandler) —
 * sem fallback que trataria falha de banco como "lead elegível" (AGENTS.md §30/§32).
 */

export interface CadenceStartEligibilityDeps {
  optOutRepo: OptOutRepository;
  subjectResolver: LeadSubjectResolver;
}

export interface CadenceStartEligibilityResult {
  eligible: boolean;
  /** Canal da sequência que motivou o bloqueio, quando `eligible === false`. */
  blockedChannel: CadenceChannel | null;
  /** Motivo legível para o operador — nunca usado para decidir, só para resposta/log. */
  reason: string | null;
}

export async function checkCadenceStartEligibility(
  deps: CadenceStartEligibilityDeps,
  organizationId: string,
  leadId: string,
  channels: readonly CadenceChannel[],
): Promise<CadenceStartEligibilityResult> {
  const subject = await deps.subjectResolver.resolve(organizationId, leadId);

  // `Set` remove canais repetidos — uma sequência email→email→voice consulta 2 canais, não 3.
  for (const channel of new Set(channels)) {
    if (await isOptedOut(deps.optOutRepo, organizationId, subject, channel)) {
      return {
        eligible: false,
        blockedChannel: channel,
        reason: `Opt-out unificado registrado para o canal '${channel}' (ou global) casa com um identificador deste lead.`,
      };
    }
  }

  return { eligible: true, blockedChannel: null, reason: null };
}

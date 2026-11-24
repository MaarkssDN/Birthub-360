/**
 * STT → Voice Command Adapter
 * POS4-64-STT-WIRE — Agente 64 (Tito)
 *
 * Último quilômetro do pipeline B-07: recebe o resultado FINAL de uma transcrição
 * STT (Web Speech API, Whisper, serviço realtime — contrato tolerante a variações)
 * e o conecta ao `createVoiceCommandRouter` da Onda 4, preservando TODOS os
 * contratos aprovados: isolamento por tenant, autorização por comando,
 * confirmação ativa com TTL/uso único, expiração e distinção execução real vs
 * simulação.
 *
 * REGRAS INVIOLÁVEIS DESTE ADAPTER:
 * 1. Actor context (organizationId/userId/role) vem EXCLUSIVAMENTE da sessão
 *    autenticada resolvida no servidor — NUNCA do payload do cliente/STT.
 *    Campos organizationId/userId presentes no evento STT são ignorados;
 *    divergência com a sessão gera WARN de auditoria, nunca troca de tenant.
 * 2. Resultado STT não-final (interino) ou transcrição vazia NUNCA executa —
 *    resposta honesta, sem tocar em parser/autorização/executor.
 * 3. Sem executor real vinculado → `executor_not_bound` (falha honesta).
 * 4. Nenhuma ação externa real (Bitrix, Google Calendar, WhatsApp) é disparada
 *    por este adapter — apenas mutações de banco via executores vinculados.
 *
 * CONTRATO STT (Agente 63 — `transcription/sttTranscript.contract.ts`, branch
 * `agente/63-stt-pos4`; integração de branches pendente):
 *   SttTranscriptEvent { sessionId, organizationId, userId, transcript,
 *     isFinal, speaker?, confidence?, startSec?, endSec? }
 * Mapeamento: este adapter NÃO importa o módulo do 63 (branch separada) — o
 * `stt` de entrada aceita o shape canônico `SttTranscriptEvent` diretamente
 * (transcript + isFinal) e, por tolerância, também `text`, `finalTranscript`,
 * `results[]` (Web Speech API) e `segments[]` (Whisper batch). Quando o merge
 * das branches acontecer, o chamador pode continuar passando o evento canônico
 * sem alteração — `extractSttTranscript` já o reconhece.
 *
 * DIFERENÇA DE TENANCY (decisão deliberada, documentada no handoff 64→00):
 * o contrato do 63 carrega organizationId/userId NO evento (populados a partir
 * do contexto autenticado da sessão pelo emissor). Este adapter IGNORA esses
 * campos para autorização e usa EXCLUSIVAMENTE o `session` resolvido no
 * servidor — divergência gera WARN de auditoria. Defesa em profundidade:
 * mesmo um evento STT malformado não consegue trocar de tenant.
 */

import { logger } from '../../../lib/logger.js';
import { container } from '../../../shared/di/container.js';
import type {
  VoiceCommandExecutionResult,
  VoiceCommandPayload,
  VoiceCommandType,
} from './command.processor.js';
import type { VoiceCommandConfirmationManager } from './confirmation.manager.js';
import type { VoiceActorRole, VoiceCommandActor } from './permission.guard.js';
import {
  createVoiceCommandRouter,
  type VoiceCommandExecutorRegistry,
  type VoiceCommandRouterStatus,
} from './voice-command-router.js';

// ---------------------------------------------------------------------------
// 1. Contrato STT tolerante e extração do transcript final
// ---------------------------------------------------------------------------

/**
 * Evento de transcrição STT — forma canônica esperada + aliases tolerados.
 * Campos de tenancy (organizationId/userId) podem existir no payload de origem,
 * mas são ESTRITAMENTE ignorados para autorização (ver cabeçalho, regra 1).
 */
export interface SttTranscriptEvent {
  transcript?: unknown;
  text?: unknown;
  finalTranscript?: unknown;
  isFinal?: unknown;
  final?: unknown;
  sessionId?: unknown;
  organizationId?: unknown;
  userId?: unknown;
  /** Web Speech API: `event.results` — array-like de {0:{transcript}, isFinal}. */
  results?: unknown;
  /** Whisper: `segments: [{start,end,text}]`. */
  segments?: unknown;
  confidence?: unknown;
  [key: string]: unknown;
}

export type SttTranscriptExtraction =
  | { kind: 'final'; transcript: string }
  | { kind: 'interim' }
  | { kind: 'empty' };

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function finalizeTranscript(raw: string): SttTranscriptExtraction {
  const transcript = raw.trim();
  if (!transcript) return { kind: 'empty' };
  return { kind: 'final', transcript };
}

interface SpeechResultLikeItem {
  transcript?: unknown;
  text?: unknown;
  isFinal?: unknown;
  0?: { transcript?: unknown; text?: unknown };
}

/**
 * Extrai o texto de um resultado interim/final da Web Speech API.
 * Aceita tanto `{0:{transcript}, isFinal}` quanto `{transcript, isFinal}`.
 */
function readSpeechResultItem(item: unknown): {
  transcript?: string;
  isFinal: boolean;
} {
  if (typeof item === 'string') {
    return { transcript: asNonEmptyString(item), isFinal: true };
  }
  if (!item || typeof item !== 'object') return { isFinal: false };
  const record = item as SpeechResultLikeItem & Record<string, unknown>;
  const nested = record[0];
  const transcript =
    asNonEmptyString(record.transcript) ??
    asNonEmptyString(record.text) ??
    (nested && typeof nested === 'object'
      ? asNonEmptyString((nested as { transcript?: unknown }).transcript) ??
        asNonEmptyString((nested as { text?: unknown }).text)
      : undefined);
  return { transcript, isFinal: record.isFinal === true };
}

/**
 * Interpreta o resultado bruto do STT e decide se existe um transcript FINAL
 * utilizável. Nunca executa nada — apenas classifica.
 *
 * - `isFinal === false` / `final === false` explícito → 'interim' (ignorar).
 * - Ausência de flag de finalidade é tratada como final: resultados de
 *   Whisper/serviços server-side já chegam prontos; a Web Speech API sempre
 *   envia `isFinal` quando o chamador usa o shape `results[]`.
 */
export function extractSttTranscript(stt: unknown): SttTranscriptExtraction {
  if (stt == null) return { kind: 'empty' };
  if (typeof stt === 'string') return finalizeTranscript(stt);
  if (typeof stt !== 'object') return { kind: 'empty' };

  const event = stt as SttTranscriptEvent & Record<string, unknown>;

  // Web Speech API: event.results (array-like)
  const results = event.results;
  if (results != null && typeof results === 'object') {
    const items = Array.from(results as ArrayLike<unknown>);
    const finals: string[] = [];
    let sawInterim = false;
    for (const item of items) {
      const parsed = readSpeechResultItem(item);
      if (parsed.isFinal && parsed.transcript) {
        finals.push(parsed.transcript);
      } else if (!parsed.isFinal) {
        sawInterim = true;
      }
    }
    if (finals.length > 0) return finalizeTranscript(finals.join(' '));
    if (sawInterim) return { kind: 'interim' };
    return { kind: 'empty' };
  }

  // Whisper e afins: segments[].text (resultado já é final por natureza)
  if (Array.isArray(event.segments) && event.segments.length > 0) {
    const text = event.segments
      .map((segment) => {
        if (!segment || typeof segment !== 'object') return '';
        const s = segment as { text?: unknown };
        return typeof s.text === 'string' ? s.text : '';
      })
      .join(' ')
      .trim();
    if (text) return { kind: 'final', transcript: text };
  }

  // Flags explícitas de interino vencem qualquer texto presente.
  const explicitFinal = event.isFinal ?? event.final;
  if (explicitFinal === false) return { kind: 'interim' };

  const raw =
    asNonEmptyString(event.transcript) ??
    asNonEmptyString(event.finalTranscript) ??
    asNonEmptyString(event.text);

  if (!raw) return { kind: 'empty' };
  return finalizeTranscript(raw);
}

// ---------------------------------------------------------------------------
// 2. Actor context — SEMPRE da sessão autenticada, nunca do payload STT
// ---------------------------------------------------------------------------

/** Papel de domínio do Voice Hub → papel do guard de comandos de voz. */
export function mapSystemRoleToVoiceRole(role: unknown): VoiceActorRole {
  switch (String(role ?? '').trim().toUpperCase()) {
    case 'ADMIN':
      return 'admin';
    case 'GESTOR':
      return 'manager';
    case 'CLOSER':
    case 'SDR':
      return 'agent';
    // VISUALIZADOR, UNVERIFIED e qualquer papel desconhecido → fail-closed.
    default:
      return 'viewer';
  }
}

function readField(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = asNonEmptyString(source[key]);
    if (value) return value;
  }
  return undefined;
}

/**
 * Resolve o ator de voz a partir do contexto de sessão AUTENTICADO.
 *
 * Formatos aceitos (o chamador decide qual passa — tipicamente `req.user` de
 * `authenticateToken`, `{user}` de better-auth, ou o próprio usuário):
 *   - { id|userId, organizationId|organization_id|tenantId|orgId, role|userRole }
 *   - { user: { ...mesmos campos... } }
 *
 * Retorna `null` quando não há userId/organizationId válidos — o adapter
 * responde `actor_unauthenticated` em vez de adivinhar tenant.
 */
export function resolveVoiceActorFromSession(session: unknown): VoiceCommandActor | null {
  if (!session || typeof session !== 'object') return null;

  const root = session as Record<string, unknown>;
  // Desembrulha `{ user: {...} }` (better-auth / AuthRequest-like).
  const user =
    root.user && typeof root.user === 'object'
      ? (root.user as Record<string, unknown>)
      : root;

  const userId = readField(user, ['id', 'userId', 'user_id']);
  const organizationId = readField(user, [
    'organizationId',
    'organization_id',
    'tenantId',
    'tenant_id',
    'orgId',
  ]);
  if (!userId || !organizationId) return null;

  const role = readField(user, ['role', 'userRole', 'user_role']);
  return { userId, organizationId, role: mapSystemRoleToVoiceRole(role) };
}

/** Campos de tenancy que um payload STT/client pode tentar injetar — sempre ignorados. */
function readClaimedTenancy(stt: unknown): { organizationId?: string; userId?: string } {
  if (!stt || typeof stt !== 'object') return {};
  const event = stt as Record<string, unknown>;
  return {
    organizationId: asNonEmptyString(event.organizationId) ?? asNonEmptyString(event.tenantId),
    userId: asNonEmptyString(event.userId),
  };
}

// ---------------------------------------------------------------------------
// 3. Executores de domínio reais (via container — sem import cross-feature)
// ---------------------------------------------------------------------------

/**
 * Contrato estrutural local de `LeadUseCases` (Agente 04) — mesmo padrão de
 * `toolExecutors.ts`: resolve via `container.resolve`, nunca import direto de
 * `src/features/crm/**` (regra `no-cross-feature-imports` do dependency-cruiser).
 */
interface LeadUseCasesContract {
  createLead(
    organizationId: string,
    data: Record<string, unknown>,
    actor?: { userId: string; role: string },
  ): Promise<unknown>;
}

function resolveLeadUseCases(): LeadUseCasesContract {
  return container.resolve<LeadUseCasesContract>('LeadUseCases');
}

/**
 * Registro de executores reais disponíveis HOJE para comandos de voz.
 *
 * `create_lead` é o único tipo com executor honesto: `LeadUseCases.createLead`
 * persiste via `LeadRepository` (commit real) e, sem `companyId`, não dispara
 * enriquecimento externo — mutação de banco pura, exatamente o que
 * `DatabaseMutationRunner.mutate` exige.
 *
 * Os demais tipos permanecem SEM executor de propósito (→ `executor_not_bound`):
 * - `update_deal_stage`: `DealsService` exige `expectedVersion` (optimistic
 *   lock) e mapeamento stage-name→stageId que a fala não fornece.
 * - `schedule_meeting`: `scheduleVerifiedMeeting` exige leadId, e-mails e
 *   janela start/end; criar evento em Google Calendar seria ação externa real.
 * - `log_activity`: `ActivityUseCases.createActivity` exige `leadId` — o parser
 *   emite `dealId` (namespaces Lead/Deal são distintos no schema).
 * - `generic_action`: não existe domínio de ação genérica executável.
 * Pendências registradas no handoff 64→00/04 para binding futuro.
 */
export function createDomainVoiceCommandExecutors(): VoiceCommandExecutorRegistry {
  return {
    create_lead: {
      async mutate(organizationId: string, command: VoiceCommandPayload) {
        const leadName = asNonEmptyString(command.parameters.leadName);
        if (!leadName) {
          throw new Error("Parâmetro obrigatório 'leadName' ausente para create_lead.");
        }
        // owner = usuário que falou o comando (criador do lead). Sem companyId,
        // createLead não agenda enriquecimento externo nem round-robin indevido.
        const useCases = resolveLeadUseCases();
        return useCases.createLead(organizationId, {
          title: leadName,
          owner: command.userId,
        });
      },
    },
  };
}

// ---------------------------------------------------------------------------
// 4. Adapter STT → Router
// ---------------------------------------------------------------------------

export type SttAdapterStatus =
  | 'stt_interim'
  | 'stt_empty'
  | 'actor_unauthenticated'
  | VoiceCommandRouterStatus;

export interface SttVoiceCommandResult {
  status: SttAdapterStatus;
  /** Transcript final efetivamente enviado ao router (quando houver). */
  transcript?: string;
  organizationId?: string;
  commandId?: string;
  type?: VoiceCommandType;
  execution?: VoiceCommandExecutionResult;
  confirmationId?: string;
  expiresAt?: string;
  reason?: string;
  candidates?: VoiceCommandType[];
  missingSlots?: string[];
}

export interface SttVoiceCommandInput {
  /** Resultado bruto do STT — contrato tolerante (ver extractSttTranscript). */
  stt: unknown;
  /**
   * Contexto de sessão AUTENTICADO resolvido no servidor (ex.: `req.user`,
   * `{user}` do better-auth). NUNCA dados do payload do cliente.
   */
  session: unknown;
  commandId?: string;
  /**
   * Decisão explícita de confirmação (botão na UI ou intent de voz mapeada
   * pelo chamador). Quando presente, o transcript é irrelevante — o router
   * resolve a confirmação pendente original.
   */
  confirmation?: { confirmationId: string; decision: 'confirm' | 'cancel' };
}

export interface SttVoiceCommandAdapterOptions {
  executors: VoiceCommandExecutorRegistry;
  confirmations?: VoiceCommandConfirmationManager;
  /**
   * Resolvedor de ator a partir da sessão. Default:
   * `resolveVoiceActorFromSession`. Injetável para contextos de sessão
   * customizados — mas NUNCA deve ler tenancy do payload STT.
   */
  resolveActor?: (
    session: unknown,
  ) => VoiceCommandActor | null | Promise<VoiceCommandActor | null>;
}

export function createSttVoiceCommandAdapter(options: SttVoiceCommandAdapterOptions) {
  const router = createVoiceCommandRouter({
    executors: options.executors,
    confirmations: options.confirmations,
  });
  const resolveActor = options.resolveActor ?? resolveVoiceActorFromSession;

  /** Telemetria de tentativa de injeção de tenancy via payload STT. */
  function auditClaimedTenancy(stt: unknown, actor: VoiceCommandActor): void {
    const claimed = readClaimedTenancy(stt);
    if (claimed.organizationId && claimed.organizationId !== actor.organizationId) {
      logger.warn(
        {
          claimedOrganizationId: claimed.organizationId,
          sessionOrganizationId: actor.organizationId,
          userId: actor.userId,
        },
        'VoiceHub STT: payload STT alegou organizationId divergente da sessão — campo ignorado (tenancy vem só da sessão).',
      );
    }
    if (claimed.userId && claimed.userId !== actor.userId) {
      logger.warn(
        {
          claimedUserId: claimed.userId,
          sessionUserId: actor.userId,
          organizationId: actor.organizationId,
        },
        'VoiceHub STT: payload STT alegou userId divergente da sessão — campo ignorado.',
      );
    }
  }

  async function resolveActorOrReject(
    session: unknown,
    stt: unknown,
  ): Promise<{ actor: VoiceCommandActor } | { rejection: SttVoiceCommandResult }> {
    const actor = await resolveActor(session);
    if (!actor) {
      logger.warn(
        { hasSttPayload: stt != null },
        'VoiceHub STT: comando de voz rejeitado — sessão sem contexto de ator válido (userId/organizationId).',
      );
      return {
        rejection: {
          status: 'actor_unauthenticated',
          reason:
            'Não foi possível identificar o usuário autenticado da sessão de voz. Faça login novamente.',
        },
      };
    }
    auditClaimedTenancy(stt, actor);
    return { actor };
  }

  /**
   * Processa um resultado de transcrição STT.
   *
   * Ordem honesta:
   * 1. Extração/classificação do transcript (interim/vazio → nunca executa);
   *    decisão de confirmação explícita dispensa transcript;
   * 2. Resolução do ator SOMENTE a partir da sessão;
   * 3. Delegação ao router da Onda 4 (parse → autorização → confirmação → commit).
   */
  async function handleTranscript(input: SttVoiceCommandInput): Promise<SttVoiceCommandResult> {
    const extraction = extractSttTranscript(input.stt);
    const hasConfirmation = input.confirmation != null;

    // Sem decisão de confirmação, resultado não-final/vazio é rejeitado aqui —
    // o router nem é consultado (resposta honesta, zero mutação possível).
    if (!hasConfirmation) {
      if (extraction.kind === 'interim') {
        return {
          status: 'stt_interim',
          reason: 'Transcrição ainda parcial (interina). Aguardando resultado final.',
        };
      }
      if (extraction.kind === 'empty') {
        return {
          status: 'stt_empty',
          reason: 'Nenhuma fala reconhecida. Tente novamente ou use o texto.',
        };
      }
    }

    // Com confirmação explícita o router ignora o transcript de qualquer forma;
    // sem transcript final utilizável, enviamos string vazia (nunca executa por si).
    const transcript = extraction.kind === 'final' ? extraction.transcript : '';

    const resolved = await resolveActorOrReject(input.session, input.stt);
    if ('rejection' in resolved) return resolved.rejection;
    const { actor } = resolved;

    const routerResult = await router.processVoiceCommand({
      transcript,
      actor,
      commandId: input.commandId,
      confirmation: input.confirmation,
    });

    return { ...routerResult, transcript: transcript || undefined };
  }

  /**
   * Atalho para decisões de confirmação vindas da UI (botão confirmar/cancelar)
   * sem evento STT — o router resolve o comando pendente original.
   */
  async function handleConfirmationDecision(input: {
    confirmationId: string;
    decision: 'confirm' | 'cancel';
    session: unknown;
  }): Promise<SttVoiceCommandResult> {
    return handleTranscript({
      stt: undefined,
      session: input.session,
      confirmation: { confirmationId: input.confirmationId, decision: input.decision },
    });
  }

  return {
    handleTranscript,
    handleConfirmationDecision,
    /** Exposto para testes/diagnóstico — mesma instância usada pelo router. */
    confirmations: router.confirmations,
  };
}

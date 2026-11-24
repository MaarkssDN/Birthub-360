/**
 * Contrato STT → Voice Command Router (POS4-63 · Agente 63 — Lira)
 *
 * Ponte entre qualquer motor de transcrição (Web Speech API, adaptador nativo
 * Capacitor, Whisper batch/diarizado) e o router de comandos de voz
 * (`src/features/voice-hub/commands/voice-command-router.ts`, Agente 64).
 *
 * Este módulo é propositalmente PURO (sem I/O, sem áudio real): normaliza a saída
 * dos motores STT existentes em um único evento canônico e o converte no
 * `VoiceCommandRequest` que o router consome. O papel (`role`) NUNCA vem da
 * transcrição — vem da sessão autenticada do chamador.
 *
 * Regras do contrato:
 * - `transcript` é sempre texto já limpo (trim); vazio é erro de contrato.
 * - `sessionId`, `organizationId` e `userId` são obrigatórios e nunca vazios —
 *   é o que impede que uma fala de um tenant alimente o router de outro.
 * - `isFinal=false` marca transcrição provisória (interim); só `isFinal=true`
 *   é despachável para comandos.
 * - `speaker` usa os mesmos valores da diarização estéreo ('AGENT' | 'CUSTOMER')
 *   quando o motor reporta; ausente quando não há diarização.
 * - `confidence` é opcional e propagada somente quando o motor a reporta —
 *   nunca fabricada.
 */

import type { VoiceCommandRequest } from '../commands/voice-command-router.js';
import type { VoiceActorRole } from '../commands/permission.guard.js';
import type { DiarizedUtterance } from './whisper.worker.js';

/** Locutor conforme `DiarizedUtterance` (diarização por canal estéreo). */
export type SttSpeaker = 'AGENT' | 'CUSTOMER';

/** Contexto de tenancy/sessão que todo evento STT carrega — obrigatório. */
export interface SttTranscriptContext {
  /** Identificador da sessão de voz (VoiceSession.sessionId ou callId). */
  sessionId: string;
  /** Tenant dono da sessão — nunca inferido do texto. */
  organizationId: string;
  /** Usuário autenticado que originou a sessão de voz. */
  userId: string;
}

/** Evento canônico de transcrição emitido para o pipeline STT → router. */
export interface SttTranscriptEvent extends SttTranscriptContext {
  /** Texto transcrito, já com trim aplicado. */
  transcript: string;
  /** true = resultado final (despachável); false = interim/provisório. */
  isFinal: boolean;
  /** Locutor quando o motor de STT diariza; ausente caso contrário. */
  speaker?: SttSpeaker;
  /** Confiança reportada pelo motor (0..1); omitida quando não informada. */
  confidence?: number;
  /** Início/fim da fala em segundos, quando o motor reporta timestamps. */
  startSec?: number;
  endSec?: number;
}

/** Erro de violação do contrato STT — sempre propagado, nunca silenciado. */
export class SttTranscriptContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SttTranscriptContractError';
  }
}

function assertNonEmpty(value: string, field: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    throw new SttTranscriptContractError(`Campo obrigatório ausente no evento STT: '${field}'.`);
  }
  return trimmed;
}

/**
 * Cria um `SttTranscriptEvent` validado. Lança `SttTranscriptContractError`
 * quando faltam campos de tenancy/sessão, quando o transcript é vazio ou
 * quando `confidence` está fora de [0, 1].
 */
export function createSttTranscriptEvent(
  context: SttTranscriptContext,
  input: {
    transcript: string;
    isFinal: boolean;
    speaker?: SttSpeaker;
    confidence?: number;
    startSec?: number;
    endSec?: number;
  },
): SttTranscriptEvent {
  const sessionId = assertNonEmpty(context.sessionId, 'sessionId');
  const organizationId = assertNonEmpty(context.organizationId, 'organizationId');
  const userId = assertNonEmpty(context.userId, 'userId');

  const transcript = typeof input.transcript === 'string' ? input.transcript.trim() : '';
  if (!transcript) {
    throw new SttTranscriptContractError(
      'Transcript vazio não é um evento STT válido — não emita eventos sem texto.',
    );
  }

  if (typeof input.isFinal !== 'boolean') {
    throw new SttTranscriptContractError("Campo 'isFinal' deve ser boolean.");
  }

  if (
    input.confidence !== undefined &&
    (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1)
  ) {
    throw new SttTranscriptContractError(
      `Confidence inválida (${input.confidence}) — esperado número em [0, 1] ou ausente.`,
    );
  }

  return {
    sessionId,
    organizationId,
    userId,
    transcript,
    isFinal: input.isFinal,
    ...(input.speaker !== undefined ? { speaker: input.speaker } : {}),
    ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
    ...(input.startSec !== undefined ? { startSec: input.startSec } : {}),
    ...(input.endSec !== undefined ? { endSec: input.endSec } : {}),
  };
}

/**
 * Um evento só pode virar comando quando é final E tem texto.
 * Transcrições interim (`isFinal=false`) existem para UI/sentimento,
 * nunca para execução de comandos.
 */
export function isCommandDispatchable(event: SttTranscriptEvent): boolean {
  return event.isFinal && event.transcript.trim().length > 0;
}

/**
 * Converte um evento STT final no `VoiceCommandRequest` do router (Agente 64).
 *
 * - `actor.role` é parâmetro OBRIGATÓRIO e deve vir da sessão autenticada
 *   (RBAC), nunca do conteúdo falado.
 * - Lança `SttTranscriptContractError` se o evento não for despachável —
 *   forçar o caller a checar `isCommandDispatchable` antes é intencional:
 *   interim results não podem executar comandos.
 */
export function toVoiceCommandRequest(
  event: SttTranscriptEvent,
  role: VoiceActorRole,
): VoiceCommandRequest {
  if (!isCommandDispatchable(event)) {
    throw new SttTranscriptContractError(
      'Apenas eventos STT com isFinal=true e transcript não vazio podem gerar VoiceCommandRequest.',
    );
  }
  return {
    transcript: event.transcript,
    actor: {
      userId: event.userId,
      organizationId: event.organizationId,
      role,
    },
  };
}

/**
 * Normaliza a saída batch da diarização estéreo (`diarizeStereoAudioChannels`)
 * em eventos STT. Como o Whisper batch só produz resultado final, todos os
 * eventos saem com `isFinal=true`. Segmentos sem texto são descartados.
 */
export function mapDiarizedUtterancesToEvents(
  utterances: DiarizedUtterance[],
  context: SttTranscriptContext,
): SttTranscriptEvent[] {
  // Tenancy/sessão inválida falha rápido, mesmo que não haja enunciados.
  assertNonEmpty(context.sessionId, 'sessionId');
  assertNonEmpty(context.organizationId, 'organizationId');
  assertNonEmpty(context.userId, 'userId');

  const events: SttTranscriptEvent[] = [];
  for (const utterance of utterances) {
    const text = utterance.text.trim();
    if (!text) continue;
    events.push(
      createSttTranscriptEvent(context, {
        transcript: text,
        isFinal: true,
        speaker: utterance.speaker,
        ...(utterance.confidence !== undefined ? { confidence: utterance.confidence } : {}),
        startSec: utterance.startSec,
        endSec: utterance.endSec,
      }),
    );
  }
  return events;
}

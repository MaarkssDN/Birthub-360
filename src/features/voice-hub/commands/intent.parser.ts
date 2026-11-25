/**
 * Voice Command Intent Parser
 * Squad 60 — Tito (Comandos de Voz e Ações)
 *
 * Interpretação determinística de comandos falados em texto.
 * REGRA B-07: o parser NUNCA confirma execução — ele apenas classifica a intenção.
 * Intenções ambíguas, não reconhecidas ou com parâmetros obrigatórios ausentes
 * retornam status honesto e NÃO produzem comando executável.
 */

import type { VoiceCommandType } from './command.processor.js';

export type VoiceIntentParseStatus = 'parsed' | 'ambiguous' | 'incomplete' | 'unrecognized';

export interface ParsedVoiceIntent {
  type: VoiceCommandType;
  parameters: Record<string, unknown>;
}

export interface VoiceIntentParseResult {
  status: VoiceIntentParseStatus;
  intent?: ParsedVoiceIntent;
  /** Tipos candidatos quando status === 'ambiguous' */
  candidates?: VoiceCommandType[];
  /** Slots obrigatórios ausentes quando status === 'incomplete' */
  missingSlots?: string[];
  /** Motivo legível para resposta honesta ao usuário */
  reason?: string;
}

interface IntentPattern {
  type: VoiceCommandType;
  patterns: RegExp[];
  requiredSlots: string[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    type: 'create_lead',
    patterns: [
      /criar\s+(um\s+|uma\s+|novo\s+|nova\s+)?(lead|contato|prospect)/i,
      /cadastr(ar|e)\s+(um\s+|uma\s+)?(lead|contato|prospect)/i,
      /novo\s+(lead|contato|prospect)/i,
      /create\s+(a\s+|an\s+|new\s+)?(lead|contact|prospect)/i,
      /add\s+(a\s+)?(lead|contact)/i,
    ],
    requiredSlots: ['leadName'],
  },
  {
    type: 'update_deal_stage',
    patterns: [
      /mover\s+(o\s+|a\s+)?(deal|neg[oó]cio|oportunidade)/i,
      /mudar\s+(o\s+)?(est[aá]gio|fase|status)\s+(do|da|de)/i,
      /atualizar?\s+(o\s+)?(est[aá]gio|fase|status)/i,
      /move\s+(the\s+)?(deal|opportunity)/i,
      /update\s+(the\s+)?(stage|status)/i,
    ],
    requiredSlots: ['dealId', 'stage'],
  },
  {
    type: 'schedule_meeting',
    patterns: [
      /agendar\s+(uma\s+|um\s+)?(reuni[aã]o|reuniao|call|encontro|visita)/i,
      /marcar\s+(uma\s+|um\s+)?(reuni[aã]o|reuniao|call)/i,
      /schedule\s+(a\s+|an\s+)?(meeting|call|appointment)/i,
      /marcar\s+reuni[aã]o/i,
    ],
    requiredSlots: ['dateTime'],
  },
  {
    type: 'log_activity',
    patterns: [
      /registrar\s+(uma\s+|um\s+)?(atividade|liga[cç][aã]o|chamada|contato)/i,
      /registrar\s+(no\s+)?(crm|sistema)/i,
      /log\s+(an\s+)?(activity|call|interaction)/i,
      /anotar\s+(uma\s+)?(atividade|liga[cç][aã]o|chamada)/i,
      /registrar\s+atividade/i,
    ],
    requiredSlots: ['description'],
  },
  {
    type: 'generic_action',
    patterns: [
      /executar\s+(a\s+)?a[cç][aã]o/i,
      /run\s+(the\s+|a\s+)?action/i,
      /executar\s+comando/i,
    ],
    requiredSlots: ['action'],
  },
];

const ID_PATTERN =
  /(?:deal|neg[oó]cio|oportunidade|lead|contato)\s*(?:id|#|n[ºo°.]*)?\s*[:=]?\s*([A-Za-z0-9][A-Za-z0-9_-]{2,})/i;
const STAGE_PATTERN =
  /(?:para|to|stage|est[aá]gio)\s*[:=]?\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9_ -]{1,40})/i;
const DATETIME_PATTERN =
  /((?:\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)|(?:\d{4}-\d{2}-\d{2})|(?:amanh[aã]|hoje|depois de amanh[aã]|next week|tomorrow|today))/i;
const NAME_PATTERN =
  /(?:chamad[oa]|nome|name[d]?|lead)\s*[:=]?\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 _-]{0,60})/i;
const NAME_LEADING_STOPWORD = /^(?:chamad[oa]|nome|name[d]?|lead)\s+/i;
const ACTION_PATTERN = /(?:a[cç][aã]o|action)\s*[:=]\s*([A-Za-z0-9_.-]+)/i;
const DESC_PATTERN = /(?:descri[cç][aã]o|description|motivo|reason)\s*[:=]\s*(.+?)(?:[.!?]|$)/i;

function extractParameters(transcript: string): Record<string, unknown> {
  const parameters: Record<string, unknown> = {};

  const idMatch = transcript.match(ID_PATTERN);
  if (idMatch) parameters.dealId = idMatch[1];

  const stageMatch = transcript.match(STAGE_PATTERN);
  if (stageMatch) parameters.stage = stageMatch[1].trim();

  const dateMatch = transcript.match(DATETIME_PATTERN);
  if (dateMatch) parameters.dateTime = dateMatch[1];

  const nameMatch = transcript.match(NAME_PATTERN);
  if (nameMatch) {
    // O match pode começar numa keyword anterior (ex.: "lead chamado X") —
    // remove stopwords líderes para extrair apenas o nome.
    const name = nameMatch[1]
      .replace(NAME_LEADING_STOPWORD, '')
      .replace(/[.,;:!?]+$/, '')
      .trim();
    if (name) parameters.leadName = name;
  }

  const actionMatch = transcript.match(ACTION_PATTERN);
  if (actionMatch) parameters.action = actionMatch[1];

  const descMatch = transcript.match(DESC_PATTERN);
  if (descMatch) parameters.description = descMatch[1].trim();

  return parameters;
}

/**
 * Interpreta um comando falado (transcrição textual) e retorna a intenção classificada.
 * Nunca executa nada — apenas classifica.
 */
export function parseVoiceTranscript(transcript: string): VoiceIntentParseResult {
  const normalized = transcript.trim();
  if (!normalized) {
    return { status: 'unrecognized', reason: 'Comando de voz vazio.' };
  }

  const matches = INTENT_PATTERNS.filter((candidate) =>
    candidate.patterns.some((pattern) => pattern.test(normalized)),
  );

  if (matches.length === 0) {
    return {
      status: 'unrecognized',
      reason: `Não foi possível reconhecer uma ação executável em: "${normalized}".`,
    };
  }

  if (matches.length > 1) {
    return {
      status: 'ambiguous',
      candidates: matches.map((match) => match.type),
      reason: `Comando ambíguo: mais de uma ação identificada (${matches
        .map((match) => match.type)
        .join(', ')}). Especifique a ação desejada.`,
    };
  }

  const [match] = matches;
  const parameters = extractParameters(normalized);
  const missingSlots = match.requiredSlots.filter((slot) => {
    const value = parameters[slot];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missingSlots.length > 0) {
    return {
      status: 'incomplete',
      intent: { type: match.type, parameters },
      missingSlots,
      reason: `Comando '${match.type}' incompleto: parâmetros obrigatórios ausentes (${missingSlots.join(', ')}).`,
    };
  }

  return {
    status: 'parsed',
    intent: { type: match.type, parameters },
  };
}

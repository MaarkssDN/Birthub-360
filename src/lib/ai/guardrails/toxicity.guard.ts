import { decodeTextEscapes, findEncodedTokenSpans } from './encoding.js';

export const TOXIC_WORDS_PT = [
  'palavrão',
  'ofensa',
  'discriminacao',
  'preconceito',
  'violencia',
  'merda',
  'idiota',
  'idiotas',
  'estúpido',
  'burro',
  'retardado',
];

export interface ToxicityResult {
  toxic: boolean;
  redacted?: string;
  reason?: string;
  matches: string[];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const CHAR_MAP: Record<string, string> = {
  a: '[aáàâãä]',
  e: '[eéèêë]',
  i: '[iíìîï]',
  o: '[oóòôõö]',
  u: '[uúùûü]',
  c: '[cç]',
};

function getWordRegex(word: string): RegExp {
  if (word.includes(' ') || word.includes('-')) {
    return new RegExp(`(^|[^\\p{L}\\p{N}_])${escapeRegex(word)}(?=[^\\p{L}\\p{N}_]|$)`, 'gui');
  }

  let norm = word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  let ending = 's?';

  if (norm.endsWith('o')) {
    norm = norm.slice(0, -1);
    ending = '[oa]s?';
  } else if (norm.endsWith('a')) {
    norm = norm.slice(0, -1);
    ending = 'as?';
  } else if (norm.endsWith('il')) {
    norm = norm.slice(0, -2);
    ending = 'i[ls]';
  }

  const body = norm
    .split('')
    .map((c) => CHAR_MAP[c] || escapeRegex(c))
    .join('');
  return new RegExp(`(^|[^\\p{L}\\p{N}_])${body}${ending}(?=[^\\p{L}\\p{N}_]|$)`, 'gui');
}

/** Coleta os matches de toxicidade de um texto (já decodificado ou candidato). */
function collectToxicMatches(text: string): string[] {
  const matchesSet = new Set<string>();

  for (const word of TOXIC_WORDS_PT) {
    const regex = getWordRegex(word);
    const found = text.match(regex);
    if (found) {
      matchesSet.add(word);
      for (const rawMatch of found) {
        const clean = rawMatch.replace(/^[^\p{L}\p{N}_]+|[^\p{L}\p{N}_]+$/gu, '').toLowerCase();
        if (clean) matchesSet.add(clean);
      }
    }
  }

  return Array.from(matchesSet);
}

export function detectToxicity(text: string): ToxicityResult {
  // Mesma mitigação de encoding dos guardrails de PII: escapes de texto
  // (unicode/hex/%XX) e tokens Base64/hex são decodificados e revalidados.
  const normalized = decodeTextEscapes(text);
  const matchesSet = new Set(collectToxicMatches(normalized));
  for (const span of findEncodedTokenSpans(normalized)) {
    for (const m of collectToxicMatches(span.decoded)) matchesSet.add(m);
  }
  const matches = Array.from(matchesSet);

  if (matches.length > 0) {
    return {
      toxic: true,
      reason: 'Toxic language detected',
      matches,
    };
  }

  return {
    toxic: false,
    matches: [],
  };
}

export function redactToxicity(text: string): { redacted: string; matches: string[] } {
  const matchesSet = new Set<string>();
  const normalized = decodeTextEscapes(text);
  let redacted = normalized;

  for (const word of TOXIC_WORDS_PT) {
    const regex = getWordRegex(word);
    const found = redacted.match(regex);
    if (found) {
      matchesSet.add(word);
      for (const rawMatch of found) {
        const clean = rawMatch.replace(/^[^\p{L}\p{N}_]+|[^\p{L}\p{N}_]+$/gu, '').toLowerCase();
        if (clean) matchesSet.add(clean);
      }
      redacted = redacted.replace(regex, '$1[REDACTED]');
    }
  }

  // Tokens codificados cujo conteúdo decodificado é tóxico: o span inteiro é
  // substituído (não há como redigir dentro do token).
  for (const span of findEncodedTokenSpans(normalized)) {
    const spanMatches = collectToxicMatches(span.decoded);
    if (spanMatches.length > 0) {
      for (const m of spanMatches) matchesSet.add(m);
      redacted = redacted.split(span.raw).join('[REDACTED]');
    }
  }

  const matches = Array.from(matchesSet);
  if (matches.length === 0) {
    return { redacted: text, matches: [] };
  }

  return { redacted, matches };
}

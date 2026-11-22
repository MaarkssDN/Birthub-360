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

export function detectToxicity(text: string): ToxicityResult {
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
  let redacted = text;

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

  return { redacted, matches: Array.from(matchesSet) };
}

export interface PtBrSentimentResult {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  score: number;
  matchedColloquialisms: string[];
}

const PT_BR_NEGATIVE_SLANGS: readonly [RegExp, string][] = [
  [/\b(?:furada|cilada|enrolação|enrolacao|descaso|absurdo|péssimo|pessimo|lixo|horrível|horrivel)\b/i, 'insatisfacao_direta'],
  [/\b(?:só\s+que\s+não|so\s+que\s+nao|sqn|tá\s+de\s+brincadeira|ta\s+de\s+brincadeira|palhaçada|palhacada)\b/i, 'sarcasmo_ou_ironia'],
  [/\b(?:não\s+resolve\s+nada|nao\s+resolve\s+nada|cansei\s+de\s+esperar|vou\s+cancelar)\b/i, 'risco_churn'],
];

const PT_BR_POSITIVE_SLANGS: readonly [RegExp, string][] = [
  [/\b(?:show\s+de\s+bola|excelente|perfeito|maravilha|muito\s+bom|top\s+demais|resolvido)\b/i, 'elogio_comercial'],
];

export function analyzeCalibratedPtBrSentiment(text: string): PtBrSentimentResult {
  const matchedColloquialisms: string[] = [];
  let score = 0;

  for (const [regex, tag] of PT_BR_POSITIVE_SLANGS) {
    if (regex.test(text)) {
      score += 1;
      matchedColloquialisms.push(tag);
    }
  }

  for (const [regex, tag] of PT_BR_NEGATIVE_SLANGS) {
    if (regex.test(text)) {
      score -= 2; // Slangs negativos ou sarcasmo como "só que não" sobrepõem elogios aparentes
      matchedColloquialisms.push(tag);
    }
  }

  const sentiment = score < 0 ? 'NEGATIVE' : score > 0 ? 'POSITIVE' : 'NEUTRAL';
  return {
    sentiment,
    score,
    matchedColloquialisms,
  };
}

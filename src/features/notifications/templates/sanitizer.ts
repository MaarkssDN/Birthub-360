export interface TemplateVariableInput {
  templateBody: string;
  allowedVariables: readonly string[];
  variables: Record<string, string>;
}

export interface SanitizedTemplateResult {
  renderedText: string;
  redactedVariables: string[];
  blockedForbiddenVariables: string[];
  /** Categorias de PII detectadas no corpo renderizado (nunca o valor — LGPD-safe para logs). */
  redactedPiiCategories: PiiCategory[];
}

export type PiiCategory = 'cpf' | 'credit_card' | 'token' | 'clinical_data' | 'email' | 'phone';

const CPF_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
// Candidato a cartão: 13–19 dígitos com separadores esparsos. A validação real é Luhn
// (ver `isLuhnValidCard`) — sem isso, telefones BR com DDI (+55 ...) casavam como cartão.
const CREDIT_CARD_CANDIDATE_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;
const BEARER_OR_JWT_REGEX =
  /\b(?:Bearer\s+[A-Za-z0-9\-._~+/]+=*|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/gi;
const MEDICAL_RECORD_SECRET_REGEX = /\b(?:prontuario|cid|diagnostico)\s*[:=-]\s*[^\n,;]+/gi;
// E-mail em texto livre — mascarado fail-closed em variáveis de template e no corpo final.
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
// Telefone BR — fail-closed mas com âncora de formato para não mascarar números de
// pedido/documento nem intervalos de data (ex.: "2024-2025"). Cobre: DDD entre
// parênteses ou seguido de separador ("(11) 99999-8888", "11 3333-4444", "+55 11 ..."),
// celular nacional iniciado por 9 com separador ("99999-8888") e celular com DDD sem
// separadores ("11999998888", "+5511999998888").
const PHONE_REGEX =
  /(?:\+?55[\s().-]?)?(?:\(\d{2}\)\s?|\b\d{2}[\s.-])9?\d{4}[\s.-]\d{4}\b|\b9\d{4}[\s.-]\d{4}\b|\+?55[\s.-]?\d{2}[\s.-]?9\d{8}\b|\b\d{2}9\d{8}\b/g;

const HTML_TAG_REGEX = /<[^>]*>/g;
const TEMPLATE_BRACE_REGEX = /\{\{|\}\}/g;

/** Remove tags HTML e restos de interpolação `{{ }}` — normalização pré-varredura PII. */
function stripMarkup(text: string): string {
  return text.replace(HTML_TAG_REGEX, '').replace(TEMPLATE_BRACE_REGEX, '');
}

/** Algoritmo de Luhn para validar candidatos a cartão de crédito. */
function isLuhnValidCard(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let doubleDigit = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (doubleDigit) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

function isCreditCardMatch(match: string): boolean {
  const digits = match.replace(/\D/g, '');
  return isLuhnValidCard(digits);
}

interface PiiPattern {
  category: PiiCategory;
  regex: RegExp;
  placeholder: string;
  /** Validador opcional por ocorrência — evita falso positivo de padrão amplo. */
  validate?: (match: string) => boolean;
}

// Ordem importa: padrões mais específicos primeiro. `phone` precede `credit_card`
// para que "+55 11 99999-8888" não seja classificado como cartão; o Luhn do cartão
// resolve a sobreposição residual em `detectPiiCategories`.
const PII_PATTERNS: readonly PiiPattern[] = [
  { category: 'cpf', regex: CPF_REGEX, placeholder: '[CPF_REDACTED]' },
  { category: 'token', regex: BEARER_OR_JWT_REGEX, placeholder: '[TOKEN_REDACTED]' },
  {
    category: 'clinical_data',
    regex: MEDICAL_RECORD_SECRET_REGEX,
    placeholder: '[DADO_CLINICO_REDACTED]',
  },
  { category: 'phone', regex: PHONE_REGEX, placeholder: '[PHONE_REDACTED]' },
  {
    category: 'credit_card',
    regex: CREDIT_CARD_CANDIDATE_REGEX,
    placeholder: '[CARD_REDACTED]',
    validate: isCreditCardMatch,
  },
  { category: 'email', regex: EMAIL_REGEX, placeholder: '[EMAIL_REDACTED]' },
];

/** Aplica todos os padrões PII sobre um texto já normalizado (sem marcação). */
function applyPiiPatterns(input: string): { text: string; categories: Set<PiiCategory> } {
  let text = input;
  const categories = new Set<PiiCategory>();
  for (const { category, regex, placeholder, validate } of PII_PATTERNS) {
    regex.lastIndex = 0;
    text = text.replace(regex, (match) => {
      if (validate && !validate(match)) return match;
      categories.add(category);
      return placeholder;
    });
  }
  return { text, categories };
}

/** Coleta categorias presentes num texto (matchAll + validate), sem retornar valores. */
function collectPiiCategories(text: string): Set<PiiCategory> {
  const categories = new Set<PiiCategory>();
  for (const { category, regex, validate } of PII_PATTERNS) {
    regex.lastIndex = 0;
    for (const match of text.matchAll(regex)) {
      if (validate && !validate(match[0])) continue;
      categories.add(category);
      break;
    }
  }
  return categories;
}

/**
 * Detecta categorias de PII presentes em um texto SEM retornar os valores encontrados.
 * Uso seguro para logs/auditoria LGPD — o retorno nunca contém o dado pessoal em si.
 * Varre o texto original e a versão sem marcação HTML/`{{ }}`: PII fragmentada por tags
 * (ex.: `123.<b>456</b>.789-01`) também é reportada — fail-closed.
 */
export function detectPiiCategories(text: string): PiiCategory[] {
  if (!text) return [];
  const found = new Set<PiiCategory>([
    ...collectPiiCategories(text),
    ...collectPiiCategories(stripMarkup(text)),
  ]);
  return [...found];
}

export function sanitizeFreeTextVariable(rawValue: string): {
  cleanValue: string;
  wasRedacted: boolean;
  redactedCategories: PiiCategory[];
} {
  // Normalização ANTES da varredura: tags HTML e `{{ }}`podem fragmentar o PII
  // (`123.<b>456</b>.789-01`) e impedir o match — fail-closed exige remover primeiro.
  const normalized = stripMarkup(rawValue);
  const { text: cleanValue, categories } = applyPiiPatterns(normalized);

  // Redação final de segurança caso algum placeholder tenha reintroduzido marcação.
  const finalValue = cleanValue.replace(TEMPLATE_BRACE_REGEX, '');

  return {
    cleanValue: finalValue.trim(),
    wasRedacted: categories.size > 0,
    redactedCategories: [...categories],
  };
}

export interface SanitizedBodyResult {
  sanitizedBody: string;
  redactedPiiCategories: PiiCategory[];
}

/**
 * Passada final fail-closed sobre o corpo JÁ renderizado de uma mensagem outbound
 * (WhatsApp, SMS, e-mail texto). Redige PII residual que tenha entrado pelo próprio
 * templateBody (não só por variáveis) e remove tags HTML e restos de `{{ }}`.
 *
 * `stripHtml=false` preserva HTML APENAS quando não há PII ocultada por marcação:
 * se a versão sem tags revelar categorias ausentes na varredura direta, o corpo é
 * devolvido já sem marcação (fail-closed vence preservação de HTML).
 *
 * Retorna as categorias detectadas para auditoria — nunca os valores.
 */
export function sanitizeOutboundMessageBody(
  renderedBody: string,
  options: { stripHtml?: boolean } = {},
): SanitizedBodyResult {
  const stripHtml = options.stripHtml ?? true;

  if (stripHtml) {
    const normalized = stripMarkup(renderedBody);
    const { text, categories } = applyPiiPatterns(normalized);
    return {
      sanitizedBody: text.replace(HTML_TAG_REGEX, '').trim(),
      redactedPiiCategories: [...categories],
    };
  }

  // stripHtml=false: HTML é preservado, mas a detecção roda também sobre a versão
  // sem marcação — PII fragmentada por tags não pode escapar.
  const braceNormalized = renderedBody.replace(TEMPLATE_BRACE_REGEX, '');
  const direct = applyPiiPatterns(braceNormalized);
  const shadow = applyPiiPatterns(stripMarkup(renderedBody));

  const hiddenCategories = [...shadow.categories].filter((c) => !direct.categories.has(c));
  const merged = new Set<PiiCategory>([...direct.categories, ...shadow.categories]);

  if (hiddenCategories.length > 0) {
    // PII estava ofuscada por marcação → devolve versão normalizada (sem tags).
    return {
      sanitizedBody: shadow.text.trim(),
      redactedPiiCategories: [...merged],
    };
  }

  return {
    sanitizedBody: direct.text.trim(),
    redactedPiiCategories: [...merged],
  };
}

export function sanitizeWhatsAppTemplatePayload(
  input: TemplateVariableInput,
): SanitizedTemplateResult {
  const allowedSet = new Set(input.allowedVariables);
  const redactedVariables: string[] = [];
  const blockedForbiddenVariables: string[] = [];
  const allRedactedCategories = new Set<PiiCategory>();

  for (const key of Object.keys(input.variables)) {
    if (!allowedSet.has(key)) {
      blockedForbiddenVariables.push(key);
    }
  }

  if (blockedForbiddenVariables.length > 0) {
    throw new Error(
      `Variáveis não autorizadas na whitelist do template de mensagem: ${blockedForbiddenVariables.join(', ')}`,
    );
  }

  const renderedText = input.templateBody.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (_, varName) => {
      const key = String(varName);
      if (!allowedSet.has(key)) {
        blockedForbiddenVariables.push(key);
        return '';
      }
      const rawVal = input.variables[key] ?? '';
      const { cleanValue, wasRedacted, redactedCategories } = sanitizeFreeTextVariable(
        String(rawVal),
      );
      if (wasRedacted) {
        redactedVariables.push(key);
      }
      for (const category of redactedCategories) {
        allRedactedCategories.add(category);
      }
      return cleanValue;
    },
  );

  // Fail-closed: o corpo final também passa pela varredura de PII — o templateBody em si
  // pode conter dado pessoal literal, restos de interpolação ou PII fragmentada por tags.
  const bodyScan = sanitizeOutboundMessageBody(renderedText);

  return {
    renderedText: bodyScan.sanitizedBody,
    redactedVariables,
    blockedForbiddenVariables,
    redactedPiiCategories: [
      ...new Set<PiiCategory>([...allRedactedCategories, ...bodyScan.redactedPiiCategories]),
    ],
  };
}

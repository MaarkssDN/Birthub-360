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

export type PiiCategory =
  | 'cpf'
  | 'credit_card'
  | 'token'
  | 'clinical_data'
  | 'email'
  | 'phone';

const CPF_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;
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

interface PiiPattern {
  category: PiiCategory;
  regex: RegExp;
  placeholder: string;
}

const PII_PATTERNS: readonly PiiPattern[] = [
  { category: 'cpf', regex: CPF_REGEX, placeholder: '[CPF_REDACTED]' },
  { category: 'token', regex: BEARER_OR_JWT_REGEX, placeholder: '[TOKEN_REDACTED]' },
  { category: 'clinical_data', regex: MEDICAL_RECORD_SECRET_REGEX, placeholder: '[DADO_CLINICO_REDACTED]' },
  { category: 'credit_card', regex: CREDIT_CARD_REGEX, placeholder: '[CARD_REDACTED]' },
  { category: 'email', regex: EMAIL_REGEX, placeholder: '[EMAIL_REDACTED]' },
  { category: 'phone', regex: PHONE_REGEX, placeholder: '[PHONE_REDACTED]' },
];

/**
 * Detecta categorias de PII presentes em um texto SEM retornar os valores encontrados.
 * Uso seguro para logs/auditoria LGPD — o retorno nunca contém o dado pessoal em si.
 */
export function detectPiiCategories(text: string): PiiCategory[] {
  if (!text) return [];
  const found = new Set<PiiCategory>();
  for (const { category, regex } of PII_PATTERNS) {
    regex.lastIndex = 0;
    if (regex.test(text)) found.add(category);
  }
  return [...found];
}

export function sanitizeFreeTextVariable(rawValue: string): {
  cleanValue: string;
  wasRedacted: boolean;
  redactedCategories: PiiCategory[];
} {
  let wasRedacted = false;
  const redactedCategories = new Set<PiiCategory>();
  let cleanValue = rawValue;

  for (const { category, regex, placeholder } of PII_PATTERNS) {
    regex.lastIndex = 0;
    cleanValue = cleanValue.replace(regex, () => {
      wasRedacted = true;
      redactedCategories.add(category);
      return placeholder;
    });
  }

  // Remove tags HTML/scripts e quebras de controle de template injection
  cleanValue = cleanValue.replace(/<[^>]*>/g, '').replace(/\{\{|\}\}/g, '');

  return { cleanValue: cleanValue.trim(), wasRedacted, redactedCategories: [...redactedCategories] };
}

export interface SanitizedBodyResult {
  sanitizedBody: string;
  redactedPiiCategories: PiiCategory[];
}

/**
 * Passada final fail-closed sobre o corpo JÁ renderizado de uma mensagem outbound
 * (WhatsApp, SMS, e-mail texto). Redige PII residual que tenha entrado pelo próprio
 * templateBody (não só por variáveis) e remove tags HTML e restos de `{{ }}`.
 * Retorna as categorias detectadas para auditoria — nunca os valores.
 */
export function sanitizeOutboundMessageBody(
  renderedBody: string,
  options: { stripHtml?: boolean } = {},
): SanitizedBodyResult {
  const stripHtml = options.stripHtml ?? true;
  let sanitizedBody = renderedBody;
  const redactedCategories = new Set<PiiCategory>();

  for (const { category, regex, placeholder } of PII_PATTERNS) {
    regex.lastIndex = 0;
    sanitizedBody = sanitizedBody.replace(regex, () => {
      redactedCategories.add(category);
      return placeholder;
    });
  }

  if (stripHtml) {
    sanitizedBody = sanitizedBody.replace(/<[^>]*>/g, '');
  }
  sanitizedBody = sanitizedBody.replace(/\{\{|\}\}/g, '');

  return {
    sanitizedBody: sanitizedBody.trim(),
    redactedPiiCategories: [...redactedCategories],
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
  // pode conter dado pessoal literal ou restos de interpolação não resolvida.
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

export interface TemplateVariableInput {
  templateBody: string;
  allowedVariables: readonly string[];
  variables: Record<string, string>;
}

export interface SanitizedTemplateResult {
  renderedText: string;
  redactedVariables: string[];
  blockedForbiddenVariables: string[];
}

const CPF_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;
const BEARER_OR_JWT_REGEX =
  /\b(?:Bearer\s+[A-Za-z0-9\-._~+/]+=*|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/gi;
const MEDICAL_RECORD_SECRET_REGEX = /\b(?:prontuario|cid|diagnostico)\s*[:=-]\s*[^\n,;]+/gi;

export function sanitizeFreeTextVariable(rawValue: string): {
  cleanValue: string;
  wasRedacted: boolean;
} {
  let wasRedacted = false;
  let cleanValue = rawValue;

  const patterns: [RegExp, string][] = [
    [CPF_REGEX, '[CPF_REDACTED]'],
    [BEARER_OR_JWT_REGEX, '[TOKEN_REDACTED]'],
    [MEDICAL_RECORD_SECRET_REGEX, '[DADO_CLINICO_REDACTED]'],
    [CREDIT_CARD_REGEX, '[CARD_REDACTED]'],
  ];

  for (const [regex, placeholder] of patterns) {
    cleanValue = cleanValue.replace(regex, () => {
      wasRedacted = true;
      return placeholder;
    });
  }

  // Remove tags HTML/scripts e quebras de controle de template injection
  cleanValue = cleanValue.replace(/<[^>]*>/g, '').replace(/\{\{|\}\}/g, '');

  return { cleanValue: cleanValue.trim(), wasRedacted };
}

export function sanitizeWhatsAppTemplatePayload(
  input: TemplateVariableInput,
): SanitizedTemplateResult {
  const allowedSet = new Set(input.allowedVariables);
  const redactedVariables: string[] = [];
  const blockedForbiddenVariables: string[] = [];

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

  const renderedText = input.templateBody.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, varName) => {
    const key = String(varName);
    if (!allowedSet.has(key)) {
      blockedForbiddenVariables.push(key);
      return '';
    }
    const rawVal = input.variables[key] ?? '';
    const { cleanValue, wasRedacted } = sanitizeFreeTextVariable(String(rawVal));
    if (wasRedacted) {
      redactedVariables.push(key);
    }
    return cleanValue;
  });

  return {
    renderedText,
    redactedVariables,
    blockedForbiddenVariables,
  };
}

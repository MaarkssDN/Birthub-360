export interface IndirectPromptInjectionVerdict {
  safe: boolean;
  sanitizedText: string;
  detectedThreats: (
    | 'SYSTEM_PROMPT_OVERRIDE'
    | 'ROLE_DELIMITER_FORGERY'
    | 'TOOL_INVOCATION_HIJACK'
    | 'MARKDOWN_EXFILTRATION_LINK'
    | 'INVISIBLE_UNICODE_SMUGGLING'
  )[];
}

const SYSTEM_OVERRIDE_REGEX =
  /\b(?:ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions|disregard\s+(?:all\s+)?(?:previous|system)\s+(?:instructions|prompts)|esqueça\s+todas\s+as\s+instruções\s+anteriores|ignore\s+as\s+regras\s+do\s+sistema)\b/i;

const ROLE_DELIMITER_REGEX =
  /(?:<\|im_start\|>|<\|system\|>|\[SYSTEM\s*INSTRUCTION\]|###\s*System\s*:|<system_prompt>)/i;

const TOOL_HIJACK_REGEX =
  /\b(?:call_tool|execute_tool|invoke_tool|drop\s+table|delete_all_leads|export_all_tenants)\s*\(/i;

const MARKDOWN_EXFIL_REGEX = /!\[[^\]]*\]\(https?:\/\/[^)\s]+\?(?:[^)\s]*=)/i;

const INVISIBLE_UNICODE_REGEX = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g;

/** Limite máximo de caracteres para evitar ReDoS / exaustão de CPU e tokens (handoff 99->70/77). */
const MAX_UNTRUSTED_PROMPT_FIELD_LENGTH = 8_000;

export function inspectIndirectPromptInjection(
  untrustedFieldText: string,
): IndirectPromptInjectionVerdict {
  const boundedInput =
    typeof untrustedFieldText === 'string'
      ? untrustedFieldText.slice(0, MAX_UNTRUSTED_PROMPT_FIELD_LENGTH)
      : '';
  const detectedThreats: IndirectPromptInjectionVerdict['detectedThreats'] = [];

  if (INVISIBLE_UNICODE_REGEX.test(boundedInput)) {
    detectedThreats.push('INVISIBLE_UNICODE_SMUGGLING');
  }
  const normalized = boundedInput.replace(INVISIBLE_UNICODE_REGEX, '');

  if (SYSTEM_OVERRIDE_REGEX.test(normalized)) {
    detectedThreats.push('SYSTEM_PROMPT_OVERRIDE');
  }
  if (ROLE_DELIMITER_REGEX.test(normalized)) {
    detectedThreats.push('ROLE_DELIMITER_FORGERY');
  }
  if (TOOL_HIJACK_REGEX.test(normalized)) {
    detectedThreats.push('TOOL_INVOCATION_HIJACK');
  }
  if (MARKDOWN_EXFIL_REGEX.test(normalized)) {
    detectedThreats.push('MARKDOWN_EXFILTRATION_LINK');
  }

  const sanitizedText = normalized
    .replace(SYSTEM_OVERRIDE_REGEX, '[BLOCKED_INSTRUCTION_OVERRIDE]')
    .replace(ROLE_DELIMITER_REGEX, '[BLOCKED_ROLE_DELIMITER]')
    .replace(TOOL_HIJACK_REGEX, '[BLOCKED_TOOL_HIJACK](')
    .replace(MARKDOWN_EXFIL_REGEX, '[BLOCKED_EXTERNAL_IMAGE]');

  return {
    safe: detectedThreats.length === 0,
    sanitizedText,
    detectedThreats,
  };
}

/**
 * Envolve um campo de texto não-confiável (nome de lead, histórico, e-mail, chat) em um
 * fence XML delimitado após aplicar `inspectIndirectPromptInjection` e escape de tags
 * de fechamento — previne `js/system-prompt-injection` (handoff 99->70/77).
 */
export function fenceUntrustedPromptField(label: string, untrustedFieldText: string): string {
  const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, '_') || 'untrusted_data';
  const verdict = inspectIndirectPromptInjection(untrustedFieldText);
  const escapedContent = verdict.sanitizedText
    .replace(/<\s*\/?\s*untrusted_field[^>]*>/gi, '[BLOCKED_FENCE_TAG]')
    .trim();
  return `<untrusted_field name="${safeLabel}">\n${escapedContent}\n</untrusted_field>`;
}

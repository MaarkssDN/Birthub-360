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

export function inspectIndirectPromptInjection(
  untrustedFieldText: string,
): IndirectPromptInjectionVerdict {
  const detectedThreats: IndirectPromptInjectionVerdict['detectedThreats'] = [];

  if (INVISIBLE_UNICODE_REGEX.test(untrustedFieldText)) {
    detectedThreats.push('INVISIBLE_UNICODE_SMUGGLING');
  }
  const normalized = untrustedFieldText.replace(INVISIBLE_UNICODE_REGEX, '');

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

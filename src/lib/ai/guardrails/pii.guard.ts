/**
 * Guardrails para PII (Informações Pessoais Identificáveis)
 * Bloqueia CPF, CNPJ, telefone, email e cartão de crédito em respostas de IA
 *
 * Antes da detecção, o texto passa por `decodeTextEscapes` (unicode/hex
 * escapes e percent-encoding) e tokens codificados (Base64/hex) são
 * decodificados e revalidados — mitiga o bypass de PII por encoding
 * (handoff 14→07). Payloads com encoding múltiplo ou tokens < 12 chars
 * permanecem como limitação residual documentada.
 */
import { z } from 'zod';
import { decodeTextEscapes, findEncodedTokenSpans } from './encoding.js';

const CPF_PATTERN = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;
const CNPJ_PATTERN = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;
const PHONE_PATTERN = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/g;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const CREDIT_CARD_PATTERN = /\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}/g;

/**
 * Domínios de email autorizados/isentos de bloqueio de PII
 * - @birthhub360.com e @birthhub360.com.br: domínio interno corporativo da plataforma
 * - @example.com, @example.org, @example.net: domínios RFC 2606 reservados para testes, documentação e Golden Dataset
 * - @email.com: domínio de preenchimento/placeholder genérico frequentemente gerado por modelos em templates (ex.: seu@email.com)
 */
const ALLOWED_EMAIL_DOMAINS = [
  '@birthhub360.com',
  '@birthhub360.com.br',
  '@example.com',
  '@example.org',
  '@example.net',
  '@email.com',
] as const;

const PLACEHOLDER_EMAIL_REGEX =
  /^(?:seu|seu\.email|seuemail|contato|exemplo|teste|usuario|user)@(email\.com|empresa\.com|empresa\.com\.br|suaempresa\.com|dominio\.com)$/i;

function isAllowedEmail(email: string): boolean {
  const lower = email.toLowerCase();
  if (PLACEHOLDER_EMAIL_REGEX.test(lower)) return true;
  return ALLOWED_EMAIL_DOMAINS.some((domain) => lower.endsWith(domain));
}

export interface GuardrailResult {
  blocked: boolean;
  redacted?: string;
  reason?: string;
  matches: string[];
}

/** Coleta todos os matches de PII de um texto (já decodificado ou candidato). */
function collectPiiMatches(text: string): string[] {
  const matches: string[] = [];

  const cpfMatches = text.match(CPF_PATTERN);
  if (cpfMatches) matches.push(...cpfMatches);

  const cnpjMatches = text.match(CNPJ_PATTERN);
  if (cnpjMatches) matches.push(...cnpjMatches);

  const phoneMatches = text.match(PHONE_PATTERN);
  if (phoneMatches) matches.push(...phoneMatches);

  const emailMatches = text.match(EMAIL_PATTERN);
  if (emailMatches) {
    const externalEmails = emailMatches.filter((e) => !isAllowedEmail(e));
    if (externalEmails.length > 0) matches.push(...externalEmails);
  }

  const creditCardMatches = text.match(CREDIT_CARD_PATTERN);
  if (creditCardMatches) matches.push(...creditCardMatches);

  return matches;
}

export function detectPII(text: string): GuardrailResult {
  // Visão decodificada de escapes (unicode/hex/%XX) + tokens codificados
  // (Base64/hex) revalidados — fecha o bypass de PII por encoding.
  const normalized = decodeTextEscapes(text);
  const matches = collectPiiMatches(normalized);
  for (const span of findEncodedTokenSpans(normalized)) {
    matches.push(...collectPiiMatches(span.decoded));
  }

  if (matches.length > 0) {
    return {
      blocked: true,
      reason: 'PII detected in response',
      matches,
    };
  }

  return {
    blocked: false,
    matches: [],
  };
}

export function redactPII(text: string): { redacted: string; matches: string[] } {
  const matches: string[] = [];
  const normalized = decodeTextEscapes(text);
  let redacted = normalized;

  const cpfMatches = normalized.match(CPF_PATTERN);
  if (cpfMatches) {
    matches.push(...cpfMatches);
    redacted = redacted.replace(CPF_PATTERN, '[CPF_REDACTED]');
  }

  const cnpjMatches = normalized.match(CNPJ_PATTERN);
  if (cnpjMatches) {
    matches.push(...cnpjMatches);
    redacted = redacted.replace(CNPJ_PATTERN, '[CNPJ_REDACTED]');
  }

  const phoneMatches = normalized.match(PHONE_PATTERN);
  if (phoneMatches) {
    matches.push(...phoneMatches);
    redacted = redacted.replace(PHONE_PATTERN, '[PHONE_REDACTED]');
  }

  const emailMatches = normalized.match(EMAIL_PATTERN);
  if (emailMatches) {
    const externalEmails = emailMatches.filter((e) => !isAllowedEmail(e));
    if (externalEmails.length > 0) {
      matches.push(...externalEmails);
      redacted = redacted.replace(EMAIL_PATTERN, (match) => {
        return isAllowedEmail(match) ? match : '[EMAIL_REDACTED]';
      });
    }
  }

  const creditCardMatches = normalized.match(CREDIT_CARD_PATTERN);
  if (creditCardMatches) {
    matches.push(...creditCardMatches);
    redacted = redacted.replace(CREDIT_CARD_PATTERN, '[CREDIT_CARD_REDACTED]');
  }

  // Tokens codificados (Base64/hex) cujo conteúdo decodificado contém PII:
  // não é possível redigir dentro do token, então o span inteiro é substituído.
  for (const span of findEncodedTokenSpans(normalized)) {
    const spanMatches = collectPiiMatches(span.decoded);
    if (spanMatches.length > 0) {
      matches.push(...spanMatches);
      redacted = redacted.split(span.raw).join('[ENCODED_PII_REDACTED]');
    }
  }

  if (matches.length === 0) {
    // Sem PII: devolve o texto original (não a visão decodificada), preservando
    // escapes/percent-encoding legítimos do conteúdo.
    return { redacted: text, matches: [] };
  }

  return { redacted, matches };
}

export const PIISchema = z.object({
  blocked: z.boolean(),
  redacted: z.string().optional(),
  reason: z.string().optional(),
  matches: z.array(z.string()),
});

/**
 * Decodificação candidata para guardrails de IA.
 *
 * Mitiga o bypass de detecção de PII/toxicidade por encoding (handoff
 * 14→07, onda IA-1): respostas do provider que embutem o conteúdo sensível em
 * Base64, hexadecimal, unicode/hex escapes (`\uXXXX`, `\xNN`) ou
 * percent-encoding (`%XX`) passam a ser revalidadas após decodificação.
 *
 * Princípios:
 * - Custo limitado: tokens são decodificados no máximo uma vez por span e o
 *   resultado só é aproveitado se for majoritariamente texto imprimível.
 * - Fail-safe: qualquer erro de decodificação simplesmente descarta o
 *   candidato — nunca derruba a detecção do texto cru.
 * - Uma camada apenas: payloads com encoding duplo não são cobertos
 *   (limitação documentada no handoff).
 */

/** Span codificado encontrado no texto: trecho original + melhor candidato decodificado. */
export interface EncodedTokenSpan {
  /** Trecho literal presente no texto (token base64/hex). */
  raw: string;
  /** Texto decodificado, somente se majoritariamente imprimível. */
  decoded: string;
}

// Tokens codificados precisam de >= 12 chars: o menor PII relevante
// (CPF/CNPJ/cartão) codificado em base64 tem ~16+ chars; abaixo disso o custo
// de falsos candidatos não compensa.
const MAX_TOKEN_SPANS = 64;
const MAX_DECODED_LENGTH = 8192;

// Base64/Base64URL delimitado: o lookbehind impede casar substring no meio de
// token maior, mas permite '=' antes (formato comum "chave=payload"). O
// lookahead rejeita '=' depois do padding para não aceitar token malformado.
const BASE64_TOKEN_PATTERN = /(?<![A-Za-z0-9+/_-])[A-Za-z0-9+/_-]{12,}={0,2}(?![A-Za-z0-9+/_=-])/g;
// Hex com ou sem prefixo 0x. Dígitos puros também casam — o filtro de
// "texto imprimível" descarta a maioria dos falsos candidatos.
const HEX_TOKEN_PATTERN = /\b(?:0x[0-9a-fA-F]{12,}|[0-9a-fA-F]{12,})\b/g;
const UNICODE_ESCAPE_PATTERN = /\\u[0-9a-fA-F]{4}|\\x[0-9a-fA-F]{2}/;
const UNICODE_ESCAPE_GLOBAL = /\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})/g;
const PERCENT_ESCAPE_PATTERN = /%[0-9a-fA-F]{2}/;
const PERCENT_RUN_PATTERN = /%(?:[0-9a-fA-F]{2})+/g;
const PERCENT_BYTE_PATTERN = /%([0-9a-fA-F]{2})/g;

function isMostlyPrintable(text: string): boolean {
  if (text.length === 0) return false;
  let bad = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    const printable =
      (cp >= 0x20 && cp <= 0x7e) ||
      cp === 0x09 ||
      cp === 0x0a ||
      cp === 0x0d ||
      (cp >= 0xa0 && cp <= 0xd7ff) ||
      (cp >= 0xe000 && cp <= 0xfffd);
    if (!printable) {
      bad += 1;
      if (bad > text.length * 0.1) return false;
    }
  }
  return true;
}

function decodeBase64Token(raw: string): string | null {
  // Normaliza Base64URL (- e _ viram + e /) antes de decodificar.
  const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const decoded = Buffer.from(normalized, 'base64').toString('utf8');
    if (decoded.length === 0 || decoded.length > MAX_DECODED_LENGTH) return null;
    return isMostlyPrintable(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function decodeHexToken(raw: string): string | null {
  const hex = raw.toLowerCase().startsWith('0x') ? raw.slice(2) : raw;
  if (hex.length % 2 !== 0) return null;
  try {
    const decoded = Buffer.from(hex, 'hex').toString('utf8');
    if (decoded.length === 0 || decoded.length > MAX_DECODED_LENGTH) return null;
    return isMostlyPrintable(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * Decodifica escapes de texto no corpo inteiro (unicode `\uXXXX`/`\xNN` e
 * percent-encoding `%XX`, incluindo sequências intercaladas com texto plano).
 * Retorna o texto original quando não há escapes — custo de um `test` por tipo.
 */
export function decodeTextEscapes(text: string): string {
  let out = text;

  if (PERCENT_ESCAPE_PATTERN.test(out)) {
    out = out.replace(PERCENT_RUN_PATTERN, (run) => {
      try {
        // decodeURIComponent resolve sequências UTF-8 multi-byte corretamente.
        return decodeURIComponent(run);
      } catch {
        // Fallback byte-a-byte (ex.: sequências UTF-8 incompletas isoladas).
        return run.replace(PERCENT_BYTE_PATTERN, (_m, hex: string) =>
          String.fromCharCode(Number.parseInt(hex, 16)),
        );
      }
    });
  }

  if (UNICODE_ESCAPE_PATTERN.test(out)) {
    out = out.replace(UNICODE_ESCAPE_GLOBAL, (_m, u: string | undefined, x: string | undefined) =>
      String.fromCharCode(Number.parseInt(u ?? x ?? '0', 16)),
    );
  }

  return out;
}

/**
 * Encontra tokens codificados (Base64/Base64URL e hex) no texto e devolve os
 * candidatos decodificados imprimíveis. Limitado a MAX_TOKEN_SPANS spans e
 * deduplicado pelo conteúdo decodificado.
 */
export function findEncodedTokenSpans(text: string): EncodedTokenSpan[] {
  const spans: EncodedTokenSpan[] = [];
  const seenDecoded = new Set<string>();

  const push = (raw: string, decoded: string | null) => {
    if (!decoded || seenDecoded.has(decoded) || spans.length >= MAX_TOKEN_SPANS) return;
    seenDecoded.add(decoded);
    spans.push({ raw, decoded });
  };

  for (const match of text.matchAll(BASE64_TOKEN_PATTERN)) {
    push(match[0], decodeBase64Token(match[0]));
  }
  for (const match of text.matchAll(HEX_TOKEN_PATTERN)) {
    push(match[0], decodeHexToken(match[0]));
  }

  return spans;
}

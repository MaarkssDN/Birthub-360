// src/lib/security/piiMask.ts
//
// Máscara irreversível de PII em texto livre (logs, mensagens de erro,
// telemetria). Irmã do piiTokenizer.service.ts — mesma base de regexes,
// mas SEM tokenização reversível: uso exclusivo para sanitização de saída.
//
// Mantida em módulo próprio para evitar ciclo de import:
// piiTokenizer.service.ts importa logger.ts, e logger.ts precisa desta
// função no hook de log.

export const CPF_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
export const CNPJ_REGEX = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
export const PHONE_REGEX = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})[-.\s]?\d{4}\b/g;
export const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

/**
 * Substitui CPF, CNPJ, e-mail e telefone por marcadores irreversíveis.
 * Seguro para logs — nunca reintroduz o valor original.
 */
export function maskPiiInText(text: string): string {
  return text
    .replace(CPF_REGEX, '[CPF_OCULTO]')
    .replace(CNPJ_REGEX, '[CNPJ_OCULTO]')
    .replace(EMAIL_REGEX, '[EMAIL_OCULTO]')
    .replace(PHONE_REGEX, '[TELEFONE_OCULTO]');
}

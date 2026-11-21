import { z } from 'zod';

/**
 * Utilitários de sanitização anti-injeção e anti-XSS para schemas Zod
 * Agente 21 (Zara)
 */

/**
 * Remove tags HTML e scripts suspeitos de qualquer entrada de texto.
 */
export function stripHtmlTags(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Escapa caracteres especiais HTML para prevenir renderização não-segura.
 */
export function escapeHtmlChars(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (match) => map[match] || match);
}

/**
 * Sanitiza texto completo: remove tags perigosas, remove caracteres de controle nulos e dá trim.
 */
export function sanitizePlainText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Remove bytes nulos e caracteres de controle invisíveis
  const clean = input.replace(/\0/g, '').replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
  return stripHtmlTags(clean);
}

/**
 * Zod helper para string sanitizada obrigatória (trim e remoção de tags).
 */
export const sanitizedString = (minLength = 1, message?: string) =>
  z
    .string()
    .transform((val) => sanitizePlainText(val))
    .refine((val) => val.length >= minLength, {
      message: message || `Campo deve ter no mínimo ${minLength} caracteres após sanitização`,
    });

/**
 * Zod helper para string sanitizada opcional / nullable.
 */
export const sanitizedOptionalString = () =>
  z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      const cleaned = sanitizePlainText(val);
      return cleaned.length > 0 ? cleaned : null;
    });

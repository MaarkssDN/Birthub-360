import { z } from 'zod';
import {
  LANDING_DEMO_CONSENT_PURPOSES,
  LANDING_DEMO_CONSENT_VERSION,
  LANDING_LEAD_EQUIPE_VALUES,
} from '../../shared/contracts/publicLead.constants.js';

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * WhatsApp brasileiro: 10 ou 11 dígitos (com DDD), ou 12/13 com o prefixo 55.
 * Aceita máscara `(11) 99999-9999` — a normalização acontece depois da validação.
 */
export function isValidBrWhatsapp(raw: string): boolean {
  const digits = digitsOnly(raw);
  if (digits.startsWith('55')) {
    return digits.length === 12 || digits.length === 13;
  }
  return digits.length === 10 || digits.length === 11;
}

export function normalizeBrWhatsapp(raw: string): string {
  const digits = digitsOnly(raw);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export function isHoneypotFilled(website: unknown): boolean {
  if (website == null) return false;
  if (typeof website === 'string') return website.trim().length > 0;
  return true;
}

export const publicLeadSchema = z.object({
  nome: z.string({ error: 'required' }).trim().min(2, 'required').max(200, 'invalid'),
  email: z
    .string({ error: 'required' })
    .trim()
    .email('invalid')
    .max(320, 'invalid')
    .transform((value) => value.toLowerCase()),
  whatsapp: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z
      .string()
      .trim()
      .max(40, 'invalid')
      .refine(isValidBrWhatsapp, 'invalid')
      .transform(normalizeBrWhatsapp)
      .optional(),
  ),
  equipe: z.enum(LANDING_LEAD_EQUIPE_VALUES, { error: 'invalid' }),
  consent: z.literal(true, { error: 'required' }),
  consentTextVersion: z.literal(LANDING_DEMO_CONSENT_VERSION, { error: 'stale' }),
  purpose: z.enum(LANDING_DEMO_CONSENT_PURPOSES, { error: 'invalid' }),
  // Honeypot: o schema aceita qualquer valor para não vazar o campo na validação;
  // a rota recusa preenchimento antes de persistir, respondendo o mesmo 202 genérico.
  website: z.unknown().optional(),
});

export type PublicLeadInput = z.infer<typeof publicLeadSchema>;

const FIELD_ERROR_FALLBACK: Record<string, string> = {
  nome: 'required',
  email: 'invalid',
  whatsapp: 'invalid',
  equipe: 'invalid',
  consent: 'required',
  consentTextVersion: 'stale',
  purpose: 'invalid',
};

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'payload');
    if (fields[key]) continue;
    if (issue.message === 'required' || issue.message === 'invalid' || issue.message === 'stale') {
      fields[key] = issue.message;
      continue;
    }
    fields[key] = FIELD_ERROR_FALLBACK[key] ?? 'invalid';
  }
  return fields;
}

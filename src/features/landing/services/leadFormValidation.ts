export type LeadFormValues = {
  nome: string;
  email: string;
  whatsapp: string;
  equipe: string;
  consent: boolean;
};

export type LeadFormField = 'nome' | 'email' | 'whatsapp' | 'consent';

export type LeadFieldErrors = Partial<Record<LeadFormField, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Extrai os dígitos de um WhatsApp brasileiro.
 * Remove o DDI 55 quando o restante tiver 10 ou 11 dígitos (DDD + número).
 */
export function normalizeBrazilianWhatsapp(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  return digits;
}

export function isValidBrazilianWhatsapp(value: string): boolean {
  const digits = normalizeBrazilianWhatsapp(value);
  return digits.length === 10 || digits.length === 11;
}

export function isValidLeadEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function validateLeadForm(values: LeadFormValues): LeadFieldErrors {
  const errors: LeadFieldErrors = {};

  if (values.nome.trim().length < 2) {
    errors.nome = 'Informe seu nome completo.';
  }

  if (!isValidLeadEmail(values.email)) {
    errors.email = 'Informe um e-mail válido.';
  }

  if (!isValidBrazilianWhatsapp(values.whatsapp)) {
    errors.whatsapp = 'Informe um WhatsApp com DDD (10 ou 11 dígitos).';
  }

  if (!values.consent) {
    errors.consent = 'É necessário autorizar o tratamento dos dados para enviar a solicitação.';
  }

  return errors;
}

export const LEAD_FIELD_ORDER: LeadFormField[] = ['nome', 'email', 'whatsapp', 'consent'];

export function getFirstInvalidLeadField(errors: LeadFieldErrors): LeadFormField | null {
  return LEAD_FIELD_ORDER.find((field) => Boolean(errors[field])) ?? null;
}

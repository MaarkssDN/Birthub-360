import { LEAD_TEAM_SIZES, type LeadTeamSize } from './submitLead';

export type LeadFormValues = {
  nome: string;
  email: string;
  whatsapp: string;
  equipe: LeadTeamSize | string;
  consent: boolean;
  website?: string;
};

export type LeadFormField = 'nome' | 'email' | 'whatsapp' | 'consent' | 'equipe';

export type LeadFieldErrors = Partial<Record<LeadFormField, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SERVER_FIELD_MESSAGES: Record<LeadFormField, Record<string, string>> = {
  nome: {
    required: 'Informe seu nome completo.',
    invalid: 'Informe um nome válido.',
  },
  email: {
    required: 'Informe um e-mail válido.',
    invalid: 'Informe um e-mail válido.',
  },
  whatsapp: {
    required: 'Informe um WhatsApp com DDD (10 ou 11 dígitos).',
    invalid: 'Informe um WhatsApp com DDD (10 ou 11 dígitos).',
  },
  consent: {
    required: 'É necessário autorizar o tratamento dos dados para enviar a solicitação.',
    invalid: 'É necessário autorizar o tratamento dos dados para enviar a solicitação.',
  },
  equipe: {
    required: 'Selecione o tamanho da equipe comercial.',
    invalid: 'Selecione o tamanho da equipe comercial.',
  },
};

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

export function isValidLeadTeamSize(value: string): value is LeadTeamSize {
  return (LEAD_TEAM_SIZES as readonly string[]).includes(value);
}

export function validateLeadForm(values: LeadFormValues): LeadFieldErrors {
  const errors: LeadFieldErrors = {};

  if (values.nome.trim().length < 2) {
    errors.nome = 'Informe seu nome completo.';
  }

  if (!isValidLeadEmail(values.email)) {
    errors.email = 'Informe um e-mail válido.';
  }

  if (values.whatsapp.trim() && !isValidBrazilianWhatsapp(values.whatsapp)) {
    errors.whatsapp = 'Informe um WhatsApp com DDD (10 ou 11 dígitos).';
  }

  if (!isValidLeadTeamSize(values.equipe)) {
    errors.equipe = 'Selecione o tamanho da equipe comercial.';
  }

  if (!values.consent) {
    errors.consent = 'É necessário autorizar o tratamento dos dados para enviar a solicitação.';
  }

  return errors;
}

export const LEAD_FIELD_ORDER: LeadFormField[] = ['nome', 'email', 'whatsapp', 'equipe', 'consent'];

export function getFirstInvalidLeadField(errors: LeadFieldErrors): LeadFormField | null {
  return LEAD_FIELD_ORDER.find((field) => Boolean(errors[field])) ?? null;
}

export function mapLeadServerFieldErrors(fields: Record<string, string>): {
  fieldErrors: LeadFieldErrors;
  formMessage: string | null;
} {
  const fieldErrors: LeadFieldErrors = {};
  const unmapped: string[] = [];

  for (const [key, issue] of Object.entries(fields)) {
    if (
      key === 'nome' ||
      key === 'email' ||
      key === 'whatsapp' ||
      key === 'consent' ||
      key === 'equipe'
    ) {
      const messages = SERVER_FIELD_MESSAGES[key];
      fieldErrors[key] = messages[issue] ?? messages.invalid ?? messages.required;
      continue;
    }
    unmapped.push(key);
  }

  let formMessage: string | null = null;
  if (unmapped.includes('consentTextVersion') && fields.consentTextVersion === 'stale') {
    formMessage =
      'A versão do termo de consentimento está desatualizada. Recarregue a página e tente novamente.';
  } else if (unmapped.length > 0) {
    formMessage = 'Não foi possível enviar seus dados. Revise as informações e tente novamente.';
  }

  return { fieldErrors, formMessage };
}

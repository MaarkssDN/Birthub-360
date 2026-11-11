/**
 * Cliente de captura de lead da landing.
 *
 * O contrato HTTP ainda é responsabilidade do Agente 01
 * (handoff `.agents/handoffs/onda-landing-360-auditoria/02-para-01-endpoint-captura-lead.md`).
 * Este módulo não inventa a rota: enquanto `LEAD_CAPTURE_ENDPOINT` permanecer indefinido
 * ou com o placeholder, `submitLead` rejeita com erro tipado "endpoint indisponível"
 * e nunca simula sucesso.
 */

export const LEAD_CAPTURE_ENDPOINT_PLACEHOLDER = 'PENDENTE_CONTRATO_AGENTE_01';

/**
 * PENDENTE do contrato do Agente 01.
 * Substituir pelo caminho real somente quando o contrato for publicado.
 * Não inventar a rota.
 */
export const LEAD_CAPTURE_ENDPOINT: string = LEAD_CAPTURE_ENDPOINT_PLACEHOLDER;

/**
 * Versão do texto de consentimento exibido no formulário.
 * A alinhar com o contrato do Agente 01 e a validação do Agente 21.
 * Não criar texto legal novo sem o OK do Marcelo / Agente 21.
 */
export const LEAD_CONSENT_TEXT_VERSION = 'landing-demo-v1';

/**
 * Finalidade declarada no texto atual de consentimento
 * ("tratamento dos dados estritamente para agendamento da demonstração").
 * A alinhar com o contrato do Agente 01 e a validação do Agente 21.
 */
export const LEAD_CONSENT_PURPOSE = 'agendamento da demonstração';

export type LeadConsentMetadata = {
  /** Versão do texto exibido. A alinhar com 01/21. */
  textVersion: string;
  /** Finalidade declarada. A alinhar com 01/21. */
  purpose: string;
  /** Timestamp ISO gerado no cliente no momento do envio. A alinhar com 01/21. */
  timestamp: string;
};

export type LeadCapturePayload = {
  nome: string;
  email: string;
  whatsapp: string;
  equipe: string;
  consent: boolean;
  /** Metadados de consentimento — a alinhar com 01/21. */
  consentMetadata: LeadConsentMetadata;
};

export type LeadSubmitErrorCode =
  | 'endpoint_unavailable'
  | 'network'
  | 'validation'
  | 'rate_limit'
  | 'server';

export class LeadSubmitError extends Error {
  readonly code: LeadSubmitErrorCode;
  readonly status?: number;

  constructor(code: LeadSubmitErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'LeadSubmitError';
    this.code = code;
    this.status = status;
  }
}

export const LEAD_SUBMIT_USER_MESSAGES: Record<LeadSubmitErrorCode, string> = {
  endpoint_unavailable: 'O envio ainda não está disponível. Tente novamente em instantes.',
  network: 'Não foi possível conectar. Verifique sua conexão e tente novamente.',
  validation: 'Não foi possível enviar seus dados. Revise as informações e tente novamente.',
  rate_limit: 'Muitas tentativas. Aguarde alguns instantes e tente novamente.',
  server: 'Estamos com instabilidade no momento. Tente novamente em instantes.',
};

export function isLeadCaptureEndpointConfigured(endpoint: string = LEAD_CAPTURE_ENDPOINT): boolean {
  const trimmed = endpoint.trim();
  return trimmed.length > 0 && trimmed !== LEAD_CAPTURE_ENDPOINT_PLACEHOLDER;
}

export function isLeadSubmitError(error: unknown): error is LeadSubmitError {
  return error instanceof LeadSubmitError;
}

export function getLeadSubmitErrorMessage(error: unknown): string {
  if (isLeadSubmitError(error)) {
    return LEAD_SUBMIT_USER_MESSAGES[error.code];
  }
  return LEAD_SUBMIT_USER_MESSAGES.network;
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

export type SubmitLeadOptions = {
  signal?: AbortSignal;
};

/**
 * Envia o payload para um endpoint explícito. Usado pelos testes e por `submitLead`.
 * Sucesso somente com resposta HTTP 2xx. Nunca simula sucesso.
 */
export async function submitLeadToEndpoint(
  endpoint: string,
  payload: LeadCapturePayload,
  options: SubmitLeadOptions = {},
): Promise<void> {
  if (!isLeadCaptureEndpointConfigured(endpoint)) {
    throw new LeadSubmitError(
      'endpoint_unavailable',
      LEAD_SUBMIT_USER_MESSAGES.endpoint_unavailable,
    );
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: options.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new LeadSubmitError('network', LEAD_SUBMIT_USER_MESSAGES.network);
  }

  if (response.ok) {
    return;
  }

  if (response.status === 429) {
    throw new LeadSubmitError('rate_limit', LEAD_SUBMIT_USER_MESSAGES.rate_limit, 429);
  }

  if (response.status >= 400 && response.status < 500) {
    throw new LeadSubmitError('validation', LEAD_SUBMIT_USER_MESSAGES.validation, response.status);
  }

  throw new LeadSubmitError('server', LEAD_SUBMIT_USER_MESSAGES.server, response.status);
}

/**
 * Envio oficial do formulário da landing. Usa apenas `LEAD_CAPTURE_ENDPOINT`.
 */
export async function submitLead(
  payload: LeadCapturePayload,
  options: SubmitLeadOptions = {},
): Promise<void> {
  return submitLeadToEndpoint(LEAD_CAPTURE_ENDPOINT, payload, options);
}

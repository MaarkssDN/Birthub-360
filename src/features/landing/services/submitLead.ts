/**
 * Cliente de captura de lead da landing.
 *
 * Contrato final do Agente 01 (PR #216): POST /api/public/demo-leads, sem auth.
 * A rota vive somente nesta constante. Sucesso apenas com HTTP 202 e `{ ok: true }`.
 */

/** Única constante da rota de captura — contrato PR #216. */
export const LEAD_CAPTURE_ENDPOINT = '/api/public/demo-leads';

/**
 * Versão enviada no payload (`consentTextVersion`). Literal do contrato do Agente 01.
 *
 * TEXTO LEGAL PROVISÓRIO: o texto final exibido no formulário e o prazo de
 * retenção dependem do OK do Marcelo. Não tratar esta versão como aprovação
 * jurídica do copy provisório da UI.
 */
export const LEAD_CONSENT_TEXT_VERSION = 'landing-demo-v1';

/**
 * Finalidade enviada no payload (`purpose`). Lista fechada do contrato: hoje
 * apenas `agendamento_demonstracao`.
 */
export const LEAD_CONSENT_PURPOSE = 'agendamento_demonstracao';

export const LEAD_TEAM_SIZES = ['1 a 5', '6 a 15', '16 a 50', '50+'] as const;

export type LeadTeamSize = (typeof LEAD_TEAM_SIZES)[number];

export type LeadCapturePayload = {
  nome: string;
  email: string;
  /** Opcional: omitir a chave quando o titular não informar WhatsApp. */
  whatsapp?: string;
  equipe: LeadTeamSize;
  consent: true;
  consentTextVersion: typeof LEAD_CONSENT_TEXT_VERSION;
  purpose: typeof LEAD_CONSENT_PURPOSE;
  /** Honeypot. A UI envia string vazia; preenchido pelo bot não deve ser impedido no cliente. */
  website: string;
};

export type LeadSubmitErrorCode =
  | 'endpoint_unavailable'
  | 'network'
  | 'validation'
  | 'rate_limit'
  | 'unavailable'
  | 'server';

export type LeadServerFieldIssue = 'required' | 'invalid' | 'stale' | string;

export class LeadSubmitError extends Error {
  readonly code: LeadSubmitErrorCode;
  readonly status?: number;
  readonly fields?: Record<string, LeadServerFieldIssue>;

  constructor(
    code: LeadSubmitErrorCode,
    message: string,
    status?: number,
    fields?: Record<string, LeadServerFieldIssue>,
  ) {
    super(message);
    this.name = 'LeadSubmitError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export const LEAD_SUBMIT_USER_MESSAGES: Record<LeadSubmitErrorCode, string> = {
  endpoint_unavailable: 'O envio ainda não está disponível. Tente novamente em instantes.',
  network: 'Não foi possível conectar. Verifique sua conexão e tente novamente.',
  validation: 'Não foi possível enviar seus dados. Revise as informações e tente novamente.',
  rate_limit:
    'Muitas tentativas. O limite é de 5 envios a cada 15 minutos. Aguarde e tente novamente.',
  unavailable: 'O envio está temporariamente indisponível. Tente novamente em instantes.',
  server: 'Estamos com instabilidade no momento. Tente novamente em instantes.',
};

export function isLeadCaptureEndpointConfigured(endpoint: string = LEAD_CAPTURE_ENDPOINT): boolean {
  const trimmed = endpoint.trim();
  return trimmed.length > 0 && trimmed !== 'PENDENTE_CONTRATO_AGENTE_01';
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

type LeadCaptureResponseBody = {
  ok?: unknown;
  error?: unknown;
  fields?: unknown;
};

function readResponseBody(data: unknown): LeadCaptureResponseBody {
  if (!data || typeof data !== 'object') {
    return {};
  }
  return data as LeadCaptureResponseBody;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isSuccessBody(body: unknown): boolean {
  return readResponseBody(body).ok === true;
}

function readFieldErrors(
  body: LeadCaptureResponseBody,
): Record<string, LeadServerFieldIssue> | undefined {
  if (!body.fields || typeof body.fields !== 'object' || Array.isArray(body.fields)) {
    return undefined;
  }
  const fields: Record<string, LeadServerFieldIssue> = {};
  for (const [key, value] of Object.entries(body.fields as Record<string, unknown>)) {
    if (typeof value === 'string' && value.length > 0) {
      fields[key] = value;
    }
  }
  return Object.keys(fields).length > 0 ? fields : undefined;
}

/**
 * Envia o payload para um endpoint explícito. Usado pelos testes e por `submitLead`.
 * Sucesso somente com HTTP 202 e `{ ok: true }`. Nunca simula sucesso.
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

  const body = await parseResponseBody(response);

  if (response.status === 202 && isSuccessBody(body)) {
    return;
  }

  const parsed = readResponseBody(body);
  const errorCode = typeof parsed.error === 'string' ? parsed.error : undefined;

  if (response.status === 429 || errorCode === 'rate_limited') {
    throw new LeadSubmitError('rate_limit', LEAD_SUBMIT_USER_MESSAGES.rate_limit, 429);
  }

  if (response.status === 503 || errorCode === 'unavailable') {
    throw new LeadSubmitError(
      'unavailable',
      LEAD_SUBMIT_USER_MESSAGES.unavailable,
      response.status,
    );
  }

  if (response.status === 400 || errorCode === 'invalid_payload') {
    throw new LeadSubmitError(
      'validation',
      LEAD_SUBMIT_USER_MESSAGES.validation,
      response.status,
      readFieldErrors(parsed),
    );
  }

  if (response.status >= 400 && response.status < 500) {
    throw new LeadSubmitError(
      'validation',
      LEAD_SUBMIT_USER_MESSAGES.validation,
      response.status,
      readFieldErrors(parsed),
    );
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

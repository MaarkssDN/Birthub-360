import { api } from '../../../lib/api.js';

/**
 * Cliente do canal público de solicitação DSR (LGPD art. 18) — handoff
 * `.agents/handoffs/onda-W7/01-para-02-paginas-publicas-dsr-lgpd.md`.
 *
 * Endpoints públicos (SEM sessão — o titular ainda não tem conta), montados pelo
 * Agente 01 em `/api/public/data-subject-requests`:
 * - POST /            → 202 { ok:true } sempre (anti-enumeração)
 * - POST /verify      → 200 { ok:true, status, package? } | erros { ok:false, error }
 * - GET  /status/:t   → 200 { ok:true, protocol, rightType, status, createdAt, verifiedAt }
 *
 * Contrato depende do merge da branch do Agente 01 (PR #381) — até lá estas
 * chamadas retornam 404/erro de conexão e a UI cai nos estados de erro
 * amigáveis abaixo.
 */

export const DSR_RIGHT_TYPES = [
  'ACCESS',
  'PORTABILITY',
  'CORRECTION',
  'ERASURE',
  'CONSENT_REVOCATION',
  'SHARING_INFO',
] as const;

export type DsrRightType = (typeof DSR_RIGHT_TYPES)[number];

export interface DsrRequestPayload {
  email: string;
  rightType: DsrRightType;
  preferredChannel?: 'email' | 'whatsapp';
  details?: string;
}

export interface DsrVerifyResult {
  status: 'COMPLETED' | 'IN_PROGRESS';
  /** Dossiê JSON serializado — presente só para ACCESS/PORTABILITY. */
  package?: string;
}

export interface DsrStatusResult {
  protocol: string;
  rightType: DsrRightType;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  verifiedAt: string | null;
}

/** Códigos de erro do contrato → mensagem amigável em PT-BR (sem detalhe técnico). */
export function dsrErrorMessage(err: unknown, fallback: string): string {
  const code = err instanceof Error ? err.message : '';
  switch (code) {
    case 'invalid_or_expired_token':
    case 'invalid_payload':
      return 'Este link é inválido ou já expirou. Se o problema continuar, fale com o DPO pelo e-mail da Política de Privacidade.';
    case 'subject_not_found':
      return 'Não encontramos dados pessoais vinculados a este pedido. Se isso estiver incorreto, fale com o DPO.';
    case 'unavailable':
      return 'O serviço de privacidade está temporariamente indisponível. Tente novamente em instantes ou use o canal do DPO.';
    default:
      return fallback;
  }
}

export const dsrApi = {
  submitRequest: (payload: DsrRequestPayload) =>
    api.post<{ ok: boolean }>('/api/public/data-subject-requests', payload),

  verify: (protocol: string, token: string) =>
    api.post<{ ok: boolean } & DsrVerifyResult>('/api/public/data-subject-requests/verify', {
      protocol,
      token,
    }),

  status: (statusToken: string) =>
    api.get<{ ok: boolean } & DsrStatusResult>(
      `/api/public/data-subject-requests/status/${encodeURIComponent(statusToken)}`,
    ),
};

export function downloadDsrPackage(protocol: string, jsonPackage: string): void {
  const blob = new Blob([jsonPackage], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `birthhub-dsr-${protocol}.json`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export const DSR_RIGHT_TYPE_LABELS: Record<DsrRightType, string> = {
  ACCESS: 'Acesso aos meus dados',
  PORTABILITY: 'Portabilidade dos meus dados',
  CORRECTION: 'Correção de dados',
  ERASURE: 'Eliminação de dados',
  CONSENT_REVOCATION: 'Revogação de consentimento',
  SHARING_INFO: 'Informação sobre compartilhamento',
};

export const DSR_STATUS_LABELS: Record<DsrStatusResult['status'], string> = {
  PENDING_VERIFICATION: 'Aguardando confirmação por e-mail',
  VERIFIED: 'Verificado — em processamento',
  IN_PROGRESS: 'Em análise pelo Encarregado de Dados (DPO)',
  COMPLETED: 'Concluído',
  REJECTED: 'Não concluído',
};

/** Prazo de resposta do titular é de 15 dias (LGPD art. 19). */
export const DSR_RESPONSE_DEADLINE_DAYS = 15;

export function formatDsrDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function dsrDeadlineDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  date.setDate(date.getDate() + DSR_RESPONSE_DEADLINE_DAYS);
  return formatDsrDate(date.toISOString());
}

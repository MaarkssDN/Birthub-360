/**
 * control.ts — cliente do control plane do portal Bitrix mock (portal.ts), usado pelos specs
 * E2E no processo do Playwright para:
 *   - semear estado (leads/usuários/status do "portal");
 *   - injetar falhas por método REST (cenários de erro);
 *   - inspecionar as chamadas REST que o servidor Atlas realmente fez (prova de que
 *     crm.timeline.comment.add / crm.lead.update chegaram "ao Bitrix").
 *
 * Roda em processo separado do servidor Express — a comunicação é HTTP real contra
 * 127.0.0.1:E2E_BITRIX_MOCK_PORT (mesma porta configurada em playwright.config.ts).
 */

import { MOCK_BITRIX_PORT, MOCK_BITRIX_WEBHOOK_URL } from './constants';

export { MOCK_BITRIX_WEBHOOK_URL };

const CONTROL_BASE = `http://127.0.0.1:${MOCK_BITRIX_PORT}/__control__`;

export interface MockBitrixUser {
  ID: string;
  NAME?: string;
  LAST_NAME?: string;
  EMAIL?: string;
  ACTIVE?: boolean;
}

export interface MockBitrixState {
  leads: Array<Record<string, unknown>>;
  users: MockBitrixUser[];
  statuses: Array<{ STATUS_ID: string; NAME: string }>;
  failures: Record<
    string,
    { mode: 'api-error' | 'http-400'; error?: string; error_description?: string }
  >;
}

export interface RecordedBitrixCall {
  seq: number;
  method: string;
  params: Record<string, unknown>;
  at: string;
}

async function control<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${CONTROL_BASE}${path}`, init);
  if (!res.ok) {
    throw new Error(`bitrix-mock control ${path} → HTTP ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

/** Zera leads/users/falhas e o log de chamadas. Chamar no beforeEach do spec. */
export async function resetBitrixMock(): Promise<void> {
  await control('/reset', { method: 'POST' });
}

/** Substitui o estado do portal (campos omitidos mantêm o valor atual; `failures`, quando
 *  enviado, substitui o mapa inteiro). */
export async function setBitrixMockState(state: Partial<MockBitrixState>): Promise<void> {
  await control('/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
}

/** Chamadas REST recebidas pelo portal, opcionalmente filtradas por método
 *  (ex.: 'crm.timeline.comment.add'). */
export async function getBitrixMockRequests(method?: string): Promise<RecordedBitrixCall[]> {
  const query = method ? `?method=${encodeURIComponent(method)}` : '';
  const body = await control<{ requests: RecordedBitrixCall[] }>(`/requests${query}`);
  return body.requests;
}

/** Fixture mínima de lead "cru" do Bitrix (formato crm.lead.get). `over` mescla por cima. */
export function mockBitrixLead(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ID: '9001',
    TITLE: 'Transportadora Horizonte Ltda',
    NAME: 'Marina',
    LAST_NAME: 'Rocha',
    COMPANY_TITLE: 'Transportadora Horizonte Ltda',
    PHONE: [{ VALUE: '+5511999887766', VALUE_TYPE: 'WORK' }],
    EMAIL: [{ VALUE: 'marina@horizonte.example.com', VALUE_TYPE: 'WORK' }],
    STATUS_ID: 'NEW',
    SOURCE_ID: 'WEB',
    DATE_CREATE: new Date().toISOString(),
    ASSIGNED_BY_ID: '101',
    COMMENTS: 'Lead de teste do portal mock',
    ...over,
  };
}

/** O spec persiste MOCK_BITRIX_WEBHOOK_URL numa BitrixConnection via Prisma (helpers.ts já
 *  roda com bypassRls). NÃO passa por connectBitrix de propósito: aquele fluxo testa a URL
 *  contra o Bitrix de verdade, impossível aqui — a persistência da conexão em si é o que todo
 *  o restante do produto consome. */

/**
 * portal.ts — portal Bitrix24 falso para a suíte E2E da Mesa de Tratamento.
 *
 * Roda DENTRO do processo do servidor Express de teste (ver install.ts /
 * e2e-server.ts): o fetch stub reescreve as chamadas `safeFetch` destinadas ao
 * webhook "https://203.0.113.10/..." para `http://127.0.0.1:<porta>/...`, e este
 * servidor HTTP responde com a semântica REST do Bitrix24 (`POST /<path>/<method>.json`
 * → `{ result: ... }` ou `{ error, error_description }`).
 *
 * Não é um mock de módulo: todo o caminho real continua exercido — Express →
 * mesaTratamento.routes.ts → bitrix.service.ts → client.ts (callBitrix com retry,
 * circuit breaker, pacing) → safeFetch → HTTP real → este servidor. O que é
 * substituído é apenas o SaaS Bitrix24 em si (que exige portal+token reais).
 *
 * O teste controla o estado e inspeciona as chamadas recebidas via endpoints
 * `/__control__/*` (ver control.ts, usado pelo spec no processo do Playwright).
 */
import { createServer, type Server } from 'node:http';

export interface MockBitrixUser {
  ID: string;
  NAME?: string;
  LAST_NAME?: string;
  EMAIL?: string;
  ACTIVE?: boolean;
}

export interface MockBitrixFailure {
  /** 'api-error' → HTTP 200 com `{error, error_description}` (erro definitivo do Bitrix,
   *  sem retry — mesmo contrato de um filtro/campo inválido). 'http-400' → HTTP 400
   *  (também definitivo). NÃO usar HTTP 5xx/429 aqui: callBitrix retentaria com backoff
   *  real de segundos e derrubaria o timeout do teste. */
  mode: 'api-error' | 'http-400';
  error?: string;
  error_description?: string;
}

export interface MockBitrixState {
  /** Registros crus no formato de crm.lead.list/crm.lead.get (ID, TITLE, STATUS_ID...). */
  leads: Array<Record<string, unknown>>;
  users: MockBitrixUser[];
  statuses: Array<{ STATUS_ID: string; NAME: string }>;
  /** Falhas injetadas por método REST exato (ex.: 'crm.lead.update'). */
  failures: Record<string, MockBitrixFailure>;
}

export interface RecordedBitrixCall {
  seq: number;
  method: string;
  params: Record<string, unknown>;
  at: string;
}

const PAGE_SIZE = 50;

function defaultState(): MockBitrixState {
  return {
    leads: [],
    users: [],
    statuses: [
      { STATUS_ID: 'NEW', NAME: 'Novo' },
      { STATUS_ID: 'IN_PROCESS', NAME: 'Em andamento' },
      { STATUS_ID: 'CONVERTED', NAME: 'Convertido' },
    ],
    failures: {},
  };
}

function json(res: import('node:http').ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(payload);
}

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c as Buffer));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/**
 * Sobe o portal mock. Retorna o http.Server (o chamador decide o lifecycle — no nosso caso
 * ele vive junto do processo do servidor Express de teste).
 */
export function startBitrixMockPortal(port: number): Server {
  let state = defaultState();
  const requests: RecordedBitrixCall[] = [];
  let seq = 0;
  let nextLeadId = 1;
  let nextCommentId = 1;

  function record(method: string, params: Record<string, unknown>): void {
    seq += 1;
    requests.push({ seq, method, params, at: new Date().toISOString() });
    // Teto simples — a suíte faz dezenas de chamadas, nunca milhares.
    if (requests.length > 1000) requests.splice(0, requests.length - 1000);
  }

  function applyListFilter(leads: Array<Record<string, unknown>>, filter: unknown): unknown[] {
    if (!filter || typeof filter !== 'object') return leads;
    return leads.filter((lead) => {
      for (const [key, expected] of Object.entries(filter as Record<string, unknown>)) {
        if (key === '%TITLE') {
          const needle = String(expected).toLowerCase();
          if (!String(lead.TITLE ?? '').toLowerCase().includes(needle)) return false;
          continue;
        }
        // Demais filtros do Bitrix são igualdade exata no campo (STATUS_ID, ASSIGNED_BY_ID,
        // campos UF_CRM_* etc.) — suficiente para os fixtures dos specs.
        if (String(lead[key] ?? '') !== String(expected)) return false;
      }
      return true;
    });
  }

  function handleMethod(method: string, params: Record<string, unknown>): unknown {
    switch (method) {
      case 'profile':
        // testWebhook (connectBitrix/testBitrixConnection) faz GET profile.json e só exige
        // ausência de `error` no corpo.
        return { result: { ID: 1, NAME: 'Portal Mock E2E' } };

      case 'crm.status.list':
        return { result: state.statuses };

      case 'crm.lead.fields':
      case 'crm.deal.fields':
      case 'crm.contact.fields':
      case 'crm.company.fields':
        // Sem campos UF_CRM_* configurados — resolveEnumMaps/buildOutboundCustomFields lidam
        // com maps vazios (enums simplesmente não são enviados).
        return { result: {} };

      case 'user.get':
        return {
          result: state.users
            .filter((u) => u.ACTIVE !== false)
            .map((u) => ({ ...u })),
        };

      case 'crm.lead.list': {
        const filter = params.filter;
        const filtered = applyListFilter(state.leads, filter);
        const start = Number(params.start) || 0;
        const page = filtered.slice(start, start + PAGE_SIZE);
        const body: Record<string, unknown> = { result: page, total: filtered.length };
        if (start + PAGE_SIZE < filtered.length) body.next = start + PAGE_SIZE;
        return body;
      }

      case 'crm.lead.get': {
        const id = String((params as { id?: unknown }).id ?? '');
        const lead = state.leads.find((l) => String(l.ID) === id);
        if (!lead) {
          return { error: 'ERROR_NOT_FOUND', error_description: `Lead #${id} não encontrado` };
        }
        return { result: lead };
      }

      case 'crm.lead.add': {
        const fields = (params.fields ?? {}) as Record<string, unknown>;
        const id = `mock-lead-${nextLeadId++}`;
        const lead = { ...fields, ID: id };
        state.leads.push(lead);
        return { result: id };
      }

      case 'crm.lead.update': {
        const id = String((params as { id?: unknown }).id ?? '');
        const fields = (params.fields ?? {}) as Record<string, unknown>;
        const lead = state.leads.find((l) => String(l.ID) === id);
        if (!lead) {
          return { error: 'ERROR_NOT_FOUND', error_description: `Lead #${id} não encontrado` };
        }
        // Merge real: uma leitura posterior (crm.lead.get/list) reflete a escrita — mesma
        // semântica do Bitrix, o que permite à suíte provar que o STATUS_ID/ASSIGNED_BY_ID
        // pedido pelo Atlas foi de fato persistido "no portal".
        Object.assign(lead, fields);
        return { result: true };
      }

      case 'crm.timeline.comment.add':
        // O comentário fica registrado no log de requests (/__control__/requests) — suficiente
        // para a asserção "o Atlas comentou na timeline do lead X".
        return { result: nextCommentId++ };

      case 'crm.duplicate.findbycomm':
        return { result: { LEAD: [] } };

      case 'crm.activity.add':
        return { result: 1 };

      default:
        // Método não implementado falha de forma explícita (erro definitivo → sem retry),
        // igual a um webhook Bitrix real sem o método/escopo correspondente.
        return {
          error: 'ERROR_METHOD_NOT_FOUND',
          error_description: `Método ${method} não implementado no portal mock E2E`,
        };
    }
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      const pathname = url.pathname;

      // ── Control plane (só acessível de dentro da máquina de teste) ──────────
      if (pathname.startsWith('/__control__/')) {
        if (req.method === 'GET' && pathname === '/__control__/health') {
          return json(res, 200, { ok: true });
        }
        if (req.method === 'GET' && pathname === '/__control__/requests') {
          const method = url.searchParams.get('method');
          const list = method ? requests.filter((r) => r.method === method) : requests;
          return json(res, 200, { requests: list });
        }
        if (req.method === 'GET' && pathname === '/__control__/state') {
          return json(res, 200, state);
        }
        if (req.method === 'POST' && pathname === '/__control__/reset') {
          state = defaultState();
          requests.length = 0;
          seq = 0;
          return json(res, 200, { ok: true });
        }
        if (req.method === 'POST' && pathname === '/__control__/state') {
          const body = JSON.parse((await readBody(req)) || '{}') as Partial<MockBitrixState>;
          state = {
            leads: body.leads ?? state.leads,
            users: body.users ?? state.users,
            statuses: body.statuses ?? state.statuses,
            // `failures` é substituído por inteiro quando enviado — evita resíduo de um
            // cenário de erro anterior vazando para o próximo teste.
            failures: body.failures !== undefined ? body.failures : state.failures,
          };
          return json(res, 200, { ok: true });
        }
        return json(res, 404, { error: 'unknown control endpoint' });
      }

      // ── Plano de dados: qualquer POST /<qualquer-coisa>/<metodo>.json ────────
      if (req.method === 'POST' || req.method === 'GET') {
        const file = pathname.split('/').pop() ?? '';
        const method = file.endsWith('.json') ? file.slice(0, -'.json'.length) : file;
        let params: Record<string, unknown> = {};
        if (req.method === 'POST') {
          const raw = await readBody(req);
          if (raw.trim()) {
            try {
              params = JSON.parse(raw) as Record<string, unknown>;
            } catch {
              return json(res, 400, { error: 'BAD_JSON', error_description: 'body inválido' });
            }
          }
        }

        const failure = state.failures[method];
        if (failure) {
          record(method, params);
          if (failure.mode === 'http-400') {
            return json(res, 400, {
              error: failure.error ?? 'ACCESS_DENIED',
              error_description: failure.error_description ?? 'Falha injetada pelo mock E2E',
            });
          }
          return json(res, 200, {
            error: failure.error ?? 'ACCESS_DENIED',
            error_description: failure.error_description ?? 'Falha injetada pelo mock E2E',
          });
        }

        record(method, params);
        return json(res, 200, handleMethod(method, params));
      }

      return json(res, 404, { error: 'not found' });
    } catch (err) {
      json(res, 500, { error: 'MOCK_INTERNAL', error_description: String(err) });
    }
  });

  server.listen(port, '127.0.0.1');
  return server;
}

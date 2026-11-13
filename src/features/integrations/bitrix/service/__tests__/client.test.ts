import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// assertSafeExternalUrl/safeFetch fazem DNS lookup real — indisponível/instável em ambiente de
// teste sandboxed. A proteção SSRF em si (rejeitar IP privado/loopback) é responsabilidade do
// Agente 01 (src/shared/security/urlGuard.ts); aqui testamos que ela É CHAMADA antes de qualquer
// requisição, não a reimplementamos. `safeFetch` é mockado chamando `assertSafeExternalUrlMock`
// antes do `fetch` (globalThis.fetch, espionado por teste abaixo) — espelha a relação real entre
// as duas funções, então configurar `assertSafeExternalUrlMock` para rejeitar continua simulando
// uma rejeição de SSRF tanto para `assertSafeExternalUrl` quanto para `safeFetch`.
const assertSafeExternalUrlMock = vi.fn().mockResolvedValue(undefined);
const safeFetchMock = vi.fn(async (url: string, init?: RequestInit) => {
  await assertSafeExternalUrlMock(url);
  return (globalThis.fetch as typeof fetch)(url, init);
});
vi.mock('@/shared/security/urlGuard', () => ({
  assertSafeExternalUrl: (...args: unknown[]) => assertSafeExternalUrlMock(...args),
  safeFetch: (...args: [string, RequestInit?]) => safeFetchMock(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { bitrixConnection: { findFirst: vi.fn() } },
}));

const WEBHOOK = 'https://birthhub360.bitrix24.com.br/rest/1/token/';

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
) {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: init.headers });
}

beforeEach(async () => {
  vi.clearAllMocks();
  assertSafeExternalUrlMock.mockResolvedValue(undefined);
  // Estado do circuit breaker é module-level (Map em memória) e o módulo fica cacheado entre
  // `await import(...)` dentro do mesmo arquivo de teste — sem isto, falhas registradas por um
  // teste vazariam para o próximo e poderiam abrir o circuito de forma imprevisível conforme a
  // ordem de execução.
  const { __resetBitrixCircuitBreakerForTests, __resetBitrixRateLimiterForTests } = await import('../client.js');
  __resetBitrixCircuitBreakerForTests();
  // O pacing por portal (BITRIX_MIN_INTERVAL_MS) também é estado module-level — sem reset, o
  // timestamp da última request de um teste vazaria para o próximo e atrasaria a primeira
  // chamada do teste seguinte de forma dependente da ordem de execução.
  __resetBitrixRateLimiterForTests();
});

describe('callBitrix — resiliência (bloqueador #11: sincronização não pode falhar silenciosamente)', () => {
  it('devolve o resultado direto quando a primeira tentativa já funciona (sem retry)', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ result: [{ ID: '1' }], total: 1 }));
    const { callBitrix } = await import('../client.js');

    const data = await callBitrix<{ result: unknown[] }>(WEBHOOK, 'crm.deal.list', {});

    expect(data.result).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(assertSafeExternalUrlMock).toHaveBeenCalledWith(WEBHOOK);
    fetchMock.mockRestore();
  });

  it('reintenta em HTTP 5xx e se recupera antes do teto de tentativas', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ error: 'internal' }, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ result: [] }));
    const { callBitrix } = await import('../client.js');

    const data = await callBitrix<{ result: unknown[] }>(
      WEBHOOK,
      'crm.lead.list',
      {},
      { maxAttempts: 3 },
    );

    expect(data.result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockRestore();
  });

  it('reintenta em HTTP 429 e some sem erro se o Bitrix libera antes do teto', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({}, { status: 429, headers: { 'Retry-After': '0' } }))
      .mockResolvedValueOnce(jsonResponse({ result: [] }));
    const { callBitrix } = await import('../client.js');

    await callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 3 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockRestore();
  });

  it('reintenta em QUERY_LIMIT_EXCEEDED (rate limit "soft" no corpo, não no HTTP status)', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({ error: 'QUERY_LIMIT_EXCEEDED', error_description: 'Too many requests' }),
      )
      .mockResolvedValueOnce(jsonResponse({ result: [] }));
    const { callBitrix } = await import('../client.js');

    await callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 3 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockRestore();
  });

  it('esgota as tentativas em falha persistente de 5xx e lança AppError sanitizado (sem vazar webhook/token)', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ error: 'boom' }, { status: 502 }));
    const { callBitrix } = await import('../client.js');
    const { AppError } = await import('@/shared/middlewares/errorHandler');

    await expect(
      callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 2 }),
    ).rejects.toBeInstanceOf(AppError);
    try {
      await callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 2 });
    } catch (err: any) {
      expect((err as Error).message).not.toContain(WEBHOOK);
      expect((err as Error).message).not.toContain('token');
    }
    expect(fetchMock).toHaveBeenCalledTimes(4); // 2 chamadas de callBitrix acima, 2 tentativas cada
    fetchMock.mockRestore();
  });

  it('NÃO reintenta em HTTP 401 (token revogado) — falha imediata, sem desperdiçar tentativas', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({}, { status: 401 }));
    const { callBitrix } = await import('../client.js');

    await expect(callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 4 })).rejects.toThrow(
      /permissão|revogado/i,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockRestore();
  });

  it('NÃO reintenta em HTTP 403 — falha imediata', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({}, { status: 403 }));
    const { callBitrix } = await import('../client.js');

    await expect(callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 4 })).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockRestore();
  });

  it('NÃO reintenta em erro definitivo do Bitrix (filtro/campo/permissão inválidos)', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        jsonResponse({ error: 'INVALID_ARGUMENT_VALUE', error_description: 'Campo desconhecido' }),
      );
    const { callBitrix } = await import('../client.js');

    await expect(callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 4 })).rejects.toThrow(
      /Campo desconhecido/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockRestore();
  });

  it('trata falha do tipo AbortError (timeout/cancelamento da requisição) como recuperável e reintenta', async () => {
    const abortError = Object.assign(new Error('This operation was aborted'), {
      name: 'AbortError',
    });
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce(jsonResponse({ result: [] }));
    const { callBitrix } = await import('../client.js');

    const data = await callBitrix<{ result: unknown[] }>(
      WEBHOOK,
      'crm.lead.list',
      {},
      { maxAttempts: 3 },
    );

    expect(data.result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockRestore();
  });

  it('trata falha de rede (fetch rejeita) como recuperável e reintenta', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(jsonResponse({ result: [] }));
    const { callBitrix } = await import('../client.js');

    await callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 3 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockRestore();
  });

  it('propaga IDs de correlação estáveis entre tentativas da mesma chamada (rastreabilidade)', async () => {
    const { logger } = await import('@/lib/logger');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ error: 'x' }, { status: 500 }))
      .mockResolvedValueOnce(jsonResponse({ result: [] }));
    const { callBitrix } = await import('../client.js');

    await callBitrix(
      WEBHOOK,
      'crm.lead.list',
      {},
      { maxAttempts: 3, correlationId: 'fixed-correlation-id' },
    );

    const warnCalls = vi.mocked(logger.warn).mock.calls;
    expect(
      warnCalls.some(
        ([meta]) => (meta as { correlationId?: string }).correlationId === 'fixed-correlation-id',
      ),
    ).toBe(true);
    fetchMock.mockRestore();
  });

  it('rejeita webhook para IP privado/loopback antes de qualquer fetch (SSRF) — via assertSafeExternalUrl', async () => {
    const { AppError } = await import('@/shared/middlewares/errorHandler');
    assertSafeExternalUrlMock.mockRejectedValueOnce(
      new AppError('Endereço de webhook não permitido (IP privado/reservado).', 400),
    );
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const { callBitrix } = await import('../client.js');

    await expect(
      callBitrix('https://127.0.0.1/rest/1/token/', 'crm.lead.list', {}),
    ).rejects.toThrow(/não permitido/);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });
});

describe('testWebhook — revalida SSRF a cada chamada, não só no cadastro', () => {
  // Gap real de auditoria: `testWebhook` é chamado tanto por `connectBitrix` (que já validava a
  // URL logo antes) quanto por `testBitrixConnection` (botão "Testar conexão" de uma conexão JÁ
  // persistida, sem nenhuma validação prévia do chamador). Sem o guard aqui dentro, uma URL que
  // sofreu DNS rebinding depois do cadastro nunca seria pega de novo por esse segundo caminho.
  it('rejeita webhook para IP privado/loopback antes de qualquer fetch', async () => {
    const { AppError } = await import('@/shared/middlewares/errorHandler');
    assertSafeExternalUrlMock.mockRejectedValueOnce(
      new AppError('Endereço não permitido (IP privado/reservado).', 400),
    );
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const { testWebhook } = await import('../client.js');

    await expect(testWebhook('https://169.254.169.254/rest/1/token/')).rejects.toThrow(
      /não permitido/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it('testa a URL de verdade quando o guard de SSRF aprova (URL pública normal)', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ result: 'ok' }));
    const { testWebhook } = await import('../client.js');

    const { portalDomain } = await testWebhook(WEBHOOK);

    // `testWebhook` valida a URL final (com `profile.json` já anexado) via `safeFetch` — mesmo
    // host/protocolo da URL base para fins de SSRF, só o caminho difere.
    expect(assertSafeExternalUrlMock).toHaveBeenCalledWith(`${WEBHOOK}profile.json`);
    expect(fetchMock).toHaveBeenCalledWith(`${WEBHOOK}profile.json`, expect.anything());
    expect(portalDomain).toBe('birthhub360.bitrix24.com.br');
    fetchMock.mockRestore();
  });
});

describe('callBitrix — circuit breaker de saúde do provedor (gap de auditoria: nada parava de tentar sob falha sustentada)', () => {
  afterEach(() => {
    delete process.env.BITRIX_CIRCUIT_BREAKER_THRESHOLD;
    delete process.env.BITRIX_CIRCUIT_BREAKER_COOLDOWN_MS;
    delete process.env.BITRIX_CIRCUIT_BREAKER_ENABLED;
    // Os limiares são lidos de process.env na hora em que o módulo é carregado — força um
    // reimport limpo (com os defaults) para não vazar a configuração deste describe para os
    // outros testes do arquivo.
    vi.resetModules();
  });

  it('abre o circuito após N falhas consecutivas, falha rápido (fail-fast) durante o cooldown, e fecha assim que o cooldown expira', async () => {
    process.env.BITRIX_CIRCUIT_BREAKER_THRESHOLD = '2';
    process.env.BITRIX_CIRCUIT_BREAKER_COOLDOWN_MS = '50';
    vi.resetModules();

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ error: 'boom' }, { status: 502 }));
    const { callBitrix, BitrixCircuitOpenError } = await import('../client.js');
    const { AppError } = await import('@/shared/middlewares/errorHandler');

    // Duas chamadas que esgotam as tentativas (maxAttempts:1 — sem gastar backoff real) contam
    // como 2 falhas consecutivas, batendo no limiar configurado acima.
    await expect(
      callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 1 }),
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 1 }),
    ).rejects.toBeInstanceOf(AppError);
    fetchMock.mockClear();

    // Circuito aberto: a 3ª chamada falha imediatamente, SEM tentar rede (fail-fast), com o
    // mesmo shape de erro (AppError) que uma falha real teria.
    await expect(
      callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 1 }),
    ).rejects.toBeInstanceOf(BitrixCircuitOpenError);
    await expect(
      callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 1 }),
    ).rejects.toBeInstanceOf(AppError);
    expect(fetchMock).not.toHaveBeenCalled();

    // Espera o cooldown (50ms) expirar de verdade.
    await new Promise((resolve) => setTimeout(resolve, 120));

    fetchMock.mockResolvedValueOnce(jsonResponse({ result: [] }));
    const data = await callBitrix<{ result: unknown[] }>(
      WEBHOOK,
      'crm.lead.list',
      {},
      { maxAttempts: 1 },
    );

    expect(data.result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1); // circuito fechado de novo: a chamada tentou a rede
    fetchMock.mockRestore();
  });

  it('NÃO abre o circuito por erro definitivo "comum" (filtro/campo inválido) — só 401/403 e esgotamento de tentativas contam', async () => {
    process.env.BITRIX_CIRCUIT_BREAKER_THRESHOLD = '2';
    vi.resetModules();

    // mockImplementation (não mockResolvedValue) — cada chamada precisa de um objeto Response
    // novo, já que `.json()` consome o corpo e o código de produção lê o corpo em vez de
    // curto-circuitar antes (diferente do caminho de 401/403/5xx, que nunca chega a ler json).
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () =>
        jsonResponse({ error: 'INVALID_ARGUMENT_VALUE', error_description: 'Campo desconhecido' }),
      );
    const { callBitrix } = await import('../client.js');

    // Duas chamadas com erro definitivo "de payload" (não 401/403) — não deveriam contar para
    // o breaker, mesmo com o limiar baixo (2) configurado acima.
    await expect(callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 1 })).rejects.toThrow(
      /Campo desconhecido/,
    );
    await expect(callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 1 })).rejects.toThrow(
      /Campo desconhecido/,
    );

    // Circuito continua fechado: a 3ª chamada ainda tenta a rede normalmente.
    fetchMock.mockClear();
    await expect(callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 1 })).rejects.toThrow(
      /Campo desconhecido/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockRestore();
  });

  it('respeita BITRIX_CIRCUIT_BREAKER_ENABLED=false — nunca abre o circuito, mesmo sob falha sustentada', async () => {
    process.env.BITRIX_CIRCUIT_BREAKER_ENABLED = 'false';
    process.env.BITRIX_CIRCUIT_BREAKER_THRESHOLD = '1';
    vi.resetModules();

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({}, { status: 401 }));
    const { callBitrix } = await import('../client.js');

    await expect(callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 1 })).rejects.toThrow(
      /permissão|revogado/i,
    );
    await expect(callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 1 })).rejects.toThrow(
      /permissão|revogado/i,
    );

    // Com o breaker desligado, mesmo já tendo estourado o limiar (1), a chamada seguinte
    // continua tentando a rede de verdade em vez de falhar rápido.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockRestore();
  });
});

describe('callBitrix — cancelamento cooperativo via AbortSignal (TAREFA-SANEAMENTO-046 / BT360-DT-0036)', () => {
  it('signal já abortado antes da chamada: rejeita com BitrixCallAbortedError sem tocar na rede', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const { callBitrix, BitrixCallAbortedError } = await import('../client.js');
    const controller = new AbortController();
    controller.abort();

    await expect(
      callBitrix(WEBHOOK, 'crm.lead.list', {}, { signal: controller.signal, maxAttempts: 4 }),
    ).rejects.toBeInstanceOf(BitrixCallAbortedError);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it('abort durante o fetch em voo: rejeita na hora com BitrixCallAbortedError, sem retentar', async () => {
    // fetch que respeita o signal real (AbortController interno do attemptBitrixCall) — mesmo
    // comportamento do fetch nativo diante de um signal abortado.
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_url: any, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('This operation was aborted'), { name: 'AbortError' })),
          );
        }),
    );
    const { callBitrix, BitrixCallAbortedError } = await import('../client.js');
    const controller = new AbortController();

    const pending = callBitrix(
      WEBHOOK,
      'crm.lead.list',
      {},
      {
        signal: controller.signal,
        maxAttempts: 4,
      },
    );
    // Garante que a primeira tentativa já está em voo antes de abortar.
    await new Promise((resolve) => setTimeout(resolve, 10));
    controller.abort();

    await expect(pending).rejects.toBeInstanceOf(BitrixCallAbortedError);
    expect(fetchMock).toHaveBeenCalledTimes(1); // nenhuma tentativa extra após o abort
    fetchMock.mockRestore();
  });

  it('abort durante o backoff entre tentativas: interrompe o sleep e não consome as tentativas restantes', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ error: 'boom' }, { status: 500 }));
    const { callBitrix, BitrixCallAbortedError } = await import('../client.js');
    const controller = new AbortController();

    const pending = callBitrix(
      WEBHOOK,
      'crm.lead.list',
      {},
      {
        signal: controller.signal,
        maxAttempts: 4,
      },
    );
    // A 1ª tentativa falha (500) e entra no backoff (~500ms+) — aborta bem antes disso acabar.
    await new Promise((resolve) => setTimeout(resolve, 20));
    controller.abort();

    await expect(pending).rejects.toBeInstanceOf(BitrixCallAbortedError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockRestore();
  });
});

describe('callBitrix — pacing proativo do rate limit por portal (BITRIX_MIN_INTERVAL_MS)', () => {
  afterEach(() => {
    delete process.env.BITRIX_MIN_INTERVAL_MS;
    // O intervalo é lido de process.env na carga do módulo — reimport limpo com o default (500ms)
    // para não vazar a configuração rápida deste describe para os outros testes do arquivo.
    vi.resetModules();
  });

  it('espaça chamadas SEQUENCIAIS à mesma conexão pelo intervalo mínimo (sem rajada back-to-back)', async () => {
    process.env.BITRIX_MIN_INTERVAL_MS = '80';
    vi.resetModules();

    const timestamps: number[] = [];
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      timestamps.push(Date.now());
      return jsonResponse({ result: [] });
    });
    const { callBitrix } = await import('../client.js');

    await callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 1 });
    await callBitrix(WEBHOOK, 'crm.deal.list', {}, { maxAttempts: 1 });
    await callBitrix(WEBHOOK, 'crm.contact.list', {}, { maxAttempts: 1 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(timestamps[1] - timestamps[0]).toBeGreaterThanOrEqual(75);
    expect(timestamps[2] - timestamps[1]).toBeGreaterThanOrEqual(75);
    fetchMock.mockRestore();
  });

  it('serializa chamadas CONCORRENTES à mesma conexão — N paralelas viram N slots espaçados, não um burst', async () => {
    process.env.BITRIX_MIN_INTERVAL_MS = '80';
    vi.resetModules();

    const timestamps: number[] = [];
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      timestamps.push(Date.now());
      return jsonResponse({ result: [] });
    });
    const { callBitrix } = await import('../client.js');

    // Três syncs/entidades disparando juntos (ex.: extração multi-entidade) — sem a fila de
    // pacing, as três requests sairiam no mesmo instante e estourariam o limite do plano.
    await Promise.all([
      callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 1 }),
      callBitrix(WEBHOOK, 'crm.deal.list', {}, { maxAttempts: 1 }),
      callBitrix(WEBHOOK, 'crm.contact.list', {}, { maxAttempts: 1 }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const sorted = [...timestamps].sort((a, b) => a - b);
    expect(sorted[1] - sorted[0]).toBeGreaterThanOrEqual(75);
    expect(sorted[2] - sorted[1]).toBeGreaterThanOrEqual(75);
    fetchMock.mockRestore();
  });

  it('NÃO bloqueia portal diferente — o rate limit do Bitrix é por webhookUrl, não global', async () => {
    process.env.BITRIX_MIN_INTERVAL_MS = '80';
    vi.resetModules();

    const OTHER_WEBHOOK = 'https://outro-portal.bitrix24.com.br/rest/9/outrotoken/';
    const timestampsA: number[] = [];
    const timestampsB: number[] = [];
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      (String(url).startsWith(WEBHOOK) ? timestampsA : timestampsB).push(Date.now());
      return jsonResponse({ result: [] });
    });
    const { callBitrix } = await import('../client.js');

    await callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 1 });
    // Portal B dispara imediatamente depois do A — não precisa esperar o slot de A.
    await callBitrix(OTHER_WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 1 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(timestampsB[0] - timestampsA[0]).toBeLessThan(75);
    fetchMock.mockRestore();
  });

  it('BITRIX_MIN_INTERVAL_MS=0 desliga o pacing (planos com limite maior configuram o valor real)', async () => {
    process.env.BITRIX_MIN_INTERVAL_MS = '0';
    vi.resetModules();

    const timestamps: number[] = [];
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      timestamps.push(Date.now());
      return jsonResponse({ result: [] });
    });
    const { callBitrix } = await import('../client.js');

    await Promise.all([
      callBitrix(WEBHOOK, 'crm.lead.list', {}, { maxAttempts: 1 }),
      callBitrix(WEBHOOK, 'crm.deal.list', {}, { maxAttempts: 1 }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(Math.abs(timestamps[1] - timestamps[0])).toBeLessThan(50);
    fetchMock.mockRestore();
  });
});

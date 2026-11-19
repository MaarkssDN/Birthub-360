import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * `assertSafeExternalUrl` (promovido de `src/lib/adapters/crm/Bitrix24Adapter.ts`, onde nasceu só
 * para o webhook do Bitrix24, para `src/shared/security/urlGuard.ts`) é o único guard reutilizável
 * deste repositório contra SSRF em URL fornecida por usuário/tenant: webhook Bitrix24
 * (`client.ts`/`connections.ts`) e PABX 3CX (`threecx.service.ts`) já dependem dele hoje. Estes
 * testes cobrem a lógica real (sem mock do próprio guard) para as duas garantias que a auditoria
 * pediu: rejeita IP privado/loopback/metadata, aceita URL pública normal.
 *
 * Casos de IP literal (127.0.0.1, 169.254.169.254, 10.0.0.1, 8.8.8.8) não fazem DNS lookup —
 * `net.isIP` já resolve o caminho antes disso — então são determinísticos mesmo em ambiente de
 * teste sandboxed sem rede. O caso de hostname (DNS rebinding) mocka `node:dns/promises` para não
 * depender de resolução real.
 */

const lookupMock = vi.fn();
vi.mock('node:dns/promises', () => ({
  default: { lookup: (...args: unknown[]) => lookupMock(...args) },
  lookup: (...args: unknown[]) => lookupMock(...args),
}));

// `urlGuard.ts` chama o `fetch` importado do pacote `undici` (não o `fetch` global — ver o
// comentário em `urlGuard.ts` sobre a incompatibilidade do fetch global do Node.js v24 com
// `Agent` do `undici`), então mockar `fetch` global (`vi.stubGlobal`) não intercepta essa chamada.
// Mocka só o export `fetch` do módulo, preservando o resto (`Agent` real segue sendo usado pelo
// guard para fixar a conexão nos endereços já validados).
const fetchMock = vi.fn();
vi.mock('undici', async (importOriginal) => {
  const actual = await importOriginal<typeof import('undici')>();
  return { ...actual, fetch: (...args: Parameters<typeof actual.fetch>) => fetchMock(...args) };
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('assertSafeExternalUrl — rejeita IP privado/loopback/metadata', () => {
  it('rejeita loopback IPv4 (127.0.0.1)', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://127.0.0.1/')).rejects.toThrow(/não permitido/i);
  });

  it('rejeita o endpoint de metadados de nuvem (169.254.169.254)', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(
      assertSafeExternalUrl('https://169.254.169.254/latest/meta-data/'),
    ).rejects.toThrow(/não permitido/i);
  });

  it('rejeita bloco privado 10.0.0.0/8', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://10.0.0.1/')).rejects.toThrow(/não permitido/i);
  });

  it('rejeita bloco privado 172.16.0.0/12', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://172.16.5.5/')).rejects.toThrow(/não permitido/i);
  });

  it('rejeita bloco privado 192.168.0.0/16', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://192.168.1.1/')).rejects.toThrow(/não permitido/i);
  });

  // SEC-003 (docs/audits/repository-debt-audit/agents/SEC.md): faixa CGNAT (RFC 6598), usada em
  // NAT compartilhado de operadora/nuvem, faltava no guard — um host aí é tão "interno" quanto
  // RFC1918.
  it('rejeita bloco CGNAT 100.64.0.0/10', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://100.64.0.1/')).rejects.toThrow(/não permitido/i);
    await expect(assertSafeExternalUrl('https://100.127.255.254/')).rejects.toThrow(
      /não permitido/i,
    );
  });

  it('aceita 100.63.255.255 e 100.128.0.0, fora do bloco CGNAT por um endereço', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://100.63.255.255/')).resolves.toBeUndefined();
    await expect(assertSafeExternalUrl('https://100.128.0.0/')).resolves.toBeUndefined();
  });

  it('rejeita bloco de atribuição de protocolo IETF 192.0.0.0/24 (RFC 6890)', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://192.0.0.8/')).rejects.toThrow(/não permitido/i);
  });

  it('rejeita bloco de benchmarking de rede 198.18.0.0/15 (RFC 2544)', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://198.18.0.1/')).rejects.toThrow(/não permitido/i);
    await expect(assertSafeExternalUrl('https://198.19.255.254/')).rejects.toThrow(
      /não permitido/i,
    );
  });

  // Nota: `net.isIP('[::1]')` (hostname de URL IPv6 vem com colchetes) devolve 0 — o mesmo
  // comportamento pré-existente herdado de `Bitrix24Adapter.ts` (não alterado nesta promoção).
  // Um IPv6 literal na URL cai no caminho de DNS lookup em vez do de IP literal e acaba
  // rejeitado por "não foi possível resolver o host" (ENOTFOUND) em vez de "IP privado" — ainda
  // bloqueia o fetch, só que pelo motivo errado. Testado abaixo pelo caminho real que o produto
  // usa para IPv6 (endereço resolvido via DNS, não literal na URL): um hostname comum cujo DNS
  // aponta para loopback/link-local IPv6 precisa ser rejeitado do mesmo jeito que um IPv4
  // privado — é isso que `isPrivateOrReservedIp` cobre para os registros devolvidos pelo lookup.
  it('rejeita hostname cujo DNS resolve para loopback IPv6 (::1)', async () => {
    lookupMock.mockResolvedValue([{ address: '::1', family: 6 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://webhook.exemplo.com/')).rejects.toThrow(
      /não permitido/i,
    );
  });

  it('rejeita hostname cujo DNS resolve para link-local IPv6 (fe80::)', async () => {
    lookupMock.mockResolvedValue([{ address: 'fe80::1', family: 6 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://webhook.exemplo.com/')).rejects.toThrow(
      /não permitido/i,
    );
  });

  // Handoff `.agents/handoffs/onda-2/15-para-01-ssrf-ipv6-transition-ranges.md`:
  // mecanismos de transição IPv4-em-IPv6 resolvidos via DNS têm o IPv4 embutido
  // avaliado pela mesma política de IP privado/reservado.
  it('rejeita hostname cujo DNS resolve para 6to4 com IPv4 privado embutido', async () => {
    lookupMock.mockResolvedValue([{ address: '2002:7f00:1::', family: 6 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://webhook.exemplo.com/')).rejects.toThrow(
      /não permitido/i,
    );
  });

  it('rejeita hostname cujo DNS resolve para NAT64 com IPv4 privado embutido', async () => {
    lookupMock.mockResolvedValue([{ address: '64:ff9b::a00:1', family: 6 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://webhook.exemplo.com/')).rejects.toThrow(
      /não permitido/i,
    );
  });

  it('rejeita hostname cujo DNS resolve para Teredo (IPv4 ofuscado, bloqueio conservador)', async () => {
    lookupMock.mockResolvedValue([{ address: '2001:0:4136:e378:8000:63bf:3fff:fdd2', family: 6 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://webhook.exemplo.com/')).rejects.toThrow(
      /não permitido/i,
    );
  });

  it('rejeita hostname cujo DNS resolve para IPv4-compatible com IPv4 privado embutido', async () => {
    lookupMock.mockResolvedValue([{ address: '::a00:1', family: 6 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://webhook.exemplo.com/')).rejects.toThrow(
      /não permitido/i,
    );
  });

  it('rejeita "localhost" mesmo sem ser um IP literal', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://localhost/')).rejects.toThrow(/não permitido/i);
  });

  it('rejeita esquema não-HTTPS mesmo com host público', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://8.8.8.8/')).rejects.toThrow(/https/i);
  });

  it('rejeita URL malformada', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('não-é-uma-url')).rejects.toThrow(/inválid/i);
  });

  // Mitigação de DNS rebinding: mesmo um hostname "normal" é rejeitado se algum dos endereços
  // resolvidos for privado/reservado — não basta o primeiro registro ser público.
  it('rejeita hostname cujo DNS resolve para IP privado (DNS rebinding)', async () => {
    lookupMock.mockResolvedValue([
      { address: '203.0.113.10', family: 4 },
      { address: '10.0.0.5', family: 4 },
    ]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://webhook.exemplo.com/')).rejects.toThrow(
      /não permitido.*privado/i,
    );
  });

  it('rejeita hostname que não resolve (DNS falha/vazio)', async () => {
    lookupMock.mockResolvedValue([]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://host-inexistente.exemplo.com/')).rejects.toThrow(
      /resolver/i,
    );
  });
});

describe('assertSafeExternalUrl — aceita URL pública normal', () => {
  it('aceita IP público literal sobre HTTPS (8.8.8.8)', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://8.8.8.8/')).resolves.toBeUndefined();
  });

  it('aceita hostname cujo DNS resolve só para IPs públicos', async () => {
    lookupMock.mockResolvedValue([{ address: '203.0.113.10', family: 4 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(
      assertSafeExternalUrl('https://webhook.exemplo.com/rest/1/token/'),
    ).resolves.toBeUndefined();
    expect(lookupMock).toHaveBeenCalledWith('webhook.exemplo.com', { all: true });
  });

  it('aceita hostname cujo DNS resolve para transição IPv6 com IPv4 embutido público', async () => {
    // 6to4 2002:0808:0808:: embute 8.8.8.8 — IPv4 público, mesmo nível de confiança
    // de um A record público direto.
    lookupMock.mockResolvedValue([{ address: '2002:808:808::', family: 6 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(
      assertSafeExternalUrl('https://webhook.exemplo.com/rest/1/token/'),
    ).resolves.toBeUndefined();
  });
});

/**
 * `safeFetch` reaproveita a MESMA validação de `assertSafeExternalUrl` (mesmo `resolveSafe`
 * interno) mas fixa a conexão real nos endereços já validados — ver o comentário do próprio
 * `safeFetch` em `urlGuard.ts` para a lacuna de DNS rebinding que isso fecha (a resolução de DNS
 * usada para abrir a conexão de verdade é a MESMA já validada, não uma segunda chamada
 * independente a `dns.lookup`). Estes testes cobrem o contrato observável sem depender de rede
 * real: rejeita antes de qualquer `fetch`, e devolve uma `Response` utilizável (`status`/`ok`/
 * corpo) quando a URL é aprovada.
 */
describe('safeFetch — mesmo guard de SSRF, conexão real fixada nos endereços já validados', () => {
  it('rejeita IP privado sem nunca chamar fetch', async () => {
    const { safeFetch } = await import('@/shared/security/urlGuard');

    await expect(safeFetch('https://10.0.0.1/')).rejects.toThrow(/não permitido/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejeita hostname com DNS rebinding (resolve para IP privado) sem nunca chamar fetch', async () => {
    lookupMock.mockResolvedValue([{ address: '10.0.0.5', family: 4 }]);
    const { safeFetch } = await import('@/shared/security/urlGuard');

    await expect(safeFetch('https://webhook.exemplo.com/')).rejects.toThrow(/não permitido/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('busca a URL de verdade e devolve uma Response utilizável quando o guard aprova', async () => {
    lookupMock.mockResolvedValue([{ address: '203.0.113.10', family: 4 }]);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const { safeFetch } = await import('@/shared/security/urlGuard');

    const res = await safeFetch('https://webhook.exemplo.com/profile.json');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://webhook.exemplo.com/profile.json');
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
    await expect(res.json()).resolves.toEqual({ ok: true });
    // A validação (que já fez o `dns.lookup`) e a conexão real fixada não disparam uma
    // segunda resolução de DNS — só a checagem inicial.
    expect(lookupMock).toHaveBeenCalledTimes(1);
  });
});

/**
 * Exceção aprovada pelo usuário (handoff `.agents/handoffs/onda-2/15-para-07-webhook-fetch-safeFetch.md`):
 * `http:` é tolerado APENAS para loopback (`localhost`, `127.0.0.0/8`, `::1`) quando
 * `NODE_ENV !== 'production'`. Em produção e para qualquer host não-loopback, HTTPS continua
 * obrigatório — e o bloqueio de IP privado/reservado não-loopback (10.x, 192.168.x etc.) segue
 * valendo em qualquer ambiente.
 */
describe('exceção http loopback fora de produção', () => {
  it('aceita http://localhost fora de produção (DNS resolve para loopback)', async () => {
    lookupMock.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://localhost/hook')).resolves.toBeUndefined();
  });

  it('aceita http://127.0.0.1 fora de produção (IP literal, sem DNS)', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://127.0.0.1:8080/hook')).resolves.toBeUndefined();
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('aceita http://[::1] fora de produção (IPv6 loopback literal)', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://[::1]:8080/hook')).resolves.toBeUndefined();
  });

  it('mantém https://localhost rejeitado — a exceção é SÓ de scheme http', async () => {
    lookupMock.mockResolvedValue([{ address: '::1', family: 6 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://localhost/')).rejects.toThrow(/não permitido/i);
  });

  it('rejeita http://localhost em produção mesmo com DNS loopback', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    lookupMock.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://localhost/')).rejects.toThrow(/https/i);
  });

  it('rejeita http://127.0.0.1 em produção', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://127.0.0.1/')).rejects.toThrow(/https/i);
  });

  it('rejeita http:// para host externo em qualquer ambiente', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://webhook.exemplo.com/')).rejects.toThrow(/https/i);
  });

  it('rejeita http:// para IP privado não-loopback (10.x) mesmo fora de produção', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://10.0.0.1/')).rejects.toThrow(/https/i);
    vi.stubEnv('NODE_ENV', 'production');
    await expect(assertSafeExternalUrl('http://10.0.0.1/')).rejects.toThrow(/https/i);
  });

  it('rejeita https://localhost em produção (loopback não é exceção em prod)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    lookupMock.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('https://localhost/')).rejects.toThrow(/não permitido/i);
  });

  it('safeFetch busca http://localhost fora de produção com conexão fixada no loopback', async () => {
    lookupMock.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    fetchMock.mockResolvedValue(new Response('ok', { status: 200 }));
    const { safeFetch } = await import('@/shared/security/urlGuard');

    const res = await safeFetch('http://localhost:8080/hook', { method: 'POST' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/hook');
    expect(res.status).toBe(200);
  });

  it('safeFetch rejeita http://localhost em produção sem chamar fetch', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { safeFetch } = await import('@/shared/security/urlGuard');

    await expect(safeFetch('http://localhost/')).rejects.toThrow(/https/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Registros DNS de hostname loopback precisam ser TODOS loopback — um `localhost` que
  // resolve para IP público/privado-não-loopback não pode ser buscado em HTTP puro.
  it('aceita http://foo.localhost quando o DNS resolve só para loopback', async () => {
    lookupMock.mockResolvedValue([{ address: '::1', family: 6 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://foo.localhost/hook')).resolves.toBeUndefined();
  });

  it('rejeita http://foo.localhost quando o DNS resolve para IP público', async () => {
    lookupMock.mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://foo.localhost/hook')).rejects.toThrow(
      /não-loopback/i,
    );
  });

  it('rejeita http://localhost quando o DNS resolve para IP público (localhost envenenado)', async () => {
    lookupMock.mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://localhost/')).rejects.toThrow(/não-loopback/i);
  });

  it('rejeita http://localhost quando o DNS resolve para IP privado não-loopback', async () => {
    lookupMock.mockResolvedValue([{ address: '10.0.0.5', family: 4 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://localhost/')).rejects.toThrow(/não-loopback/i);
  });

  it('rejeita http://localhost quando o DNS mistura loopback e IP público', async () => {
    lookupMock.mockResolvedValue([
      { address: '127.0.0.1', family: 4 },
      { address: '8.8.8.8', family: 4 },
    ]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://localhost/')).rejects.toThrow(/não-loopback/i);
  });

  it('aceita http://localhost quando o DNS resolve IPv4-mapeado-em-IPv6 de loopback', async () => {
    lookupMock.mockResolvedValue([{ address: '::ffff:127.0.0.1', family: 6 }]);
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://localhost/')).resolves.toBeUndefined();
  });

  it('rejeita http://localhost.evil.com — sufixo não é .localhost', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://localhost.evil.com/')).rejects.toThrow(/https/i);
  });

  it('rejeita http://127.0.0.1@evil.com — host real é evil.com (userinfo não é loopback)', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://127.0.0.1@evil.com/')).rejects.toThrow(/https/i);
  });

  it('aceita http://[::ffff:7f00:1] — IPv6-mapped loopback em forma hex (literal)', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://[::ffff:7f00:1]:8080/')).resolves.toBeUndefined();
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('rejeita http://[::ffff:808:808] — IPv6-mapped NÃO-loopback (8.8.8.8) em forma hex', async () => {
    const { assertSafeExternalUrl } = await import('@/shared/security/urlGuard');
    await expect(assertSafeExternalUrl('http://[::ffff:808:808]/')).rejects.toThrow(/https/i);
  });

  it('safeFetch devolve resposta 3xx ao chamador sem seguir redirect no caminho mockado', async () => {
    lookupMock.mockResolvedValue([{ address: '203.0.113.10', family: 4 }]);
    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'https://outro-host.exemplo.com/novo' },
      }),
    );
    const { safeFetch } = await import('@/shared/security/urlGuard');

    const res = await safeFetch('https://webhook.exemplo.com/antigo');

    // O guard não segue redirects: o fetch real usa dispatcher com lookup pinado, então um 3xx
    // cross-host falha na conexão (SNI/TLS mismatch) em vez de abrir destino não validado; no
    // caminho mockado a resposta 3xx volta intacta para o chamador decidir.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://outro-host.exemplo.com/novo');
  });
});

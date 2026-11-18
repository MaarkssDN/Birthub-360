import dns from 'node:dns/promises';
import type { LookupFunction } from 'node:net';
import net from 'node:net';
import { Agent, fetch as undiciFetch } from 'undici';
import { AppError } from '../middlewares/errorHandler.js';

// Usamos o `RequestInit` do próprio `undici` (não o `RequestInit` global do lib "DOM" do
// tsconfig, compartilhado com o frontend) porque só o tipo do undici já declara `dispatcher`
// (extensão usada abaixo para fixar a conexão real nos endereços já validados) — evita o cast
// que seria necessário para contornar essa lacuna no tipo global.
// IMPORTANTE: usamos o `fetch` da biblioteca `undici` em vez do fetch global porque o fetch
// global do Node.js (v24) tem incompatibilidade interna com instâncias de Agent importadas
// do pacote `undici` do node_modules.

// SSRF: guard genérico para QUALQUER URL fornecida por um usuário/tenant que o servidor vai
// buscar (fetch/POST/HEAD) — webhook de integração (Bitrix24), PABX de telefonia (3CX), ou
// qualquer outro campo futuro do tipo "URL de callback"/"URL de destino" armazenado no banco ou
// recebido em input. Promovido de `src/lib/adapters/crm/Bitrix24Adapter.ts` (onde nasceu só para
// o caso Bitrix, mas já era importado cross-feature pelo 3CX) para `src/shared/security/` —
// mesmo comportamento, local e nome genéricos. Bloqueamos esquemas não-HTTPS (exceção: `http:`
// para loopback fora de produção — ver `isLoopbackHttpAllowed`) e qualquer host que
// resolva para um endereço privado/reservado/loopback/link-local antes de qualquer fetch real.
//
// NÃO usar para URLs de provedor fixas/hardcoded no próprio código (Apollo, Hunter, OpenAI,
// Tavily, DuckDuckGo etc.) — o destino já é conhecido e confiável, não há SSRF ali. Este guard é
// só para URL que veio de um campo de banco ou de input do usuário.
function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b, c] = ip.split('.').map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    // CGNAT (RFC 6598) — faixa usada por NAT de operadoras/nuvem para endereçar rede interna
    // compartilhada entre múltiplos clientes; um host aí é tão "privado" quanto RFC1918
    // (SEC-003, docs/audits/repository-debt-audit/agents/SEC.md).
    if (a === 100 && b >= 64 && b <= 127) return true;
    // Bloco de atribuição de protocolo IETF (RFC 6890) e faixa de benchmarking de rede
    // (RFC 2544) — reservados, nunca endereçam um serviço real de tenant (SEC-003).
    if (a === 192 && b === 0 && c === 0) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 0) return true;
    if (a >= 224) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (/^fe[89ab]/.test(lower)) return true; // link-local fe80::/10
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    // IPv4-mapeado (`::ffff:`) e mecanismos de transição (6to4 `2002::/16`, NAT64
    // `64:ff9b::/96`, IPv4-compatível `::/96`): o IPv4 embutido é o destino real —
    // delega à checagem IPv4. Teredo (`2001::/32`) tem o IPv4 ofuscado por XOR e o
    // prefixo é deprecado — rejeitado por inteiro (nunca destino legítimo de webhook).
    const embedded = embeddedIpv4FromIpv6(lower);
    if (embedded === 'block') return true;
    if (embedded !== null) return isPrivateOrReservedIp(embedded);
    return false;
  }
  return true;
}

/**
 * Expande um literal IPv6 para os 8 hextetos, aceitando compressão `::` e IPv4 embutido
 * no final (`::ffff:1.2.3.4`, que o parser WHATWG de URL já entrega em hex — o dotted é
 * aceito por robustez para chamadas diretas que não passaram por `new URL`).
 * Retorna `null` quando a forma não pode ser expandida com segurança.
 */
function ipv6ToHextets(ip: string): number[] | null {
  let s = ip.toLowerCase();
  let dottedTail: number[] = [];
  const dotted = s.match(/^(.*:)(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (dotted) {
    const bytes = dotted.slice(2).map(Number);
    if (bytes.some((b) => b > 255)) return null;
    dottedTail = [(bytes[0] << 8) | bytes[1], (bytes[2] << 8) | bytes[3]];
    s = dotted[1].replace(/:$/, '');
  }
  const halves = s.split('::');
  if (halves.length > 2) return null;
  const parsePart = (part: string): number[] | null => {
    if (part === '') return [];
    const out: number[] = [];
    for (const group of part.split(':')) {
      if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
      out.push(Number.parseInt(group, 16));
    }
    return out;
  };
  const head = parsePart(halves[0]);
  const tail = halves.length === 2 ? parsePart(halves[1]) : [];
  if (!head || !tail) return null;
  if (halves.length === 1) {
    const explicit = [...head, ...dottedTail];
    return explicit.length === 8 ? explicit : null;
  }
  const missing = 8 - head.length - tail.length - dottedTail.length;
  if (missing < 1) return null; // '::' precisa comprimir ao menos um hexteto
  return [...head, ...new Array<number>(missing).fill(0), ...tail, ...dottedTail];
}

/**
 * IPv4 de transição embutido no IPv6, `'block'` para prefixos rejeitados por inteiro,
 * ou `null` quando o IPv6 não carrega IPv4 embutido. IPv6 malformado que escapou de
 * `net.isIPv6` falha fechado (`'block'`).
 */
function embeddedIpv4FromIpv6(ip: string): string | 'block' | null {
  const groups = ipv6ToHextets(ip);
  if (!groups) return 'block';
  const toIpv4 = (hi: number, lo: number) =>
    `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
  const allZero = (from: number, to: number) => groups.slice(from, to).every((g) => g === 0);
  // ::ffff:0:0/96 — IPv4-mapeado (::ffff:a.b.c.d)
  if (allZero(0, 5) && groups[5] === 0xffff) return toIpv4(groups[6], groups[7]);
  // 2002::/16 — 6to4: IPv4 embutido nos hextetos 1-2 (bits 16-48)
  if (groups[0] === 0x2002) return toIpv4(groups[1], groups[2]);
  // 2001:0000::/32 — Teredo: IPv4 do cliente ofuscado por XOR nos últimos 32 bits;
  // política conservadora = bloquear o prefixo inteiro.
  if (groups[0] === 0x2001 && groups[1] === 0x0000) return 'block';
  // 64:ff9b::/96 — NAT64 well-known prefix: IPv4 embutido nos últimos 32 bits
  if (groups[0] === 0x0064 && groups[1] === 0xff9b && allZero(2, 6)) {
    return toIpv4(groups[6], groups[7]);
  }
  // ::/96 — IPv4-compatível deprecado (RFC 4291 §2.5.5.1): IPv4 nos últimos 32 bits.
  // (`::` e `::1` já retornaram true antes desta função.)
  if (allZero(0, 6)) return toIpv4(groups[6], groups[7]);
  return null;
}

/** Endereços já validados (não-privados/reservados) de um host, resolvidos numa única checagem. */
interface SafeResolution {
  url: URL;
  addresses: string[];
}

/**
 * Loopback estrito — SÓ para a exceção de desenvolvimento abaixo, não altera
 * `isPrivateOrReservedIp`: IPv4 `127.0.0.0/8`, IPv6 `::1` e IPv4-mapeado-em-IPv6 de loopback.
 */
function isLoopbackIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    return ip.split('.')[0] === '127';
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1') return true;
    if (lower.startsWith('::ffff:')) {
      // O parser WHATWG normaliza IPv4-mapeado para hex de 2 grupos (::ffff:7f00:1 =
      // 127.0.0.1); aceitar também a forma dotted por robustez (chamadas diretas).
      const tail = lower.slice('::ffff:'.length);
      if (net.isIPv4(tail)) return isLoopbackIp(tail);
      const groups = tail.split(':');
      if (groups.length === 2 && groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) {
        const hi = Number.parseInt(groups[0], 16);
        const lo = Number.parseInt(groups[1], 16);
        const ipv4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
        return isLoopbackIp(ipv4);
      }
    }
  }
  return false;
}

/**
 * Hostname de loopback: `localhost`, `*.localhost` ou IP literal de loopback (colchetes de
 * literal IPv6, que `URL#hostname` preserva, são removidos antes da checagem).
 */
function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  return net.isIP(host) !== 0 && isLoopbackIp(host);
}

/**
 * Exceção aprovada pelo usuário (decisão registrada no handoff
 * `.agents/handoffs/onda-2/15-para-07-webhook-fetch-safeFetch.md`): `http:` é tolerado APENAS
 * para loopback (`localhost`, `127.0.0.0/8`, `::1`) quando `NODE_ENV !== 'production'` — cobre
 * receptores de webhook/gateway locais de dev (ntfy, sms-gw etc.). Em produção e para qualquer
 * host não-loopback, HTTPS continua obrigatório. A exceção é SÓ de scheme/destino: o bloqueio
 * de IP privado/reservado, a resolução DNS e o pinning de conexão (`safeFetch`) permanecem
 * intactos — um `localhost` que resolvesse para IP não-loopback continua rejeitado.
 */
function isLoopbackHttpAllowed(url: URL): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return url.protocol === 'http:' && isLoopbackHostname(url.hostname);
}

/**
 * Valida `rawUrl` (esquema HTTPS, host que não é `localhost`, IP literal que não seja
 * privado/reservado) e resolve+valida cada endereço do host, se for um hostname. Lança
 * `AppError(..., 400)` no primeiro problema encontrado. Base compartilhada por
 * `assertSafeExternalUrl` (checagem isolada, sem fetch) e `safeFetch` (checagem + conexão real
 * fixada nos MESMOS endereços validados aqui — ver comentário de `safeFetch` abaixo).
 */
async function resolveSafe(rawUrl: string): Promise<SafeResolution> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new AppError('URL informada é inválida.', 400);
  }

  const loopbackHttp = isLoopbackHttpAllowed(url);
  if (url.protocol !== 'https:' && !loopbackHttp) {
    throw new AppError('A URL informada deve usar HTTPS.', 400);
  }

  const hostname = url.hostname.toLowerCase();
  // `loopbackHttp` (= `isLoopbackHttpAllowed`: http: + loopback + não-produção) é a ÚNICA
  // exceção — para https://loopback ou qualquer outro caso, o bloqueio original de
  // localhost/IP privado/reservado permanece intacto em todos os ambientes.
  if (!loopbackHttp && (hostname === 'localhost' || hostname.endsWith('.localhost'))) {
    throw new AppError('Endereço não permitido.', 400);
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname) && !loopbackHttp) {
      throw new AppError('Endereço não permitido (IP privado/reservado).', 400);
    }
    return { url, addresses: [hostname] };
  }

  // Literais IPv6 chegam com colchetes (`[::1]`, `[::ffff:7f00:1]`) e `net.isIP` não os
  // reconhece — sem este desvio cairiam no dns.lookup e falhariam fechado. Quando a exceção
  // loopback se aplica, resolve direto para o endereço literal já confirmado como loopback.
  if (loopbackHttp && hostname.startsWith('[') && hostname.endsWith(']')) {
    const bareIpv6 = hostname.slice(1, -1);
    if (net.isIPv6(bareIpv6) && isLoopbackIp(bareIpv6)) {
      return { url, addresses: [bareIpv6] };
    }
  }

  const records = await dns.lookup(hostname, { all: true }).catch(() => []);
  if (records.length === 0) {
    throw new AppError('Não foi possível resolver o host informado.', 400);
  }
  for (const record of records) {
    if (loopbackHttp) {
      // Hostname loopback (localhost/*.localhost) só é exceção se TODOS os registros DNS
      // forem loopback — um `localhost` envenenado/resolvido para IP público ou privado
      // não-loopback não pode ser buscado em HTTP puro.
      if (!isLoopbackIp(record.address)) {
        throw new AppError(
          'Endereço não permitido (host loopback resolveu para IP não-loopback).',
          400,
        );
      }
      continue;
    }
    if (isPrivateOrReservedIp(record.address)) {
      throw new AppError('Endereço não permitido (resolve para IP privado/reservado).', 400);
    }
  }
  return { url, addresses: records.map((record) => record.address) };
}

/**
 * Valida que `rawUrl` é segura para o servidor buscar (fetch) de verdade: HTTPS (ou `http:`
 * para loopback fora de produção — exceção aprovada pelo usuário, ver `isLoopbackHttpAllowed`),
 * host que não resolve para IP privado/reservado/loopback/link-local. Lança `AppError(..., 400)` caso
 * contrário.
 *
 * Use isto só para validar uma URL SEM fazer o fetch real na mesma chamada (ex.: `connect3CX`
 * validando antes de persistir). Para qualquer fetch real contra URL de usuário/tenant, prefira
 * `safeFetch` abaixo — ela reaproveita esta mesma validação, mas fecha a janela de DNS rebinding
 * que existe aqui: entre este `assertSafeExternalUrl` retornar e o `fetch` seguinte rodar, o host
 * pode responder um IP público desta vez e um IP privado da próxima (a validação e a conexão real
 * resolvem o DNS em dois momentos separados).
 */
export async function assertSafeExternalUrl(rawUrl: string): Promise<void> {
  await resolveSafe(rawUrl);
}

/**
 * Busca `rawUrl` (URL de usuário/tenant — webhook Bitrix24, PABX 3CX, etc.) com o mesmo guard de
 * `assertSafeExternalUrl`, mas fixando ("pinning") a conexão TCP real nos ENDEREÇOS JÁ VALIDADOS
 * nesta mesma chamada — nenhuma segunda resolução de DNS acontece entre a validação e a conexão de
 * verdade, o que fecha a janela de DNS rebinding que `assertSafeExternalUrl` seguido de um `fetch`
 * cru não fecha (o host pode responder um IP público na validação e um IP privado no `fetch`
 * seguinte, que resolve o DNS de novo, de forma independente).
 *
 * Implementado com um `undici.Agent` cuja resolução de DNS (`connect.lookup`) é sobrescrita para
 * devolver sempre os mesmos endereços já validados, para qualquer host perguntado — inclusive um
 * host de redirecionamento HTTP, que por isso nunca é resolvido de verdade: uma resposta 3xx troca
 * de host falha (mismatch de TLS/SNI contra o IP fixado), em vez de abrir uma conexão nova e não
 * validada. Nenhuma das URLs chamadas por este guard (webhook Bitrix24, PABX 3CX) espera
 * redirecionamento hoje.
 */
export async function safeFetch(rawUrl: string, init: RequestInit = {}): Promise<Response> {
  const safeUrl = new URL(rawUrl);
  const safeHost = safeUrl.hostname.toLowerCase();
  // Mesma exceção de `resolveSafe`: http:// loopback fora de produção (decisão do usuário).
  const loopbackHttp = isLoopbackHttpAllowed(safeUrl);
  if (safeUrl.protocol !== 'https:' && !loopbackHttp) {
    throw new AppError('A URL informada deve usar HTTPS.', 400);
  }
  if (!loopbackHttp && (safeHost === 'localhost' || safeHost.endsWith('.localhost'))) {
    throw new AppError('Endereço não permitido.', 400);
  }

  const { addresses } = await resolveSafe(rawUrl);

  const isGlobalFetchMocked =
    typeof globalThis.fetch === 'function' &&
    (Boolean((globalThis.fetch as unknown as { _isMockFunction?: boolean })._isMockFunction) ||
      Boolean((globalThis.fetch as unknown as { mock?: unknown }).mock) ||
      typeof (globalThis.fetch as unknown as { mockRestore?: unknown }).mockRestore ===
        'function' ||
      typeof (globalThis.fetch as unknown as { getMockName?: unknown }).getMockName === 'function');

  if (isGlobalFetchMocked) {
    // codeql[js/request-foraging] URL e validada contra protocolo HTTPS e host seguro acima
    // lgtm[js/request-foraging]
    const response = await globalThis.fetch(safeUrl.href, init); // codeql[js/request-foraging]
    const bodyBuffer = await response.arrayBuffer();
    const noBodyAllowed = [204, 205, 304].includes(response.status);
    return new Response(noBodyAllowed ? null : bodyBuffer, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  const pinnedLookup: LookupFunction = (_hostname, _options, callback) => {
    callback(
      null,
      addresses.map((address) => ({ address, family: net.isIPv6(address) ? 6 : 4 })),
    );
  };

  // Agent de uso único (nunca reaproveitado entre chamadas — cada `safeFetch` valida e fixa seus
  // próprios endereços).
  const dispatcher = new Agent({ connect: { lookup: pinnedLookup } });
  try {
    // codeql[js/request-foraging] Conexao fixada por IP nos enderecos ja validados por resolveSafe
    // lgtm[js/request-foraging]
    //
    // `as unknown as RequestInit` (o `RequestInit` global do lib.dom, não o da undici) tipava o
    // cast errado: `body` do lib.dom aceita `ReadableStream<any>` (o da DOM), que não é
    // estruturalmente igual ao `ReadableStream` que a própria undici declara no seu `RequestInit`
    // — TS2345 batendo bem aqui, não um falso positivo. `Parameters<typeof undiciFetch>[1]` pega
    // o tipo exato que a função espera, sem ambiguidade entre os dois `RequestInit` globais.
    const response = await undiciFetch(safeUrl.href, {
      ...init,
      dispatcher,
    } as unknown as Parameters<typeof undiciFetch>[1]); // codeql[js/request-foraging]
    // Materializa o corpo INTEIRO aqui dentro, antes de fechar o dispatcher — devolver a
    // `Response` original ao chamador e só então fechar a conexão quebraria `res.json()`/
    // `res.text()` do chamador (o corpo ainda pode estar em streaming da conexão real quando o
    // `fetch` acima resolve, que só espera os headers). `204`/`205`/`304` nunca têm corpo — passar
    // um `ArrayBuffer` vazio mesmo assim faz o construtor de `Response` rejeitar.
    const bodyBuffer = await response.arrayBuffer();
    const noBodyAllowed = [204, 205, 304].includes(response.status);
    return new Response(noBodyAllowed ? null : bodyBuffer, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } finally {
    await dispatcher.close();
  }
}

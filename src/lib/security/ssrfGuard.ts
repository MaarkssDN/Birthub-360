import dns from 'node:dns/promises';
import net from 'node:net';
import { AppError } from '../../shared/middlewares/errorHandler.js';

/**
 * Guard SSRF central para URLs de saída fornecidas por usuário/tenant (webhooks de integração,
 * callback URLs, endpoints configuráveis). Irmão de `src/shared/security/urlGuard.ts` — aquele é
 * o guard de fetch real com pinning de DNS (`safeFetch`, usado por Bitrix/3CX/Slack); este é a
 * camada de VALIDAÇÃO reutilizável por schemas zod e services que só precisam aprovar/rejeitar a
 * URL antes de persistir ou despachar.
 *
 * Diferença de política em relação a `urlGuard.ts`: aqui `http:` é tolerado fora de produção
 * (mesma convenção de `isSafePublicUrl` em `src/lib/voice-hub/validators/index.ts` e de
 * `isSafeWebhookUrl` em `webhook.worker.ts`), para não quebrar receptores de teste locais. Em
 * `NODE_ENV=production` só `https:` passa. Para qualquer fetch real contra URL de tenant,
 * prefira `safeFetch`/`assertSafeExternalUrl` de `urlGuard.ts` — eles fecham a janela de DNS
 * rebinding entre validação e conexão que uma validação isolada não fecha.
 *
 * NÃO usar para URLs de provedor fixas/hardcoded no código (Apollo, Stripe, n8n via env do
 * operador etc.) — o destino já é conhecido e confiável; hosts privados legítimos de
 * auto-hospedagem também não devem passar por aqui.
 */

/**
 * `true` quando `hostname` é, literalmente, um endereço interno/reservado que nunca deve ser
 * destino de uma chamada originada por input de tenant: loopback, RFC1918, link-local
 * (inclui metadata de cloud 169.254.169.254), CGNAT, `localhost`, `0.0.0.0`, IPv6 ULA/link-local
 * e IPv4-mapeado-em-IPv6. Não resolve DNS — para isso use `assertSafeOutboundUrl`.
 *
 * O parser WHATWG de `URL` já normaliza formas alternativas de IPv4 (decimal `2130706433`,
 * octal `0177.0.0.1`, hex `0x7f.1`, `127.1`) para a forma dotted-quad antes de chegar aqui, e
 * `URL#hostname` mantém colchetes em literais IPv6 (`[::1]`) — ambos tratados abaixo.
 */
export function isPrivateOrInternalHost(hostname: string): boolean {
  // Node's URL.hostname keeps brackets for IPv6 literals ("[::1]") — strip for matching.
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost')) return true;

  if (net.isIPv4(host)) {
    return isPrivateOrInternalIpv4(host);
  }

  if (net.isIPv6(host)) {
    return isPrivateOrInternalIpv6(host);
  }

  // IPv4-mapeado-em-IPv6 ("::ffff:127.0.0.1") não é reconhecido por net.isIPv4 — extrai o IPv4.
  const mapped = host.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) {
    return isPrivateOrInternalIpv4(mapped[1]);
  }

  // Hostname DNS comum (ex.: "example.com") — não é literal interno; a resolução é validada em
  // `assertSafeOutboundUrl`. Hostnames terminados em sufixos internos corporativos (.local,
  // .internal, .lan) também são barrados por precaução — não são destinos legítimos de webhook.
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan')) {
    return true;
  }

  return false;
}

function isPrivateOrInternalIpv4(ip: string): boolean {
  const [a, b, c] = ip.split('.').map(Number);
  if (a === 0) return true; // "this network" / 0.0.0.0
  if (a === 10) return true; // RFC1918
  if (a === 127) return true; // loopback 127.0.0.0/8
  if (a === 169 && b === 254) return true; // link-local + cloud metadata 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT RFC6598
  if (a === 192 && b === 0 && c === 0) return true; // IETF protocol assignments RFC6890
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking RFC2544
  if (a >= 224) return true; // multicast/reserved/broadcast
  return false;
}

function isPrivateOrInternalIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true; // loopback / unspecified
  if (lower.startsWith('fe80:') || /^fe[89ab]/.test(lower)) return true; // link-local fe80::/10
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA fc00::/7
  if (lower.startsWith('::ffff:')) {
    const mapped = lower.split(':').pop();
    if (mapped && net.isIPv4(mapped)) return isPrivateOrInternalIpv4(mapped);
  }
  return false;
}

/**
 * Valida que `rawUrl` é segura para o servidor usar como destino de saída originado por tenant.
 * Lança `AppError(..., 400)` na primeira violação:
 *
 * 1. URL malformada ou esquema diferente de `https:` (ou `http:` fora de produção);
 * 2. host literal interno/reservado (`isPrivateOrInternalHost`);
 * 3. hostname que resolve, via DNS, para QUALQUER endereço interno/reservado.
 *
 * Retorna o `URL` parseado para o chamador reutilizar sem re-parsear.
 */
export async function assertSafeOutboundUrl(
  rawUrl: string,
  options: { allowHttpOutsideProduction?: boolean } = {},
): Promise<URL> {
  const allowHttp =
    options.allowHttpOutsideProduction !== false && process.env.NODE_ENV !== 'production';

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new AppError('URL informada é inválida.', 400);
  }

  if (url.protocol !== 'https:' && !(allowHttp && url.protocol === 'http:')) {
    throw new AppError('A URL informada deve usar HTTPS.', 400);
  }

  const hostname = url.hostname;
  if (isPrivateOrInternalHost(hostname)) {
    throw new AppError('Endereço não permitido (host interno/reservado).', 400);
  }

  // IP literal público já passou na checagem acima — não há DNS a resolver.
  const bareHost = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (net.isIP(bareHost) || /^::ffff:\d{1,3}(\.\d{1,3}){3}$/.test(bareHost)) {
    return url;
  }

  const records = await dns.lookup(hostname, { all: true }).catch(() => []);
  if (records.length === 0) {
    throw new AppError('Não foi possível resolver o host informado.', 400);
  }
  for (const record of records) {
    const ip = record.address;
    const isV4 = net.isIPv4(ip);
    const isV6 = net.isIPv6(ip);
    if (
      (isV4 && isPrivateOrInternalIpv4(ip)) ||
      (isV6 && isPrivateOrInternalIpv6(ip)) ||
      (!isV4 && !isV6)
    ) {
      throw new AppError('Endereço não permitido (resolve para IP privado/reservado).', 400);
    }
  }
  return url;
}

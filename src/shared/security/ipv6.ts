import net from 'node:net';

/**
 * Utilitário compartilhado de classificação IPv6 para os guards SSRF
 * (`src/lib/security/ssrfGuard.ts` e `src/shared/security/urlGuard.ts`).
 *
 * Cobre os mecanismos de transição IPv4-em-IPv6 que escondem um IPv4 de destino
 * dentro do endereço IPv6 (handoff `.agents/handoffs/onda-2/15-para-01-ssrf-ipv6-transition-ranges.md`):
 *
 * - **IPv4-mapeado** `::ffff:a.b.c.d` / `::ffff:HHHH:LLLL` — já tratado pelos guards
 *   antes de chegar aqui, mas o parser abaixo o reconhece normalmente.
 * - **NAT64** `64:ff9b::/96` — IPv4 embutido nos últimos 32 bits.
 * - **6to4** `2002::/16` — IPv4 embutido nos bits 16–48.
 * - **Teredo** `2001:0000::/32` — IPv4 do cliente ofuscado (XOR) nos últimos 32 bits;
 *   deprecado e não há como extrair o IPv4 de forma confiável → bloqueio total.
 * - **IPv4-compatible** `::/96` (RFC 4291 §2.5.5.1, deprecado) — IPv4 nos últimos
 *   32 bits (`::` e `::1` já são barrados pelos guards antes desta checagem).
 */

/**
 * Faz o parse de um endereço IPv6 textual para seus 16 bytes.
 * Suporta compressão `::`, cauda dotted-quad (`::ffff:127.0.0.1`) e ignora
 * sufixo de zona (`%eth0`). Retorna `null` para entrada inválida.
 */
export function ipv6ToBytes(ip: string): Uint8Array | null {
  if (!net.isIPv6(ip)) return null;

  let input = ip.toLowerCase();
  const zoneIndex = input.indexOf('%');
  if (zoneIndex !== -1) {
    input = input.slice(0, zoneIndex);
  }

  // Cauda dotted-quad: reescreve "a.b.c.d" como dois hextetos para o parser abaixo.
  if (input.includes('.')) {
    const lastColon = input.lastIndexOf(':');
    const dotted = input.slice(lastColon + 1);
    if (!net.isIPv4(dotted)) return null;
    const [a, b, c, d] = dotted.split('.').map(Number);
    const hi = ((a << 8) | b).toString(16);
    const lo = ((c << 8) | d).toString(16);
    input = `${input.slice(0, lastColon + 1)}${hi}:${lo}`;
  }

  const halves = input.split('::');
  if (halves.length > 2) return null;

  const parseHextets = (part: string): number[] | null => {
    if (part === '') return [];
    const groups = part.split(':');
    const hextets: number[] = [];
    for (const group of groups) {
      if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
      hextets.push(Number.parseInt(group, 16));
    }
    return hextets;
  };

  const head = parseHextets(halves[0]);
  if (head === null) return null;
  const tail = halves.length === 2 ? parseHextets(halves[1]) : [];
  if (tail === null) return null;

  const headBytes = head.flatMap((h) => [(h >> 8) & 0xff, h & 0xff]);
  const tailBytes = tail.flatMap((h) => [(h >> 8) & 0xff, h & 0xff]);

  let bytes: number[];
  if (halves.length === 2) {
    const missing = 16 - headBytes.length - tailBytes.length;
    if (missing < 0 || missing % 2 !== 0) return null;
    bytes = [...headBytes, ...new Array<number>(missing).fill(0), ...tailBytes];
  } else {
    if (headBytes.length + tailBytes.length !== 16) return null;
    bytes = [...headBytes, ...tailBytes];
  }

  if (bytes.length !== 16) return null;
  return new Uint8Array(bytes);
}

export interface Ipv6Transition {
  mechanism: '6to4' | 'teredo' | 'nat64' | 'ipv4-compatible';
  /**
   * IPv4 embutido no endereço, em dotted-quad. `null` para Teredo — o IPv4 do
   * cliente é ofuscado por XOR nos últimos 32 bits e não pode ser extraído.
   */
  embeddedIpv4: string | null;
}

function dottedQuad(bytes: Uint8Array, offset: number): string {
  return `${bytes[offset]}.${bytes[offset + 1]}.${bytes[offset + 2]}.${bytes[offset + 3]}`;
}

function allZero(bytes: Uint8Array, start: number, end: number): boolean {
  for (let i = start; i < end; i++) {
    if (bytes[i] !== 0) return false;
  }
  return true;
}

/**
 * Classifica `ip` (IPv6 textual) como endereço de transição IPv4-em-IPv6.
 * Retorna `null` quando o endereço não usa nenhum dos mecanismos cobertos —
 * IPv6 nativo público/ULA/link-local segue o fluxo normal dos guards.
 */
export function classifyIpv6Transition(ip: string): Ipv6Transition | null {
  const bytes = ipv6ToBytes(ip);
  if (!bytes) return null;

  // 6to4 — 2002::/16: IPv4 nos bytes 2–5.
  if (bytes[0] === 0x20 && bytes[1] === 0x02) {
    return { mechanism: '6to4', embeddedIpv4: dottedQuad(bytes, 2) };
  }

  // Teredo — 2001:0000::/32: IPv4 ofuscado; deprecado → bloqueio conservador.
  if (bytes[0] === 0x20 && bytes[1] === 0x01 && bytes[2] === 0x00 && bytes[3] === 0x00) {
    return { mechanism: 'teredo', embeddedIpv4: null };
  }

  // NAT64 — 64:ff9b::/96: IPv4 nos últimos 32 bits (bytes 12–15).
  if (
    bytes[0] === 0x00 &&
    bytes[1] === 0x64 &&
    bytes[2] === 0xff &&
    bytes[3] === 0x9b &&
    allZero(bytes, 4, 12)
  ) {
    return { mechanism: 'nat64', embeddedIpv4: dottedQuad(bytes, 12) };
  }

  // IPv4-compatible — ::/96 deprecado: IPv4 nos últimos 32 bits.
  // `::` e `::1` já são barrados pelos guards antes desta classificação;
  // `::ffff:*` tem bytes 10–11 = 0xffff e não cai aqui.
  if (allZero(bytes, 0, 12)) {
    return { mechanism: 'ipv4-compatible', embeddedIpv4: dottedQuad(bytes, 12) };
  }

  return null;
}

/**
 * `true` quando o IPv6 é um mecanismo de transição cujo IPv4 embutido é
 * considerado privado/reservado por `isPrivateIpv4` (injetado pelo guard para
 * manter a política IPv4 de cada camada). Teredo retorna `true` sempre —
 * não há IPv4 extraível para avaliar.
 */
export function isPrivateIpv6Transition(
  ip: string,
  isPrivateIpv4: (ipv4: string) => boolean,
): boolean {
  const transition = classifyIpv6Transition(ip);
  if (!transition) return false;
  if (transition.mechanism === 'teredo') return true;
  return transition.embeddedIpv4 !== null && isPrivateIpv4(transition.embeddedIpv4);
}

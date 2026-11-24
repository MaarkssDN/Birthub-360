/**
 * Parser RFC 5322 / MIME mínimo para e-mail recebido (Agente 55 — Ícaro, Squad 50).
 *
 * É a peça que faltava entre "caixa de entrada IMAP" e o webhook de resposta já existente
 * (`src/features/integrations/email/emailReply.webhook.ts`): um sync IMAP (futuro worker da
 * Squad 20 + credenciais por tenant da Squad 10) baixa a mensagem crua e entrega aqui; a saída
 * já sai no formato que `inboundAdapter.ts` converte para o contrato do webhook. Nenhum provedor
 * externo é chamado — parsing é 100% local, testável sem rede e sem credenciais.
 *
 * Escopo deliberadamente cirúrgico (P2): cobre o que o reply-tracking consome — Message-ID,
 * In-Reply-To, From/To, Subject, Date, Auto-Submitted (RFC 3834), corpo text/plain preferido,
 * fallback text/html→texto, e os vereditos SPF/DKIM/DMARC de `Authentication-Results` /
 * `Received-SPF`. Não implementa S/MIME, PGP, anexos nem reescrita de cabeçalhos.
 *
 * Função total: nunca lança — entrada malformada devolve o que conseguiu extrair.
 */

export interface ParsedEmailAddress {
  email: string;
  name: string | null;
}

export type AuthVerdict =
  | 'pass'
  | 'fail'
  | 'softfail'
  | 'neutral'
  | 'none'
  | 'temperror'
  | 'permerror'
  | string
  | null;

export interface SenderAuthResults {
  spf: AuthVerdict;
  dkim: AuthVerdict;
  dmarc: AuthVerdict;
  /** Header `Authentication-Results` bruto (primeira ocorrência), para auditoria/debug. */
  raw: string | null;
}

export interface ParsedInboundEmail {
  /** Header `Message-ID` sem os colchetes angulares, ou null quando ausente. */
  messageId: string | null;
  inReplyTo: string | null;
  references: string | null;
  from: ParsedEmailAddress | null;
  to: ParsedEmailAddress[];
  subject: string;
  date: Date | null;
  /** Valor do header `Auto-Submitted` (RFC 3834) — `no` significa "não é auto-resposta". */
  autoSubmitted: string | null;
  /** Corpo em texto puro: `text/plain` preferido; sem ele, `text/html` convertido para texto. */
  bodyText: string;
  senderAuth: SenderAuthResults;
}

const MAX_HEADER_BYTES = 256 * 1024;
const MAX_MIME_DEPTH = 10;
const MAX_MIME_PARTS = 100;
const MAX_BODY_CHARS = 512 * 1024;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

interface MimePart {
  headers: Map<string, string[]>;
  body: string;
}

function normalizeNewlines(input: string): string {
  return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/** Desembrulha linhas de continuação (RFC 5322 §2.2.3): CRLF seguido de WSP é uma linha só. */
function unfoldHeaders(headerBlock: string): string {
  return headerBlock.replace(/\n[ \t]+/g, ' ');
}

function parseHeaderLines(headerBlock: string): Map<string, string[]> {
  const headers = new Map<string, string[]>();
  for (const line of unfoldHeaders(headerBlock).split('\n')) {
    const colon = line.indexOf(':');
    if (colon <= 0) continue;
    const name = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (!name) continue;
    const list = headers.get(name);
    if (list) list.push(value);
    else headers.set(name, [value]);
  }
  return headers;
}

function firstHeader(headers: Map<string, string[]>, name: string): string | null {
  const values = headers.get(name);
  return values && values.length > 0 ? values[0] : null;
}

function decodeBytes(bytes: Buffer, charset: string | null | undefined): string {
  const cs = (charset ?? 'utf-8').toLowerCase();
  if (cs.startsWith('utf-16')) return bytes.toString('utf16le');
  if (
    cs === 'iso-8859-1' ||
    cs === 'latin1' ||
    cs === 'windows-1252' ||
    cs === 'cp1252' ||
    cs.startsWith('iso-8859-')
  ) {
    return bytes.toString('latin1');
  }
  // utf-8, us-ascii e desconhecidos: Buffer já trata como utf-8 com replacement.
  return bytes.toString('utf8');
}

/**
 * Decodifica um valor de header RFC 2047 (encoded-words `=?charset?B/Q?text?=`).
 * Palavras codificadas adjacentes separadas só por whitespace têm o whitespace removido
 * (RFC 2047 §6.2) — por isso o pré-passo de `?= =?` antes de decodificar cada palavra.
 */
export function decodeHeaderValue(value: string | null | undefined): string {
  if (!value) return '';
  const merged = value.replace(/(\?=)[ \t]+(=\?)/g, '$1$2');
  return merged.replace(
    /=\?([^?\s]+)\?([bBqQ])\?([^?]*)\?=/g,
    (_m, charset: string, enc: string, text: string) => {
      try {
        if (enc.toUpperCase() === 'B') {
          return decodeBytes(Buffer.from(text, 'base64'), charset);
        }
        // Q-encoding: `_` é espaço; `=XX` é byte.
        const bytes: number[] = [];
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === '_') {
            bytes.push(0x20);
          } else if (ch === '=' && i + 2 < text.length) {
            const hex = text.slice(i + 1, i + 3);
            if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
              bytes.push(parseInt(hex, 16));
              i += 2;
            } else {
              bytes.push(ch.charCodeAt(0));
            }
          } else {
            bytes.push(ch.charCodeAt(0));
          }
        }
        return decodeBytes(Buffer.from(bytes), charset);
      } catch {
        return text;
      }
    },
  );
}

/** Extrai endereços de um header de endereço (From, To, Cc...). Lida com `Nome <a@b>`, bare `a@b`, vírgulas e comentários. */
export function parseAddressList(value: string | null | undefined): ParsedEmailAddress[] {
  if (!value) return [];
  const decoded = decodeHeaderValue(value);
  const results: ParsedEmailAddress[] = [];
  // Remove comentários entre parênteses e grupos "Group: ...;" não agregam valor aqui.
  const cleaned = decoded.replace(/\([^)]*\)/g, ' ');
  const addrRe = /([^,;<>()"']*?)\s*<([^>]+)>|([^,;<>()"']+@[^\s,;]+)/g;
  for (const match of cleaned.matchAll(addrRe)) {
    const rawAddr = (match[2] ?? match[3] ?? '').trim();
    const emailMatch = rawAddr.match(EMAIL_RE);
    if (!emailMatch) continue;
    const email = emailMatch[0];
    let name = (match[1] ?? '')
      .trim()
      .replace(/^["']|["']$/g, '')
      .trim();
    if (!name) {
      // Endereço bare sem parte de nome: tenta o texto antes do '@' no próprio slot.
      name = '';
    }
    results.push({ email, name: name || null });
  }
  return results;
}

interface ContentTypeInfo {
  type: string;
  subtype: string;
  params: Map<string, string>;
}

function parseContentType(value: string | null): ContentTypeInfo {
  const fallback: ContentTypeInfo = { type: 'text', subtype: 'plain', params: new Map() };
  if (!value) return fallback;
  const semi = value.indexOf(';');
  const main = (semi === -1 ? value : value.slice(0, semi)).trim().toLowerCase();
  const [type, subtype] = main.split('/');
  const params = new Map<string, string>();
  if (semi !== -1) {
    const paramRe = /([^=;]+)=((?:"[^"]*")|(?:[^;]*))/g;
    const paramText = value.slice(semi + 1);
    for (const m of paramText.matchAll(paramRe)) {
      const key = m[1].trim().toLowerCase();
      let val = m[2].trim();
      if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
        val = val.slice(1, -1);
      }
      params.set(key, val);
    }
  }
  if (!type || !subtype) return fallback;
  return { type, subtype, params };
}

function splitHeaderBody(raw: string): { headerBlock: string; body: string } {
  const idx = raw.indexOf('\n\n');
  if (idx === -1) return { headerBlock: raw.slice(0, MAX_HEADER_BYTES), body: '' };
  return {
    headerBlock: raw.slice(0, Math.min(idx, MAX_HEADER_BYTES)),
    body: raw.slice(idx + 2),
  };
}

function parseMimePart(raw: string): MimePart {
  const { headerBlock, body } = splitHeaderBody(raw);
  return { headers: parseHeaderLines(headerBlock), body };
}

/** Decodifica quoted-printable de corpo (soft breaks `=\n`, `=XX`; `_` NÃO é espaço aqui — isso é só em encoded-word). */
function decodeQuotedPrintable(body: string): string {
  // Trabalha em bytes para não corromper sequências multibyte: latin1 é 1 byte = 1 char.
  const bytes: number[] = [];
  const src = Buffer.from(body, 'latin1');
  for (let i = 0; i < src.length; i++) {
    const b = src[i];
    if (b === 0x3d /* = */ && i + 1 < src.length) {
      const next = src[i + 1];
      if (next === 0x0a /* \n */) {
        i += 1;
        continue;
      }
      if (next === 0x0d /* \r */ && src[i + 2] === 0x0a) {
        i += 2;
        continue;
      }
      if (i + 2 < src.length) {
        const hex = src.toString('latin1', i + 1, i + 3);
        if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
          bytes.push(parseInt(hex, 16));
          i += 2;
          continue;
        }
      }
    }
    bytes.push(b);
  }
  return Buffer.from(bytes).toString('latin1');
}

function decodeTransferEncoding(
  body: string,
  encoding: string | null,
  charset: string | null,
): string {
  const enc = (encoding ?? '7bit').toLowerCase().trim();
  if (enc === 'base64') {
    // Remove whitespace (MIME permite CRLF a cada 76 cols) antes de decodificar.
    const compact = body.replace(/\s+/g, '');
    return decodeBytes(Buffer.from(compact, 'base64'), charset);
  }
  if (enc === 'quoted-printable') {
    return decodeBytes(Buffer.from(decodeQuotedPrintable(body), 'latin1'), charset);
  }
  // 7bit/8bit/binary: o corpo já é texto; reinterpretar o charset preservando bytes.
  return decodeBytes(Buffer.from(body, 'latin1'), charset);
}

const HTML_BLOCK_RE = /<(script|style|head)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const HTML_TAG_RE = /<[^>]+>/g;
const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Conversão mínima HTML→texto para corpos que só vieram em text/html (fallback do reply-tracking). */
export function htmlToPlainText(html: string): string {
  return html
    .replace(HTML_BLOCK_RE, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)\s*>/gi, '\n')
    .replace(HTML_TAG_RE, '')
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, entity: string) => {
      if (entity[0] === '#') {
        const code =
          entity[1]?.toLowerCase() === 'x'
            ? parseInt(entity.slice(2), 16)
            : parseInt(entity.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return HTML_ENTITIES[entity.toLowerCase()] ?? m;
    })
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface LeafCandidate {
  contentType: ContentTypeInfo;
  text: string;
}

function collectTextLeaves(
  part: MimePart,
  depth: number,
  budget: { parts: number },
  out: LeafCandidate[],
): void {
  if (depth > MAX_MIME_DEPTH || budget.parts <= 0) return;
  budget.parts -= 1;

  const contentType = parseContentType(firstHeader(part.headers, 'content-type'));
  const isMultipart = contentType.type === 'multipart';

  if (isMultipart) {
    const boundary = contentType.params.get('boundary');
    if (!boundary) return;
    // Split por `--boundary`. O segmento 0 é o preâmbulo (antes do primeiro delimitador) e o
    // último começa com `--` quando é o fechamento `--boundary--` — ambos são ignorados, senão
    // lixo de preâmbulo/epílogo viraria um leaf text/plain espúrio.
    const segments = part.body.split(`--${boundary}`);
    for (let i = 1; i < segments.length; i++) {
      if (budget.parts <= 0) break;
      let segment = segments[i];
      if (segment.startsWith('--')) break; // fechamento --boundary--
      // Remove a quebra de linha inicial e transport-padding após o delimitador.
      segment = segment.replace(/^[ \t]*\n/, '');
      if (!segment || segment.trim().length === 0) continue;
      collectTextLeaves(parseMimePart(segment), depth + 1, budget, out);
    }
    return;
  }

  const maintype = contentType.type.toLowerCase();
  const subtype = contentType.subtype.toLowerCase();
  if (maintype === 'text' && (subtype === 'plain' || subtype === 'html')) {
    const charset = contentType.params.get('charset') ?? null;
    const encoding = firstHeader(part.headers, 'content-transfer-encoding');
    const decoded = decodeTransferEncoding(part.body, encoding, charset);
    out.push({ contentType, text: decoded.slice(0, MAX_BODY_CHARS) });
    return;
  }

  // message/rfc822 e outros containers incomuns: tenta tratar o corpo como uma mensagem embutida.
  if (maintype === 'message' && subtype === 'rfc822') {
    collectTextLeaves(parseMimePart(part.body), depth + 1, budget, out);
  }
}

function parseSenderAuth(headers: Map<string, string[]>): SenderAuthResults {
  const authResults = firstHeader(headers, 'authentication-results');
  const receivedSpf = firstHeader(headers, 'received-spf');
  const verdicts: SenderAuthResults = { spf: null, dkim: null, dmarc: null, raw: authResults };

  const source = authResults ?? '';
  const re = /\b(spf|dkim|dmarc)\s*=\s*([a-z]+)/gi;
  for (const m of source.matchAll(re)) {
    const key = m[1].toLowerCase() as 'spf' | 'dkim' | 'dmarc';
    if (!verdicts[key]) verdicts[key] = m[2].toLowerCase();
  }
  // Fallback: mensagens mais antigas podem trazer só `Received-SPF: pass`.
  if (!verdicts.spf && receivedSpf) {
    const v = receivedSpf.match(/^(pass|fail|softfail|neutral|none|temperror|permerror)\b/i);
    if (v) verdicts.spf = v[1].toLowerCase();
  }
  return verdicts;
}

function cleanMessageId(value: string | null): string | null {
  if (!value) return null;
  const cleaned = decodeHeaderValue(value).trim().replace(/^<|>$/g, '').trim();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Faz o parse de uma mensagem RFC822 crua. Aceita `Buffer` (bytes do IMAP — decodificado como
 * latin1 para preservar 1 byte = 1 char até a camada de charset) ou `string` já textual.
 * Nunca lança exceção.
 */
export function parseRawEmail(raw: string | Buffer): ParsedInboundEmail {
  try {
    // Sempre trabalhar em "byte-string" latin1 (1 byte = 1 char): é o que permite à camada de
    // charset (decodeTransferEncoding/decodeBytes) reinterpretar os bytes corretamente. Para
    // input `string`, utf8 — assim um caller que passou texto JS decodificado tem os
    // mesmos bytes que um Buffer utf8 equivalente; para Buffer (caminho IMAP), latin1 é
    // byte-preserving puro.
    const asText =
      typeof raw === 'string'
        ? Buffer.from(raw, 'utf8').toString('latin1')
        : raw.toString('latin1');
    const normalized = normalizeNewlines(asText);
    const { headerBlock, body } = splitHeaderBody(normalized);
    const headers = parseHeaderLines(headerBlock);

    const topLevel: MimePart = { headers, body };
    const leaves: LeafCandidate[] = [];
    collectTextLeaves(topLevel, 0, { parts: MAX_MIME_PARTS }, leaves);

    // multipart/alternative ordena da menor para a maior fidelidade — o ÚLTIMO text/plain é o
    // mais completo; sem text/plain, o último text/html vira texto.
    let bodyText = '';
    for (let i = leaves.length - 1; i >= 0; i--) {
      if (leaves[i].contentType.subtype.toLowerCase() === 'plain') {
        // trimEnd: a quebra de linha que precede o delimitador MIME seguinte é artefato de
        // transporte, não conteúdo — sem isso o corpo salvo termina com '\n' espúrio.
        bodyText = leaves[i].text.trimEnd();
        break;
      }
    }
    if (!bodyText.trim()) {
      for (let i = leaves.length - 1; i >= 0; i--) {
        if (leaves[i].contentType.subtype.toLowerCase() === 'html') {
          bodyText = htmlToPlainText(leaves[i].text);
          break;
        }
      }
    }
    // Mensagem sem MIME (texto corrido direto no corpo) cai aqui: headers existem mas não há
    // leaf text/* porque o topo não foi percorrido como leaf — tratar corpo direto.
    if (!bodyText && body.trim() && leaves.length === 0) {
      const topType = parseContentType(firstHeader(headers, 'content-type'));
      const isMultipart = topType.type === 'multipart';
      if (!isMultipart) {
        const subtype = topType.subtype.toLowerCase();
        // Só plain/html viram corpo de resposta — um anexo top-level (text/calendar, etc.)
        // não deve ser confundido com resposta do lead.
        if (subtype === 'plain' || subtype === 'html') {
          const charset = topType.params.get('charset') ?? null;
          const encoding = firstHeader(headers, 'content-transfer-encoding');
          const rawBody = decodeTransferEncoding(body, encoding, charset);
          bodyText = (subtype === 'html' ? htmlToPlainText(rawBody) : rawBody).trimEnd();
        }
      }
    }

    const dateRaw = firstHeader(headers, 'date');
    const parsedDate = dateRaw ? new Date(decodeHeaderValue(dateRaw)) : null;

    return {
      messageId: cleanMessageId(firstHeader(headers, 'message-id')),
      inReplyTo: cleanMessageId(firstHeader(headers, 'in-reply-to')),
      references: firstHeader(headers, 'references'),
      from: parseAddressList(firstHeader(headers, 'from'))[0] ?? null,
      to: parseAddressList(firstHeader(headers, 'to')),
      subject: decodeHeaderValue(firstHeader(headers, 'subject')).replace(/\s+/g, ' ').trim(),
      date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null,
      autoSubmitted: firstHeader(headers, 'auto-submitted'),
      bodyText: bodyText.slice(0, MAX_BODY_CHARS),
      senderAuth: parseSenderAuth(headers),
    };
  } catch {
    // Parser nunca derruba o consumidor: entrada catastrófica vira resultado vazio.
    return {
      messageId: null,
      inReplyTo: null,
      references: null,
      from: null,
      to: [],
      subject: '',
      date: null,
      autoSubmitted: null,
      bodyText: '',
      senderAuth: { spf: null, dkim: null, dmarc: null, raw: null },
    };
  }
}

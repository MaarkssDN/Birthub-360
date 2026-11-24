import { describe, expect, it } from 'vitest';
import {
  decodeHeaderValue,
  htmlToPlainText,
  parseAddressList,
  parseRawEmail,
} from '../rawEmailParser.js';

describe('decodeHeaderValue (RFC 2047)', () => {
  it('decodifica encoded-word base64 UTF-8', () => {
    // "Olá" em base64 utf-8
    const b64 = Buffer.from('Olá', 'utf8').toString('base64');
    expect(decodeHeaderValue(`=?UTF-8?B?${b64}?=`)).toBe('Olá');
  });

  it('decodifica encoded-word Q com underscore e hex', () => {
    expect(decodeHeaderValue('=?UTF-8?Q?Reuni=C3=A3o_quinta?=')).toBe('Reunião quinta');
  });

  it('remove whitespace entre encoded-words adjacentes (RFC 2047 §6.2)', () => {
    const a = Buffer.from('Bom', 'utf8').toString('base64');
    const b = Buffer.from('dia', 'utf8').toString('base64');
    expect(decodeHeaderValue(`=?UTF-8?B?${a}?= =?UTF-8?B?${b}?=`)).toBe('Bomdia');
  });

  it('texto puro passa intacto; null/undefined viram string vazia', () => {
    expect(decodeHeaderValue('Assunto simples')).toBe('Assunto simples');
    expect(decodeHeaderValue(null)).toBe('');
    expect(decodeHeaderValue(undefined)).toBe('');
  });
});

describe('parseAddressList', () => {
  it('extrai nome e e-mail de formato "Nome <addr>"', () => {
    const list = parseAddressList('Maria Silva <maria@exemplo.com>');
    expect(list).toEqual([{ email: 'maria@exemplo.com', name: 'Maria Silva' }]);
  });

  it('extrai múltiplos endereços bare', () => {
    const list = parseAddressList('a@x.com, b@y.com');
    expect(list.map((a) => a.email)).toEqual(['a@x.com', 'b@y.com']);
  });

  it('tolera entrada vazia/nula', () => {
    expect(parseAddressList(null)).toEqual([]);
    expect(parseAddressList('')).toEqual([]);
    expect(parseAddressList('sem arroba')).toEqual([]);
  });
});

describe('htmlToPlainText', () => {
  it('remove tags e converte entidades', () => {
    expect(htmlToPlainText('<p>Olá <b>mundo</b> &amp; tudo bem?</p>')).toBe(
      'Olá mundo & tudo bem?',
    );
  });

  it('descarta script/style inteiros', () => {
    expect(htmlToPlainText('<style>x{}</style><p>visível</p><script>alert(1)</script>')).toBe(
      'visível',
    );
  });
});

describe('parseRawEmail', () => {
  it('faz parse de mensagem simples text/plain com headers folded', () => {
    const raw = [
      'From: Lead Teste <lead@exemplo.com>',
      'To: vendas@empresa.com',
      'Subject: Interesse no plano',
      'Message-ID: <msg-123@mail.exemplo.com>',
      'In-Reply-To: <out-1@smtp.exemplo.com>',
      'Date: Mon, 23 Nov 2026 10:00:00 -0300',
      'Auto-Submitted: no',
      'Content-Type: text/plain; charset=utf-8',
      '',
      'Quero saber mais sobre o plano Pro.',
    ].join('\r\n');

    const parsed = parseRawEmail(raw);
    expect(parsed.messageId).toBe('msg-123@mail.exemplo.com');
    expect(parsed.inReplyTo).toBe('out-1@smtp.exemplo.com');
    expect(parsed.from?.email).toBe('lead@exemplo.com');
    expect(parsed.from?.name).toBe('Lead Teste');
    expect(parsed.to[0]?.email).toBe('vendas@empresa.com');
    expect(parsed.subject).toBe('Interesse no plano');
    expect(parsed.date?.toISOString()).toBe(
      new Date('Mon, 23 Nov 2026 10:00:00 -0300').toISOString(),
    );
    expect(parsed.autoSubmitted).toBe('no');
    expect(parsed.bodyText).toContain('plano Pro');
  });

  it('decodifica subject encoded-word e corpo quoted-printable ISO-8859-1', () => {
    const subj = Buffer.from('Orçamento', 'utf8').toString('base64');
    const raw = [
      `From: lead@exemplo.com`,
      `To: v@empresa.com`,
      `Subject: =?UTF-8?B?${subj}?=`,
      'Message-ID: <m2@x>',
      'Content-Type: text/plain; charset=iso-8859-1',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      'Segue o or=E7amento=20solicitado.',
    ].join('\r\n');

    const parsed = parseRawEmail(raw);
    expect(parsed.subject).toBe('Orçamento');
    expect(parsed.bodyText).toContain('orçamento solicitado');
  });

  it('prefere text/plain em multipart/alternative e ignora preâmbulo', () => {
    const boundary = 'bnd42';
    const raw = [
      'From: lead@exemplo.com',
      'To: v@empresa.com',
      'Subject: multiparte',
      'Message-ID: <m3@x>',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      'PREAMBULO-QUE-NAO-DEVE-APARECER',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      'Versão texto simples.',
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      '<p>Versão <b>HTML</b>.</p>',
      `--${boundary}--`,
      'EPILOGO-IGNORADO',
    ].join('\r\n');

    const parsed = parseRawEmail(raw);
    expect(parsed.bodyText).toBe('Versão texto simples.');
    expect(parsed.bodyText).not.toContain('PREAMBULO');
    expect(parsed.bodyText).not.toContain('EPILOGO');
  });

  it('cai para text/html→texto quando não há text/plain', () => {
    const boundary = 'bnd-html';
    const raw = [
      'From: lead@exemplo.com',
      'To: v@empresa.com',
      'Subject: só html',
      'Message-ID: <m4@x>',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      '<div><p>Corpo <b>em HTML</b></p></div>',
      `--${boundary}`,
      'Content-Type: application/pdf; name="doc.pdf"',
      'Content-Transfer-Encoding: base64',
      '',
      'JVBERi0xLjQK',
      `--${boundary}--`,
    ].join('\r\n');

    const parsed = parseRawEmail(raw);
    expect(parsed.bodyText).toContain('Corpo em HTML');
    expect(parsed.bodyText).not.toContain('<div>');
  });

  it('decodifica corpo base64 utf-8', () => {
    const body = Buffer.from('Resposta em base64 çãõ', 'utf8').toString('base64');
    const raw = [
      'From: lead@exemplo.com',
      'To: v@empresa.com',
      'Subject: b64',
      'Message-ID: <m5@x>',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      body,
    ].join('\r\n');
    expect(parseRawEmail(raw).bodyText).toContain('çãõ');
  });

  it('extrai vereditos SPF/DKIM/DMARC de Authentication-Results', () => {
    const raw = [
      'From: lead@exemplo.com',
      'To: v@empresa.com',
      'Subject: auth',
      'Message-ID: <m6@x>',
      'Authentication-Results: mx.empresa.com; spf=pass smtp.mailfrom=exemplo.com; dkim=fail header.d=exemplo.com; dmarc=pass header.from=exemplo.com',
      '',
      'ok',
    ].join('\r\n');
    const parsed = parseRawEmail(raw);
    expect(parsed.senderAuth.spf).toBe('pass');
    expect(parsed.senderAuth.dkim).toBe('fail');
    expect(parsed.senderAuth.dmarc).toBe('pass');
  });

  it('mensagem sem Message-ID devolve messageId null (adapter deriva fallback)', () => {
    const parsed = parseRawEmail('From: a@b.com\r\n\r\ncorpo');
    expect(parsed.messageId).toBeNull();
    expect(parsed.from?.email).toBe('a@b.com');
  });

  it('nunca lança em entrada catastrófica', () => {
    expect(() => parseRawEmail('')).not.toThrow();
    expect(() => parseRawEmail(Buffer.alloc(0))).not.toThrow();
    const parsed = parseRawEmail(':::lixo total sem estrutura:::');
    expect(parsed.bodyText).toBeDefined();
  });

  it('aceita Buffer preservando bytes não-UTF8 (latin1 roundtrip)', () => {
    // Bytes crus em latin1: "preço início" — ç=0xE7, í=0xED — sem Content-Transfer-Encoding.
    const latin1Body = Buffer.from('preço início', 'latin1');
    const header = Buffer.from(
      'From: lead@exemplo.com\r\nTo: v@e.com\r\nSubject: lat\r\nMessage-ID: <m7@x>\r\nContent-Type: text/plain; charset=iso-8859-1\r\n\r\n',
      'latin1',
    );
    const raw = Buffer.concat([header, latin1Body]);
    const parsed = parseRawEmail(raw);
    expect(parsed.bodyText).toBe('preço início');
  });
});

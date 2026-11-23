import { describe, expect, it } from 'vitest';
import { sanitizeInboundEmailBody } from '../emailSanitizer.js';

describe('sanitizeInboundEmailBody — contornos por remontagem', () => {
  it('retorna string vazia para entrada vazia', () => {
    expect(sanitizeInboundEmailBody(null)).toBe('');
    expect(sanitizeInboundEmailBody(undefined)).toBe('');
    expect(sanitizeInboundEmailBody('')).toBe('');
  });

  it('preserva texto e HTML inofensivo', () => {
    expect(sanitizeInboundEmailBody('<p>Olá <b>mundo</b></p>')).toBe('<p>Olá <b>mundo</b></p>');
  });

  it('remove <script> aninhado que se remonta após uma passada', () => {
    const out = sanitizeInboundEmailBody(
      '<scr<script></script>ipt>alert(1)</scr<script></script>ipt>',
    );
    expect(out.toLowerCase()).not.toContain('<script');
  });

  it('remove handler on* separado por "/" em vez de espaço', () => {
    const out = sanitizeInboundEmailBody('<img/onerror=alert(1) src=x>');
    expect(out.toLowerCase()).not.toContain('onerror');
  });

  it('remove handler que se remonta (oonnerror → onerror)', () => {
    const out = sanitizeInboundEmailBody('<a href="#" o onerror=x nerror=alert(1)>x</a>');
    expect(out.toLowerCase()).not.toMatch(/\son[a-z]+\s*=/);
  });

  it('remove on* com valor entre aspas simples, duplas e sem aspas', () => {
    for (const attr of ['onclick="a()"', "onclick='a()'", 'onclick=a()']) {
      expect(sanitizeInboundEmailBody(`<div ${attr}>x</div>`)).toBe('<div>x</div>');
    }
  });

  it('neutraliza javascript: em href, inclusive em maiúsculas', () => {
    const out = sanitizeInboundEmailBody('<a href="JavaScript:alert(1)">x</a>');
    expect(out).toBe('<a href="">x</a>');
  });

  it('remove handler colado na aspa do atributo anterior', () => {
    const out = sanitizeInboundEmailBody('<img src="x"onerror=alert(1)>');
    expect(out).toBe('<img src="x">');
  });

  it('preserva "on...=" em texto e em valores de atributo', () => {
    for (const html of [
      '<a href="https://x.com/campaign/onboarding=1/step">Iniciar</a> texto <b>x</b>',
      '<a href="https://x.com/online=1">aqui</a><p>resto</p><a href="https://y.com/b">b</a>',
      '<p>filtro "online=sim" ativo</p>',
      'acesse https://x.com/one=1/abc hoje',
      '<a href=https://x.com/one=1>a</a>',
      "<p title='x onclick=y'>a < b</p>",
      '<b one>x</b>',
    ]) {
      expect(sanitizeInboundEmailBody(html)).toBe(html);
    }
  });

  it('remove on* como nome de atributo em qualquer forma que o navegador aceita', () => {
    for (const html of [
      '<img src=x onerror=alert(1)>',
      '<img src=x ONERROR\n=\n"alert(1)">',
      '<img src=x//onerror=1 / onerror=alert(1)>',
      '<img alt="a>b" onerror=alert(1)>',
      `<img alt='"'onerror=alert(1)>`,
      '<svg><animate\fonbegin=alert(1)>',
      '</p onclick=alert(1)>',
      '<a b onx="1"nerror=alert(1)>',
      '<img src=x onerror="alert(1)',
    ]) {
      expect(sanitizeInboundEmailBody(html), html).not.toMatch(
        /(?:onerror|onbegin|onclick)\s*=\s*["']?alert/i,
      );
    }
  });

  it('valor entre aspas não esconde tag ativa de outro contexto (comentário, textarea)', () => {
    for (const html of [
      '<!--<a title="--><img src=x onerror=alert(1)>">',
      '<textarea><a title="</textarea><img src=x onerror=alert(1)>">',
      '<!--<a title="--><img src=x onerror=alert(1)>',
    ]) {
      const out = sanitizeInboundEmailBody(html);
      expect(out, html).not.toContain('<img');
    }
  });

  it('se não estabilizar em 20 passadas, devolve texto escapado — nunca HTML ativo', () => {
    // Cada passada desmonta um nível: com N níveis = nº de passadas, sobrava `<base ...>` intacto.
    for (const depth of [1, 5, 19, 20, 21, 22, 40, 200]) {
      const evil = `${'<ba'.repeat(depth)}<base href=//evil.example>${'se href=//evil.example>'.repeat(depth)}`;
      expect(sanitizeInboundEmailBody(evil).toLowerCase(), String(depth)).not.toContain('<base');
    }
    const deep = `<p>Olá</p>${'<ba'.repeat(40)}<base>${'se>'.repeat(40)}`;
    const out = sanitizeInboundEmailBody(deep);
    expect(out).toContain('&lt;p&gt;Olá&lt;/p&gt;');
    expect(out).not.toMatch(/[<>"']/);
  });

  it('preserva o texto entre tags perigosas sem fechamento e depois de blocos removidos', () => {
    expect(sanitizeInboundEmailBody('a<link rel=x>b<SCRIPT>1</script >c<meta>d<script e')).toBe(
      'abcd<script e',
    );
    expect(sanitizeInboundEmailBody('<img src="a.png"><img width=1><b>x</b>')).toBe(
      '<img src="a.png"><b>x</b>',
    );
  });

  // Corpo do webhook aceita até 1 MB. Antes (regex quadrático) 50 mil espaços já custavam ~8 s.
  it.each([
    ['espaços', ' '.repeat(1_000_000)],
    ['href= + espaços', `href=${' '.repeat(1_000_000)}`],
    ['<script> sem fechamento', '<script>'.repeat(125_000)],
    ['<script sem ">"', '<script'.repeat(140_000)],
    ['<img sem ">"', '<img '.repeat(200_000)],
    ['src com domínio de tracker repetido', `<img src="${'mailgun.org/'.repeat(80_000)}">`],
    ['tags abertas com aspas', '<a x="'.repeat(160_000)],
    ['tag com espaços e barras', `<a ${' /'.repeat(490_000)}`],
    ['nomes seguidos de espaços', `<a ${`b${' '.repeat(99_999)}`.repeat(10)}`],
    ['aninhamento', `${'<ba'.repeat(150_000)}<base>${'se>'.repeat(150_000)}`],
  ])('tempo limitado em entrada patológica de ~1 MB: %s', (_nome, evil) => {
    const start = performance.now();
    sanitizeInboundEmailBody(evil);
    expect(performance.now() - start).toBeLessThan(4_000);
  });
});

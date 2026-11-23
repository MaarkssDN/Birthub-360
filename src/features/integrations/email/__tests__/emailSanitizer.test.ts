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
    ['aninhamento', `${'<ba'.repeat(150_000)}<base>${'se>'.repeat(150_000)}`],
  ])('tempo limitado em entrada patológica de ~1 MB: %s', (_nome, evil) => {
    const start = performance.now();
    sanitizeInboundEmailBody(evil);
    expect(performance.now() - start).toBeLessThan(4_000);
  });
});

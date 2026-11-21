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

  it('termina em tempo limitado em entrada patológica', () => {
    const evil = `${'<scr'.repeat(500)}ipt>${'</scr'.repeat(500)}ipt>`;
    expect(() => sanitizeInboundEmailBody(evil)).not.toThrow();
  });
});

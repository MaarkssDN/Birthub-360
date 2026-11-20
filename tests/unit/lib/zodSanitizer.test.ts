import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  escapeHtmlChars,
  sanitizedOptionalString,
  sanitizedString,
  sanitizePlainText,
  stripHtmlTags,
} from '../../../src/lib/zodSanitizer.js';

describe('Agente 21 (Zara) - Sanitização Estrita em Schemas Zod', () => {
  it('stripHtmlTags deve remover tags script, style e tags html normais', () => {
    const malicious =
      '  <script>alert("xss")</script><b>Empresa</b> Ltda<style>body{color:red}</style>  ';
    expect(stripHtmlTags(malicious)).toBe('Empresa Ltda');
  });

  it('escapeHtmlChars deve codificar caracteres HTML especiais', () => {
    const raw = '<script> & "hello" \'world\'</script>';
    expect(escapeHtmlChars(raw)).toBe(
      '&lt;script&gt; &amp; &quot;hello&quot; &#x27;world&#x27;&lt;&#x2F;script&gt;',
    );
  });

  it('sanitizePlainText deve remover bytes nulos e caracteres de controle', () => {
    const dirty = 'Nome\0\u0007 com bytes nulos <img src=x onerror=alert(1)> ';
    expect(sanitizePlainText(dirty)).toBe('Nome com bytes nulos');
  });

  it('sanitizedString schema deve validar e limpar campos automaticamente', () => {
    const schema = z.object({
      name: sanitizedString(3, 'Nome inválido'),
    });

    const parsed = schema.parse({
      name: '  <h1>Hospital Central</h1>  ',
    });

    expect(parsed.name).toBe('Hospital Central');

    expect(() => schema.parse({ name: '  <script>malicious()</script>  ' })).toThrow();
  });

  it('sanitizedOptionalString schema deve converter strings vazias ou com apenas tags em null', () => {
    const schema = z.object({
      notes: sanitizedOptionalString(),
    });

    expect(schema.parse({ notes: '  <i>Observação legítima</i> ' })).toEqual({
      notes: 'Observação legítima',
    });

    expect(schema.parse({ notes: '   <script></script>  ' })).toEqual({
      notes: null,
    });

    expect(schema.parse({ notes: null })).toEqual({
      notes: null,
    });
  });
});

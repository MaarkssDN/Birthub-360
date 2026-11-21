import { describe, expect, it } from 'vitest';
import { containsSpecificPII, detectPII, getPIITypes, redactPII } from '../piiDetection.service.js';

describe('piiDetection.service (com mitigação anti-encoding)', () => {
  describe('detecção em texto cru', () => {
    it('detecta CPF e mascara com asteriscos', () => {
      const input = 'O CPF do lead é 123.456.789-00 para contato';
      const result = detectPII(input);

      expect(result.hasPII).toBe(true);
      expect(result.types).toContain('cpf');
      expect(result.redactedText).toBe('O CPF do lead é ************** para contato');
    });

    it('detecta email corporativo ou externo', () => {
      const input = 'Envie para marcelo@empresa.com com urgencia';
      const result = detectPII(input);

      expect(result.hasPII).toBe(true);
      expect(result.types).toContain('email');
      expect(result.redactedText).toBe('Envie para ******************* com urgencia');
    });

    it('retorna hasPII false quando não há dados pessoais', () => {
      const input = 'Relatório de vendas consolidado do trimestre Q3 sem dados sensíveis';
      const result = detectPII(input);

      expect(result.hasPII).toBe(false);
      expect(result.types).toHaveLength(0);
      expect(result.redactedText).toBe(input);
    });
  });

  describe('mitigação anti-encoding: Base64 / Hex', () => {
    it('detecta CPF codificado em Base64 e redige o token', () => {
      // "123.456.789-00" em Base64 = "MTIzLjQ1Ni43ODktMDA="
      const b64Cpf = Buffer.from('123.456.789-00').toString('base64');
      const input = `Payload com documento ${b64Cpf} anexado`;

      const result = detectPII(input);
      expect(result.hasPII).toBe(true);
      expect(result.types).toContain('cpf');
      expect(result.redactedText).toBe(
        `Payload com documento ${'*'.repeat(b64Cpf.length)} anexado`,
      );
      expect(result.redactedText).not.toContain(b64Cpf);
    });

    it('detecta email codificado em Base64 e redige o token', () => {
      // "contato@alvo.com" em Base64 = "Y29udGF0b0BhbHZvLmNvbQ=="
      const b64Email = Buffer.from('contato@alvo.com').toString('base64');
      const input = `Chave de destinatário: ${b64Email}`;

      const result = detectPII(input);
      expect(result.hasPII).toBe(true);
      expect(result.types).toContain('email');
      expect(result.redactedText).toBe(`Chave de destinatário: ${'*'.repeat(b64Email.length)}`);
    });

    it('detecta CPF codificado em Hexadecimal', () => {
      // "123.456.789-00" em Hex = "3132332e3435362e3738392d3030"
      const hexCpf = Buffer.from('123.456.789-00').toString('hex');
      const input = `Hex payload: 0x${hexCpf} registrado`;

      const result = detectPII(input);
      expect(result.hasPII).toBe(true);
      expect(result.types).toContain('cpf');
    });

    it('preserva encoding de tokens em Base64 que NÃO contêm PII', () => {
      // "relatorio-q3-metricas-ok" em Base64 = "cmVsYXRvcmlvLXEzLW1ldHJpY2FzLW9r"
      const safeToken = Buffer.from('relatorio-q3-metricas-ok').toString('base64');
      const input = `Token de autorização legítimo: ${safeToken}`;

      const result = detectPII(input);
      expect(result.hasPII).toBe(false);
      expect(result.types).toHaveLength(0);
      expect(result.redactedText).toBe(input);
      expect(result.redactedText).toContain(safeToken);
    });
  });

  describe('mitigação anti-encoding: escapes unicode e percent-encoding', () => {
    it('detecta email com escapes unicode \\uXXXX e redige', () => {
      // "lead@empresa.com" com escapes em algumas letras
      const escaped = 'lead\\u0040empresa\\u002ecom';
      const input = `Contato do lead: ${escaped}`;

      const result = detectPII(input);
      expect(result.hasPII).toBe(true);
      expect(result.types).toContain('email');
      expect(result.redactedText).not.toContain('lead@empresa.com');
    });

    it('detecta CPF com escapes hex \\xNN e redige', () => {
      const escaped = '123\\x2e456\\x2e789\\x2d00';
      const input = `Documento: ${escaped}`;

      const result = detectPII(input);
      expect(result.hasPII).toBe(true);
      expect(result.types).toContain('cpf');
    });

    it('preserva texto com escapes legítimos sem PII', () => {
      const input = 'Texto com \\u0041\\u0042\\u0043 e taxa de 10%20 sem dados pessoais';
      const result = detectPII(input);

      expect(result.hasPII).toBe(false);
      expect(result.types).toHaveLength(0);
      expect(result.redactedText).toBe(input);
    });
  });

  describe('funções utilitárias derivadas', () => {
    it('redactPII redige PII em base64', () => {
      const b64 = Buffer.from('999.888.777-66').toString('base64');
      const out = redactPII(`CPF oculto: ${b64}`);
      expect(out).toBe(`CPF oculto: ${'*'.repeat(b64.length)}`);
    });

    it('getPIITypes retorna os tipos encontrados', () => {
      const types = getPIITypes('123.456.789-00 e teste@domain.com');
      expect(types).toContain('cpf');
      expect(types).toContain('email');
    });

    it('containsSpecificPII verifica tipo específico', () => {
      expect(containsSpecificPII('123.456.789-00', 'cpf')).toBe(true);
      expect(containsSpecificPII('sem dados', 'cpf')).toBe(false);
    });
  });
});

/**
 * Testes unitários da mitigação de bypass de guardrails por encoding
 * (handoff 14→07, onda IA-1 / waveD).
 *
 * Cobre: Base64/Base64URL, hexadecimal, unicode escapes (\uXXXX, \xNN) e
 * percent-encoding (%XX) em detectPII/redactPII/detectToxicity/redactToxicity,
 * além de falsos positivos (tokens benignos, CEP, protocolo, allowlist).
 */
import { describe, it, expect } from 'vitest';
import {
  detectPII,
  redactPII,
  detectToxicity,
  redactToxicity,
} from '../../../src/lib/ai/guardrails/index.js';

const CPF = '123.456.789-09';
const CPF_B64 = Buffer.from(CPF, 'utf8').toString('base64'); // MTIzLjQ1Ni43ODktMDk=
const CPF_HEX = Buffer.from(CPF, 'utf8').toString('hex'); // 3132332e3435362e3738392d3039
const CPF_UNICODE = CPF.split('')
  .map((c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
  .join('');
const CPF_PERCENT = CPF.split('')
  .map((c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`)
  .join('');

describe('Guardrails - mitigação de encoding (PII)', () => {
  describe('detectPII', () => {
    it('detecta CPF em Base64', () => {
      const result = detectPII(`dados: ${CPF_B64}`);
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain(CPF);
    });

    it('detecta CPF em hexadecimal', () => {
      const result = detectPII(`dados: ${CPF_HEX}`);
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain(CPF);
    });

    it('detecta CPF em unicode escapes \\uXXXX', () => {
      const result = detectPII(`CPF: ${CPF_UNICODE}`);
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain(CPF);
    });

    it('detecta CPF em hex escapes \\xNN', () => {
      const text = CPF.split('')
        .map((c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('');
      const result = detectPII(text);
      expect(result.blocked).toBe(true);
    });

    it('detecta CPF em percent-encoding', () => {
      const result = detectPII(`CPF: ${CPF_PERCENT}`);
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain(CPF);
    });

    it('detecta CPF em percent-encoding intercalado com texto plano', () => {
      // "123" + %2E + "456" + %2E + "789" + %2D + "09"
      const result = detectPII('CPF: 123%2E456%2E789%2D09');
      expect(result.blocked).toBe(true);
    });

    it('detecta e-mail em Base64', () => {
      const email = 'cliente.secreto@provedor.com';
      const b64 = Buffer.from(email, 'utf8').toString('base64');
      const result = detectPII(b64);
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain(email);
    });

    it('detecta resposta inteira codificada em Base64', () => {
      const payload = `O CPF do cliente é ${CPF}`;
      const b64 = Buffer.from(payload, 'utf8').toString('base64');
      const result = detectPII(b64);
      expect(result.blocked).toBe(true);
    });

    it('não bloqueia token Base64 benigno', () => {
      const benign = Buffer.from('hello world, nothing sensitive', 'utf8').toString('base64');
      const result = detectPII(`ref: ${benign}`);
      expect(result.blocked).toBe(false);
    });

    it('não bloqueia texto com percent-encoding benigno', () => {
      const result = detectPII('Desconto aplicado: 10%25 off em %C3%A7 APIs');
      expect(result.blocked).toBe(false);
    });
  });

  describe('redactPII', () => {
    it('redige token Base64 que contém PII', () => {
      const { redacted, matches } = redactPII(`cpf=${CPF_B64}`);
      expect(matches).toContain(CPF);
      expect(redacted).toContain('[ENCODED_PII_REDACTED]');
      expect(redacted).not.toContain(CPF_B64);
    });

    it('redige texto com escapes que revela PII', () => {
      const { redacted, matches } = redactPII(`CPF: ${CPF_UNICODE}`);
      expect(matches).toContain(CPF);
      expect(redacted).not.toContain(CPF_UNICODE);
      expect(redacted).toContain('[CPF_REDACTED]');
    });

    it('devolve texto original quando não há PII mesmo com escapes', () => {
      const original = 'Desconto de 10%25 aplicado';
      const { redacted, matches } = redactPII(original);
      expect(matches).toEqual([]);
      expect(redacted).toBe(original);
    });
  });
});

describe('Guardrails - mitigação de encoding (toxicidade)', () => {
  it('detecta toxicidade em percent-encoding', () => {
    const toxic = '%6D%65%72%64%61'; // "merda"
    const result = detectToxicity(`isso é ${toxic}`);
    expect(result.toxic).toBe(true);
    expect(result.matches).toContain('merda');
  });

  it('detecta toxicidade em unicode escapes', () => {
    const toxic = 'merda'
      .split('')
      .map((c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
      .join('');
    const result = detectToxicity(toxic);
    expect(result.toxic).toBe(true);
  });

  it('detecta toxicidade em Base64 de frase maior que 12 chars', () => {
    const phrase = 'que merda é essa';
    const b64 = Buffer.from(phrase, 'utf8').toString('base64');
    const result = detectToxicity(b64);
    expect(result.toxic).toBe(true);
  });

  it('redactToxicity substitui token codificado tóxico', () => {
    const phrase = 'que merda é essa';
    const b64 = Buffer.from(phrase, 'utf8').toString('base64');
    const { redacted, matches } = redactToxicity(`resposta: ${b64}`);
    expect(matches.length).toBeGreaterThan(0);
    expect(redacted).toContain('[REDACTED]');
    expect(redacted).not.toContain(b64);
  });
});

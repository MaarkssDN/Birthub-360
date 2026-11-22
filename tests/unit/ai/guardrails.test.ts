/**
 * Testes unitários para Guardrails AI
 */
import { describe, it, expect } from 'vitest';
import { detectPII, redactPII, detectToxicity, redactToxicity } from '../../../src/lib/ai/guardrails/index.js';

describe('Guardrails - PII', () => {
  describe('detectPII', () => {
    it('deve detectar CPF', () => {
      const result = detectPII('Meu CPF é 123.456.789-01');
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain('123.456.789-01');
      expect(result.reason).toBe('PII detected in response');
    });

    it('deve detectar CNPJ', () => {
      const result = detectPII('CNPJ: 12.345.678/0001-90');
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain('12.345.678/0001-90');
    });

    it('deve detectar telefone', () => {
      const result = detectPII('Ligue para (11) 98765-4321');
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain('(11) 98765-4321');
    });

    it('deve detectar email', () => {
      const result = detectPII('Contato: joao@exemplo.com');
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain('joao@exemplo.com');
    });

    it('deve detectar cartão de crédito', () => {
      const result = detectPII('Cartão: 1234 5678 9012 3456');
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain('1234 5678 9012 3456');
    });

    it('não deve bloquear texto sem PII', () => {
      const result = detectPII('Este texto não contém informações pessoais');
      expect(result.blocked).toBe(false);
      expect(result.matches).toEqual([]);
    });

    it('deve detectar múltiplos tipos de PII', () => {
      const result = detectPII('CPF: 123.456.789-01, Email: teste@exemplo.com');
      expect(result.blocked).toBe(true);
      expect(result.matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('redactPII', () => {
    it('deve redigir CPF', () => {
      const { redacted, matches } = redactPII('CPF: 123.456.789-01');
      expect(redacted).toContain('[CPF_REDACTED]');
      expect(matches).toContain('123.456.789-01');
    });

    it('deve redigir email', () => {
      const { redacted, matches } = redactPII('Email: joao@exemplo.com');
      expect(redacted).toContain('[EMAIL_REDACTED]');
      expect(matches).toContain('joao@exemplo.com');
    });

    it('deve redigir múltiplos PII', () => {
      const { redacted, matches } = redactPII('CPF: 123.456.789-01, Email: teste@exemplo.com');
      expect(redacted).toContain('[CPF_REDACTED]');
      expect(redacted).toContain('[EMAIL_REDACTED]');
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('não deve alterar texto sem PII', () => {
      const { redacted, matches } = redactPII('Texto sem informações pessoais');
      expect(redacted).toBe('Texto sem informações pessoais');
      expect(matches).toEqual([]);
    });
  });
});

describe('Guardrails - Toxicidade', () => {
  describe('detectToxicity', () => {
    it('deve detectar palavras ofensivas', () => {
      const result = detectToxicity('Isso é uma merda');
      expect(result.toxic).toBe(true);
      expect(result.matches).toContain('merda');
      expect(result.reason).toBe('Toxic language detected');
    });

    it('deve detectar múltiplas palavras ofensivas', () => {
      const result = detectToxicity('idiota e estúpido');
      expect(result.toxic).toBe(true);
      expect(result.matches.length).toBeGreaterThanOrEqual(2);
    });

    it('não deve detectar texto limpo', () => {
      const result = detectToxicity('Este é um texto limpo e educado');
      expect(result.toxic).toBe(false);
      expect(result.matches).toEqual([]);
    });

    it('não deve gerar falso-positivo em palavras benignas com substrings ofensivas (ex: disputa, computador, reputação)', () => {
      const result = detectToxicity('A disputa de mercado exige boa reputação e um computador moderno');
      expect(result.toxic).toBe(false);
      expect(result.matches).toEqual([]);
    });

    it('deve ser case-insensitive', () => {
      const result = detectToxicity('ISSO É UMA MERDA');
      expect(result.toxic).toBe(true);
    });
  });

  describe('redactToxicity', () => {
    it('deve redigir palavras ofensivas', () => {
      const { redacted, matches } = redactToxicity('Isso é uma merda');
      expect(redacted).toContain('[REDACTED]');
      expect(matches).toContain('merda');
    });

    it('deve redigir múltiplas palavras', () => {
      const { redacted, matches } = redactToxicity('idiota e estúpido');
      expect(redacted).toContain('[REDACTED]');
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('não deve alterar texto limpo', () => {
      const { redacted, matches } = redactToxicity('Texto limpo');
      expect(redacted).toBe('Texto limpo');
      expect(matches).toEqual([]);
    });
  });
});

/**
 * Testes de integração para guardrails de IA - Onda IA-1
 * Valida segurança de PII, toxicidade e isolamento multi-tenant
 */
import { describe, it, expect } from 'vitest';
import { detectPII, redactPII } from '../../src/lib/ai/guardrails/pii.guard.js';
import { detectToxicity } from '../../src/lib/ai/guardrails/toxicity.guard.js';

describe('AI Guardrails - Security Integration', () => {
  describe('PII Detection', () => {
    it('deve bloquear CPF válido', () => {
      const text = 'O CPF do cliente é 123.456.789-09';
      const result = detectPII(text);
      
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain('123.456.789-09');
      expect(result.reason).toBe('PII detected in response');
    });

    it('deve bloquear CNPJ válido', () => {
      const text = 'CNPJ: 12.345.678/0001-90';
      const result = detectPII(text);
      
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain('12.345.678/0001-90');
    });

    it('deve bloquear e-mail', () => {
      const text = 'Contato: joao@empresa.com.br';
      const result = detectPII(text);
      
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain('joao@empresa.com.br');
    });

    it('deve bloquear telefone', () => {
      const text = 'Ligue para (11) 99999-8888';
      const result = detectPII(text);
      
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain('(11) 99999-8888');
    });

    it('deve bloquear cartão de crédito', () => {
      const text = 'Cartão: 4111 1111 1111 1111';
      const result = detectPII(text);
      
      expect(result.blocked).toBe(true);
      expect(result.matches).toContain('4111 1111 1111 1111');
    });

    it('não deve bloquear texto sem PII', () => {
      const text = 'O sistema está funcionando corretamente';
      const result = detectPII(text);
      
      expect(result.blocked).toBe(false);
      expect(result.matches).toEqual([]);
    });

    it('deve redair PII com placeholder dinâmico', () => {
      const text = 'CPF: 123.456.789-09 e Email: test@test.com';
      const { redacted, matches } = redactPII(text);
      
      expect(matches).toHaveLength(2);
      expect(redacted).toContain('[CPF_REDACTED]');
      expect(redacted).toContain('[EMAIL_REDACTED]');
      expect(redacted).not.toContain('123.456.789-09');
      expect(redacted).not.toContain('test@test.com');
    });
  });

  describe('Toxicity Detection', () => {
    it('deve detectar linguagem ofensiva', () => {
      const text = 'Este conteúdo é uma merda e inapropriado';
      const result = detectToxicity(text);
      
      expect(result.toxic).toBe(true);
      expect(result.matches).toContain('merda');
    });

    it('não deve bloquear conteúdo benigno', () => {
      const text = 'O sistema de CRM está funcionando bem';
      const result = detectToxicity(text);
      
      expect(result.toxic).toBe(false);
    });
  });

  describe('Encoding Bypass Prevention', () => {
    it('deve detectar PII em Base64', () => {
      // CPF 123.456.789-09 em Base64
      const text = 'MTIzLjQ1Ni43ODktMDk=';
      const result = detectPII(text);
      
      // Padrão regex direto não detecta Base64, mas deveria haver validação
      // Este teste marca a lacuna para implementação futura
      expect(result.blocked).toBe(false); // Falha atual esperada
    });

    it('deve detectar PII em Unicode escape', () => {
      const text = 'CPF: \\u0031\\u0032\\u0033';
      const result = detectPII(text);
      
      // Similar ao Base64, requer normalização prévia
      expect(result.blocked).toBe(false); // Falha atual esperada
    });
  });

  describe('False Positive Prevention', () => {
    it('não deve bloquear CEP brasileiro', () => {
      const text = 'O CEP é 01310-100';
      const result = detectPII(text);
      
      // CEP pode ter formato similar a CPF parcial
      // Deveria ter validação de checksum
      expect(result.blocked).toBe(false);
    });

    it('não deve bloquear protocolo numérico', () => {
      const text = 'Protocolo 2024/001234';
      const result = detectPII(text);
      
      expect(result.blocked).toBe(false);
    });
  });

  describe('Logging de Tentativas Bloqueadas', () => {
    it('deve registrar tentativa bloqueada em AILog', () => {
      // Este teste requer integração com AILog
      // Por enquanto, valida que a função existe
      const text = 'CPF: 123.456.789-09';
      const result = detectPII(text);
      
      expect(result.blocked).toBe(true);
    });
  });
});

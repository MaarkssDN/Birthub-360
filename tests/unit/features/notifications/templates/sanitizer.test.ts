import { describe, expect, it } from 'vitest';
import {
  detectPiiCategories,
  sanitizeFreeTextVariable,
  sanitizeOutboundMessageBody,
  sanitizeWhatsAppTemplatePayload,
} from '../../../../../src/features/notifications/templates/sanitizer.js';

describe('[67 · Teca] Sanitização de templates e mensagens outbound (LGPD)', () => {
  describe('sanitizeFreeTextVariable — mascaramento de PII', () => {
    it('redige CPF, e-mail e telefone em qualquer formato BR comum', () => {
      const cpf = sanitizeFreeTextVariable('CPF 123.456.789-01');
      expect(cpf.cleanValue).toBe('CPF [CPF_REDACTED]');
      expect(cpf.wasRedacted).toBe(true);

      const email = sanitizeFreeTextVariable('contato maria.silva@empresa.com.br');
      expect(email.cleanValue).toBe('contato [EMAIL_REDACTED]');

      const phoneParen = sanitizeFreeTextVariable('Ligue (11) 99999-8888');
      expect(phoneParen.cleanValue).toBe('Ligue [PHONE_REDACTED]');

      const phoneDdd = sanitizeFreeTextVariable('retornar para 11 3333-4444');
      expect(phoneDdd.cleanValue).toBe('retornar para [PHONE_REDACTED]');

      // 11 dígitos corridos é ambíguo (CPF×celular com DDD): o fail-closed garante que
      // NUNCA vaza em claro — a categoria pode sair como cpf/phone conforme o padrão que
      // casar primeiro, mas o valor é sempre substituído por placeholder.
      const phoneMobileCompact = sanitizeFreeTextVariable('whats 11999998888 urgente');
      expect(phoneMobileCompact.cleanValue).not.toContain('11999998888');
      expect(phoneMobileCompact.cleanValue).toMatch(/\[(CPF|PHONE)_REDACTED\]/);
      expect(phoneMobileCompact.wasRedacted).toBe(true);
    });

    it('NÃO mascara intervalos de data nem números de pedido sem formato telefônico', () => {
      const range = sanitizeFreeTextVariable('vigência 2024-2025 renovada');
      expect(range.cleanValue).toBe('vigência 2024-2025 renovada');
      expect(range.wasRedacted).toBe(false);

      const order = sanitizeFreeTextVariable('pedido 12345678 aprovado');
      expect(order.cleanValue).toBe('pedido 12345678 aprovado');
    });

    it('remove HTML/scripts e não permite injeção de placeholders aninhados', () => {
      const xss = sanitizeFreeTextVariable('<script>alert(1)</script>{{cpf}}');
      expect(xss.cleanValue).not.toContain('<script>');
      expect(xss.cleanValue).not.toContain('{{');
      expect(xss.cleanValue).not.toContain('}}');
    });
  });

  describe('sanitizeWhatsAppTemplatePayload — whitelist fail-closed', () => {
    it('bloqueia variáveis fora da whitelist e lança erro (fail-closed)', () => {
      expect(() =>
        sanitizeWhatsAppTemplatePayload({
          templateBody: 'Olá {{firstName}}',
          allowedVariables: ['firstName'],
          variables: { firstName: 'Ana', secret: 'x' },
        }),
      ).toThrow(/Variáveis não autorizadas/);
    });

    it('redige PII no valor da variável E no templateBody literal', () => {
      const result = sanitizeWhatsAppTemplatePayload({
        templateBody: 'Olá {{firstName}}, seu CPF é 123.456.789-01. Obs: {{notes}}',
        allowedVariables: ['firstName', 'notes'],
        variables: {
          firstName: 'Mariana',
          notes: 'retornar no (21) 98888-7777 ou maria@teste.com',
        },
      });

      expect(result.renderedText).not.toContain('123.456.789-01');
      expect(result.renderedText).not.toContain('(21) 98888-7777');
      expect(result.renderedText).not.toContain('maria@teste.com');
      expect(result.renderedText).toContain('[PHONE_REDACTED]');
      expect(result.renderedText).toContain('[EMAIL_REDACTED]');
      expect(result.redactedVariables).toContain('notes');
      expect(result.redactedPiiCategories).toEqual(
        expect.arrayContaining(['cpf', 'phone', 'email']),
      );
    });
  });

  describe('sanitizeOutboundMessageBody — passada final fail-closed', () => {
    it('redige PII residual no corpo renderizado e remove tags HTML', () => {
      const { sanitizedBody, redactedPiiCategories } = sanitizeOutboundMessageBody(
        'Confirmado! Dados: CPF 111.222.333-44, tel (11) 98765-4321, <b>email</b> a@b.com',
      );
      expect(sanitizedBody).not.toContain('111.222.333-44');
      expect(sanitizedBody).not.toContain('(11) 98765-4321');
      expect(sanitizedBody).not.toContain('a@b.com');
      expect(sanitizedBody).not.toContain('<b>');
      expect(redactedPiiCategories).toEqual(
        expect.arrayContaining(['cpf', 'phone', 'email']),
      );
    });

    it('preserva HTML quando stripHtml=false (caminho e-mail HTML futuro)', () => {
      const { sanitizedBody } = sanitizeOutboundMessageBody('<p>Oi</p>', { stripHtml: false });
      expect(sanitizedBody).toBe('<p>Oi</p>');
    });
  });

  describe('detectPiiCategories — auditoria LGPD sem vazar o dado', () => {
    it('retorna apenas categorias, nunca os valores encontrados', () => {
      const categories = detectPiiCategories('CPF 123.456.789-01 e mail x@y.com');
      expect(categories).toEqual(expect.arrayContaining(['cpf', 'email']));
      const serialized = JSON.stringify(categories);
      expect(serialized).not.toContain('123.456.789-01');
      expect(serialized).not.toContain('x@y.com');
    });

    it('retorna lista vazia para texto sem PII', () => {
      expect(detectPiiCategories('mensagem comercial comum')).toEqual([]);
      expect(detectPiiCategories('')).toEqual([]);
    });
  });
});

/**
 * Testes unitários para Zod Structured Outputs
 */
import { describe, it, expect } from 'vitest';
import { validateStructuredOutput, validateLead, validateCompany, validateEnrichment } from '../../../src/lib/ai/structured/validate.js';
import { LeadSchema, CompanySchema, EnrichmentSchema } from '../../../src/lib/ai/schemas/index.js';

describe('Structured Outputs - Validate', () => {
  describe('validateStructuredOutput', () => {
    it('deve validar JSON válido contra schema', async () => {
      const validJson = JSON.stringify({
        nome: 'João Silva',
        email: 'joao@exemplo.com',
        telefone: '(11) 98765-4321',
      });

      const result = await validateStructuredOutput(validJson, LeadSchema);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.nome).toBe('João Silva');
      expect(result.attempts).toBe(1);
    });

    it('deve falhar com JSON inválido', async () => {
      const invalidJson = 'isso não é json';

      const result = await validateStructuredOutput(invalidJson, LeadSchema);

      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON parse error');
      expect(result.attempts).toBeGreaterThan(0);
    });

    it('deve falhar com dados que não batem com schema', async () => {
      const invalidData = JSON.stringify({
        nome: 'João',
        email: 'email-invalido', // Email inválido
      });

      const result = await validateStructuredOutput(invalidData, LeadSchema);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Zod validation error');
      expect(result.attempts).toBeGreaterThan(0);
    });

    it('deve fazer retry em falha de validação', async () => {
      const invalidData = JSON.stringify({
        nome: 'João',
        email: 'invalido',
      });

      const result = await validateStructuredOutput(invalidData, LeadSchema, { maxRetries: 3 });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
    });

    it('deve extrair dados parciais com fallbackToPartial', async () => {
      const partialData = JSON.stringify({
        nome: 'João Silva',
        email: 'invalido',
        empresa: 'Empresa Exemplo',
      });

      const result = await validateStructuredOutput(partialData, LeadSchema, {
        maxRetries: 2,
        fallbackToPartial: true,
      });

      expect(result.success).toBe(false);
      expect(result.partialData).toBeDefined();
      expect(result.partialData?.nome).toBe('João Silva');
      expect(result.partialData?.empresa).toBe('Empresa Exemplo');
    });
  });

  describe('validateLead', () => {
    it('deve validar lead completo', async () => {
      const leadJson = JSON.stringify({
        nome: 'Maria Santos',
        email: 'maria@empresa.com',
        telefone: '(21) 91234-5678',
        empresa: 'Tech Corp',
        cargo: 'CTO',
        setor: 'Tecnologia',
      });

      const result = await validateLead(leadJson);

      expect(result.success).toBe(true);
      expect(result.data?.nome).toBe('Maria Santos');
      expect(result.data?.email).toBe('maria@empresa.com');
    });

    it('deve falhar com campos obrigatórios faltando', async () => {
      const incompleteJson = JSON.stringify({
        nome: 'João',
        // email faltando
      });

      const result = await validateLead(incompleteJson);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Zod validation error');
    });
  });

  describe('validateCompany', () => {
    it('deve validar empresa completa', async () => {
      const companyJson = JSON.stringify({
        razaoSocial: 'Empresa LTDA',
        cnpj: '12.345.678/0001-90',
        website: 'https://empresa.com',
        setor: 'Tecnologia',
        tamanho: '51-200',
      });

      const result = await validateCompany(companyJson);

      expect(result.success).toBe(true);
      expect(result.data?.razaoSocial).toBe('Empresa LTDA');
      expect(result.data?.website).toBe('https://empresa.com');
    });

    it('deve validar empresa com campos opcionais', async () => {
      const minimalJson = JSON.stringify({
        razaoSocial: 'Empresa Minimal',
      });

      const result = await validateCompany(minimalJson);

      expect(result.success).toBe(true);
      expect(result.data?.razaoSocial).toBe('Empresa Minimal');
    });
  });

  describe('validateEnrichment', () => {
    it('deve validar enriquecimento completo', async () => {
      const enrichmentJson = JSON.stringify({
        leadId: 'lead-123',
        fonte: 'linkedin',
        score: 85,
        dados: {
          website: 'https://empresa.com',
          linkedin: 'https://linkedin.com/company/empresa',
          revenue: '$10M-$50M',
          setor: 'Tecnologia',
        },
        metadados: {
          dataEnriquecimento: '2026-09-28',
          confiabilidade: 'alta',
        },
      });

      const result = await validateEnrichment(enrichmentJson);

      expect(result.success).toBe(true);
      expect(result.data?.score).toBe(85);
      expect(result.data?.dados?.website).toBe('https://empresa.com');
    });

    it('deve validar enriquecimento mínimo', async () => {
      const minimalJson = JSON.stringify({
        dados: {},
      });

      const result = await validateEnrichment(minimalJson);

      expect(result.success).toBe(true);
      expect(result.data?.dados).toBeDefined();
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import {
  checkOptOutStatus,
  assertOptOutStatus,
  recordContactOptOut,
  isOptOutKeyword,
  OptOutSuppressedError,
} from '@/shared/services/optOutCheck.service.js';

describe('optOutCheck.service — Validação de Opt-Out Multicanal e LGPD', () => {
  describe('isOptOutKeyword', () => {
    it('reconhece palavras-chave em português e inglês com e sem pontuação', () => {
      expect(isOptOutKeyword('SAIR')).toBe(true);
      expect(isOptOutKeyword('sair!')).toBe(true);
      expect(isOptOutKeyword('parar.')).toBe(true);
      expect(isOptOutKeyword('STOP')).toBe(true);
      expect(isOptOutKeyword('cancelar')).toBe(true);
      expect(isOptOutKeyword('descadastro')).toBe(true);
      expect(isOptOutKeyword('unsubscribe')).toBe(true);
      expect(isOptOutKeyword('não quero mais receber')).toBe(true);
      expect(isOptOutKeyword('remover meu número')).toBe(true);
      expect(isOptOutKeyword('sair por favor')).toBe(true);
    });

    it('rejeita mensagens conversacionais normais', () => {
      expect(isOptOutKeyword('Olá, tudo bem?')).toBe(false);
      expect(isOptOutKeyword('Gostaria de agendar uma reunião')).toBe(false);
      expect(isOptOutKeyword('Qual o valor da proposta?')).toBe(false);
      expect(isOptOutKeyword('')).toBe(false);
      expect(isOptOutKeyword(null)).toBe(false);
    });
  });

  describe('checkOptOutStatus', () => {
    const mockPrisma = {
      contact: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      lead: {
        update: vi.fn(),
      },
      optOutRecord: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    };

    it('bloqueia envio se parâmetros obrigatórios estiverem ausentes', async () => {
      const res = await checkOptOutStatus('', 'whatsapp', 'org-1', { prisma: mockPrisma });
      expect(res.blocked).toBe(true);
      expect(res.allowed).toBe(false);
      expect(res.code).toBe('OPT_OUT_SUPPRESSED');
    });

    it('bloqueia envio se contato não for encontrado na organização (tenant isolation)', async () => {
      mockPrisma.contact.findFirst.mockResolvedValueOnce(null);

      const res = await checkOptOutStatus('c1', 'email', 'org-1', { prisma: mockPrisma });
      expect(res.blocked).toBe(true);
      expect(res.matchedBy).toBe('tenant_mismatch');
    });

    it('bloqueia envio se contato for anonimizado (LGPD Art. 18)', async () => {
      mockPrisma.contact.findFirst.mockResolvedValueOnce({
        id: 'c1',
        name: '[TITULAR ANONIMIZADO]',
        deletedAt: new Date(),
        leads: [],
      });

      const res = await checkOptOutStatus('c1', 'whatsapp', 'org-1', { prisma: mockPrisma });
      expect(res.blocked).toBe(true);
      expect(res.matchedBy).toBe('anonymized');
    });

    it('bloqueia envio se flag de opt-out estiver ativa no contato', async () => {
      mockPrisma.contact.findFirst.mockResolvedValueOnce({
        id: 'c1',
        name: 'Fulano',
        deletedAt: null,
        customFields: { optOutWhatsApp: true },
        leads: [],
      });

      const res = await checkOptOutStatus('c1', 'whatsapp', 'org-1', { prisma: mockPrisma });
      expect(res.blocked).toBe(true);
      expect(res.matchedBy).toBe('contact_flag');
    });

    it('bloqueia envio se registro existir em OptOutRecord unificado', async () => {
      mockPrisma.contact.findFirst.mockResolvedValueOnce({
        id: 'c1',
        name: 'Ciclano',
        email: 'ciclano@empresa.com.br',
        phone: '11999998888',
        deletedAt: null,
        customFields: {},
        leads: [{ id: 'lead-1' }],
      });

      mockPrisma.optOutRecord.findMany.mockResolvedValueOnce([
        {
          scope: 'Global',
          reason: 'Solicitou parada de contato',
          originChannel: 'whatsapp',
        },
      ]);

      const res = await checkOptOutStatus('c1', 'email', 'org-1', { prisma: mockPrisma });
      expect(res.blocked).toBe(true);
      expect(res.matchedBy).toBe('opt_out_record');
    });

    it('permite envio quando contato está ativo e sem restrições de opt-out', async () => {
      mockPrisma.contact.findFirst.mockResolvedValueOnce({
        id: 'c1',
        name: 'Beltrano',
        email: 'beltrano@empresa.com.br',
        phone: '11988887777',
        deletedAt: null,
        customFields: {},
        leads: [{ id: 'lead-2' }],
      });

      mockPrisma.optOutRecord.findMany.mockResolvedValueOnce([]);

      const res = await checkOptOutStatus('c1', 'email', 'org-1', { prisma: mockPrisma });
      expect(res.blocked).toBe(false);
      expect(res.allowed).toBe(true);
      expect(res.code).toBe(null);
    });

    it('assertOptOutStatus lança OptOutSuppressedError quando bloqueado', async () => {
      mockPrisma.contact.findFirst.mockResolvedValueOnce({
        id: 'c1',
        name: 'Fulano',
        deletedAt: null,
        customFields: { optOut: true },
        leads: [],
      });

      await expect(
        assertOptOutStatus('c1', 'email', 'org-1', { prisma: mockPrisma }),
      ).rejects.toThrow(OptOutSuppressedError);
    });
  });

  describe('recordContactOptOut', () => {
    it('atualiza customFields do contato e cria registro em OptOutRecord', async () => {
      const mockPrisma = {
        contact: {
          findFirst: vi.fn().mockResolvedValueOnce({
            id: 'c1',
            email: 'teste@empresa.com.br',
            phone: '11999990000',
            customFields: {},
            leads: [{ id: 'l1', customFields: {} }],
          }),
          update: vi.fn().mockResolvedValueOnce({}),
        },
        lead: {
          update: vi.fn().mockResolvedValueOnce({}),
        },
        optOutRecord: {
          create: vi.fn().mockResolvedValueOnce({}),
        },
      };

      await recordContactOptOut({
        organizationId: 'org-1',
        contactId: 'c1',
        channel: 'whatsapp',
        scope: 'global',
        originChannel: 'whatsapp-inbound',
        reason: 'Palavra-chave SAIR detectada',
        prisma: mockPrisma,
      });

      expect(mockPrisma.contact.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'c1' },
          data: expect.objectContaining({
            customFields: expect.objectContaining({
              optOut: true,
              optOutWhatsApp: true,
            }),
          }),
        }),
      );

      expect(mockPrisma.optOutRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-1',
            scope: 'Global',
            originChannel: 'whatsapp-inbound',
          }),
        }),
      );
    });
  });
});

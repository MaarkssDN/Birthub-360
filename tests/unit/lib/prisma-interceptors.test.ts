import { describe, expect, it } from 'vitest';
import {
  applySoftDeleteReadFilter,
  AUDITABLE_MODELS,
  BYPASS_RLS_ALLOWED_MODELS,
  handleSoftDeleteResult,
  injectSoftDeleteSelect,
  isAuditableModel,
  resolveBypassRls,
} from '../../../src/lib/prisma-interceptors.js';

describe('prisma-interceptors', () => {
  describe('isAuditableModel', () => {
    it('deve retornar true para todos os models auditáveis canônicos', () => {
      for (const model of AUDITABLE_MODELS) {
        expect(isAuditableModel(model)).toBe(true);
      }
    });

    it('deve retornar false para models não auditáveis', () => {
      expect(isAuditableModel('User')).toBe(false);
      expect(isAuditableModel('Organization')).toBe(false);
      expect(isAuditableModel('AuditLog')).toBe(false);
      expect(isAuditableModel('UnknownModel')).toBe(false);
    });
  });

  describe('injectSoftDeleteSelect', () => {
    it('deve retornar false se o model não for auditável', () => {
      const args = { where: { id: '1' }, select: { id: true, name: true } };
      const injected = injectSoftDeleteSelect(args, 'User', 'findUnique');
      expect(injected).toBe(false);
      expect((args.select as Record<string, unknown>).deletedAt).toBeUndefined();
    });

    it('deve retornar false se a operação não for findUnique nem findUniqueOrThrow', () => {
      const args = { where: { id: '1' }, select: { id: true } };
      expect(injectSoftDeleteSelect(args, 'Company', 'findMany')).toBe(false);
      expect(injectSoftDeleteSelect(args, 'Company', 'findFirst')).toBe(false);
      expect(injectSoftDeleteSelect(args, 'Company', 'update')).toBe(false);
    });

    it('deve retornar false se args não possuir select', () => {
      const args = { where: { id: '1' } };
      expect(injectSoftDeleteSelect(args, 'Company', 'findUnique')).toBe(false);
      expect(injectSoftDeleteSelect(undefined, 'Company', 'findUnique')).toBe(false);
    });

    it('deve retornar false se select já incluir deletedAt', () => {
      const args = { where: { id: '1' }, select: { id: true, deletedAt: true } };
      const injected = injectSoftDeleteSelect(args, 'Company', 'findUnique');
      expect(injected).toBe(false);
      expect((args.select as Record<string, unknown>).deletedAt).toBe(true);
    });

    it('deve injetar deletedAt: true e retornar true em findUnique com select parcial', () => {
      const args = { where: { id: '1' }, select: { id: true, name: true } };
      const injected = injectSoftDeleteSelect(args, 'Company', 'findUnique');
      expect(injected).toBe(true);
      expect((args.select as Record<string, unknown>).deletedAt).toBe(true);
      expect((args.select as Record<string, unknown>).id).toBe(true);
      expect((args.select as Record<string, unknown>).name).toBe(true);
    });

    it('deve injetar deletedAt: true e retornar true em findUniqueOrThrow com select parcial', () => {
      const args = { where: { id: '1' }, select: { bitrixLeadId: true } };
      const injected = injectSoftDeleteSelect(args, 'Lead', 'findUniqueOrThrow');
      expect(injected).toBe(true);
      expect((args.select as Record<string, unknown>).deletedAt).toBe(true);
      expect((args.select as Record<string, unknown>).bitrixLeadId).toBe(true);
    });
  });

  describe('applySoftDeleteReadFilter', () => {
    it('deve injetar deletedAt: null no where para models auditáveis em leituras suportadas', () => {
      const supportedOps = [
        'findFirst',
        'findFirstOrThrow',
        'findMany',
        'count',
        'aggregate',
        'groupBy',
      ];
      for (const op of supportedOps) {
        const args: Record<string, unknown> = { where: { status: 'ACTIVE' } };
        applySoftDeleteReadFilter(args, 'Contact', op);
        expect((args.where as Record<string, unknown>).deletedAt).toBeNull();
        expect((args.where as Record<string, unknown>).status).toBe('ACTIVE');
      }
    });

    it('não deve alterar args se o model não for auditável', () => {
      const args: Record<string, unknown> = { where: { email: 'test@example.com' } };
      applySoftDeleteReadFilter(args, 'User', 'findMany');
      expect((args.where as Record<string, unknown>).deletedAt).toBeUndefined();
    });

    it('não deve alterar args em operações fora da lista suportada', () => {
      const args: Record<string, unknown> = { where: { id: '1' } };
      applySoftDeleteReadFilter(args, 'Lead', 'findUnique');
      expect((args.where as Record<string, unknown>).deletedAt).toBeUndefined();
    });
  });

  describe('resolveBypassRls', () => {
    it('deve retornar false quando rawBypassRls for false independente do ambiente', () => {
      expect(resolveBypassRls(false, 'User', false)).toBe(false);
      expect(resolveBypassRls(false, 'User', true)).toBe(false);
      expect(resolveBypassRls(false, 'Company', true)).toBe(false);
    });

    it('deve permitir bypass para qualquer model fora de produção', () => {
      expect(resolveBypassRls(true, 'Company', false)).toBe(true);
      expect(resolveBypassRls(true, 'Lead', false)).toBe(true);
      expect(resolveBypassRls(true, 'User', false)).toBe(true);
      expect(resolveBypassRls(true, 'RandomModel', false)).toBe(true);
    });

    it('deve restringir bypass estritamente à allowlist em produção', () => {
      for (const model of BYPASS_RLS_ALLOWED_MODELS) {
        expect(resolveBypassRls(true, model, true)).toBe(true);
      }
      expect(resolveBypassRls(true, 'Company', true)).toBe(false);
      expect(resolveBypassRls(true, 'Contact', true)).toBe(false);
      expect(resolveBypassRls(true, 'Activity', true)).toBe(false);
    });
  });

  describe('handleSoftDeleteResult', () => {
    it('deve retornar null se o registro foi soft-deletado em findUnique', () => {
      const record = { id: 'l1', name: 'Lead 1', deletedAt: new Date() };
      const res = handleSoftDeleteResult(record, 'findUnique', true, false);
      expect(res).toBeNull();
    });

    it('deve lançar erro P2025 se o registro foi soft-deletado em findUniqueOrThrow', () => {
      const record = { id: 'l1', name: 'Lead 1', deletedAt: new Date() };
      expect(() => {
        handleSoftDeleteResult(record, 'findUniqueOrThrow', true, false);
      }).toThrow('An operation failed because it depends on one or more records');
    });

    it('deve usar o factory customizado quando fornecido em findUniqueOrThrow', () => {
      const record = { id: 'l1', name: 'Lead 1', deletedAt: new Date() };
      const factory = (msg: string, code: string) => {
        const e = new Error(msg) as Error & { code: string };
        e.code = code;
        return e;
      };
      expect(() => {
        handleSoftDeleteResult(record, 'findUniqueOrThrow', true, false, factory);
      }).toThrow('An operation failed because it depends on one or more records');
    });

    it('deve remover deletedAt se injectedDeletedAt for true e o registro estiver ativo', () => {
      const record = { id: 'l1', name: 'Lead 1', deletedAt: null };
      const res = handleSoftDeleteResult(record, 'findUnique', true, true);
      expect(res).toEqual({ id: 'l1', name: 'Lead 1' });
      expect((res as Record<string, unknown>).deletedAt).toBeUndefined();
    });

    it('não deve alterar resultado se model não for auditável', () => {
      const record = { id: 'u1', name: 'User 1', deletedAt: new Date() };
      const res = handleSoftDeleteResult(record, 'findUnique', false, false);
      expect(res).toEqual(record);
    });

    it('não deve alterar resultado se operação não for findUnique/findUniqueOrThrow', () => {
      const record = { id: 'l1', name: 'Lead 1', deletedAt: new Date() };
      const res = handleSoftDeleteResult(record, 'create', true, false);
      expect(res).toEqual(record);
    });

    it('deve lidar com result null/undefined com segurança', () => {
      expect(handleSoftDeleteResult(null, 'findUnique', true, false)).toBeNull();
      expect(handleSoftDeleteResult(undefined, 'findUnique', true, false)).toBeUndefined();
    });
  });
});

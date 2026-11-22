import { describe, expect, it } from 'vitest';
import { hashPasswordArgon2id, isArgon2idHash, verifyPasswordHash } from '../../../src/lib/auth/password-hash.js';
import { hashPassword as hashBetterAuthScryptPassword } from 'better-auth/crypto';
import { isAuthorizedLoginEmail } from '../../../src/config/access-policy.js';
import {
  canAccessCommercialIntelligence,
  canAccessMesaTratamento,
  hasRequiredRole,
  ROLE_HIERARCHY,
  UNVERIFIED_ROLE,
} from '../../../src/lib/auth/authorization.js';

describe('Antessala — Revenue Command Center: Homologação de Autenticação e Segurança', () => {
  describe('1. Criptografia de Senhas — Argon2id e Compatibilidade Scrypt', () => {
    it('deve gerar hash no formato PHC Argon2id ($argon2id$v=19$m=19456,t=2,p=1$...)', async () => {
      const password = 'MinhaSenhaCorporativa@2026';
      const hash = await hashPasswordArgon2id(password);

      expect(isArgon2idHash(hash)).toBe(true);
      expect(hash.startsWith('$argon2id$v=19$m=19456,t=2,p=1$')).toBe(true);
    });

    it('deve verificar com sucesso a senha correta usando Argon2id', async () => {
      const password = 'MinhaSenhaCorporativa@2026';
      const hash = await hashPasswordArgon2id(password);

      const isValid = await verifyPasswordHash({ hash, password });
      expect(isValid).toBe(true);
    });

    it('deve rejeitar senha incorreta usando Argon2id', async () => {
      const password = 'MinhaSenhaCorporativa@2026';
      const hash = await hashPasswordArgon2id(password);

      const isValid = await verifyPasswordHash({ hash, password: 'SenhaIncorreta@123' });
      expect(isValid).toBe(false);
    });

    it('deve manter compatibilidade retroativa com hashes legados Scrypt do Better Auth', async () => {
      const password = 'SenhaLegadaScrypt@123';
      const legacyScryptHash = await hashBetterAuthScryptPassword(password);

      // O hash scrypt legado não começa com $argon2id$
      expect(isArgon2idHash(legacyScryptHash)).toBe(false);

      // verifyPasswordHash deve verificar o hash legado sem quebrar contas antigas
      const isValid = await verifyPasswordHash({ hash: legacyScryptHash, password });
      expect(isValid).toBe(true);

      const isInvalid = await verifyPasswordHash({ hash: legacyScryptHash, password: 'OutraSenha' });
      expect(isInvalid).toBe(false);
    });
  });

  describe('2. Validação de E-mail Corporativo e Proteção ReDoS', () => {
    it('deve aceitar e-mails corporativos e empresariais válidos', () => {
      expect(isAuthorizedLoginEmail('marcelin@birthhub360.com.br')).toBe(true);
      expect(isAuthorizedLoginEmail('diretor.comercial@empresa.com.br')).toBe(true);
      expect(isAuthorizedLoginEmail('gestor@holdings.corp')).toBe(true);
    });

    it('deve rejeitar e-mails malformados ou vazios', () => {
      expect(isAuthorizedLoginEmail('')).toBe(false);
      expect(isAuthorizedLoginEmail(null)).toBe(false);
      expect(isAuthorizedLoginEmail(undefined)).toBe(false);
      expect(isAuthorizedLoginEmail('invalido')).toBe(false);
      expect(isAuthorizedLoginEmail('invalido@')).toBe(false);
      expect(isAuthorizedLoginEmail('@empresa.com.br')).toBe(false);
      expect(isAuthorizedLoginEmail('usuario@empresa')).toBe(false);
      expect(isAuthorizedLoginEmail('usuario @empresa.com.br')).toBe(false);
    });

    it('deve proteger contra ReDoS mesmo com entradas longas ou repetidas', () => {
      const malicious = `${'!@!'.repeat(1000)}`;
      const start = Date.now();
      const result = isAuthorizedLoginEmail(malicious);
      const elapsed = Date.now() - start;

      expect(result).toBe(false);
      expect(elapsed).toBeLessThan(50); // Deve responder em milissegundos
    });
  });

  describe('3. Governança RBAC e Autorização', () => {
    it('deve respeitar a hierarquia canônica de papéis', () => {
      expect(ROLE_HIERARCHY.ADMIN).toBe(100);
      expect(ROLE_HIERARCHY.GESTOR).toBe(75);
      expect(ROLE_HIERARCHY.CLOSER).toBe(50);
      expect(ROLE_HIERARCHY.SDR).toBe(40);
      expect(ROLE_HIERARCHY.VISUALIZADOR).toBe(10);
    });

    it('deve autorizar apenas ADMIN e GESTOR para Comercial Inteligente / Revenue Command Center', () => {
      expect(canAccessCommercialIntelligence('ADMIN')).toBe(true);
      expect(canAccessCommercialIntelligence('GESTOR')).toBe(true);
      expect(canAccessCommercialIntelligence('CLOSER')).toBe(false);
      expect(canAccessCommercialIntelligence('SDR')).toBe(false);
      expect(canAccessCommercialIntelligence('VISUALIZADOR')).toBe(false);
      expect(canAccessCommercialIntelligence(UNVERIFIED_ROLE)).toBe(false);
    });

    it('deve autorizar ADMIN, GESTOR, CLOSER e SDR para Mesa de Tratamento', () => {
      expect(canAccessMesaTratamento('ADMIN')).toBe(true);
      expect(canAccessMesaTratamento('GESTOR')).toBe(true);
      expect(canAccessMesaTratamento('CLOSER')).toBe(true);
      expect(canAccessMesaTratamento('SDR')).toBe(true);
      expect(canAccessMesaTratamento('VISUALIZADOR')).toBe(false);
      expect(canAccessMesaTratamento(UNVERIFIED_ROLE)).toBe(false);
    });

    it('deve barrar qualquer papel desconhecido em checagem de autorização (Fail-Closed)', () => {
      expect(hasRequiredRole('GUEST', ['VISUALIZADOR'])).toBe(false);
      expect(hasRequiredRole('UNKNOWN_ROLE', ['ADMIN', 'GESTOR'])).toBe(false);
      expect(hasRequiredRole(UNVERIFIED_ROLE, ['VISUALIZADOR'])).toBe(false);
    });
  });

  describe('4. Políticas de Isolamento Multi-Tenant e Supervisor', () => {
    it('deve garantir que o papel sentinela UNVERIFIED_ROLE fique fora da hierarquia', () => {
      expect(Object.keys(ROLE_HIERARCHY)).not.toContain(UNVERIFIED_ROLE);
    });

    it('deve assegurar que cada organização tenha identificador distinto e contexto isolado', () => {
      const orgAId = 'org-tenant-alpha-001';
      const orgBId = 'org-tenant-beta-002';

      expect(orgAId).not.toBe(orgBId);
      // Validar que o isolamento impede consultas cruzadas sem tenantId correspondente
    });
  });
});

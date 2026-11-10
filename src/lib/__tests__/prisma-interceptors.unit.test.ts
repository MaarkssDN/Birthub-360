import { describe, expect, it } from 'vitest';
import {
  applyPiiEncryptionToWriteArgs,
  applySoftDeleteReadFilter,
  BYPASS_RLS_ALLOWED_MODELS,
  decryptNestedContactPii,
  injectTenantIntoWriteArgs,
  isAuditableModel,
  resolveBypassRls,
} from '@/lib/prisma-interceptors';
import { encryptField, DECRYPTION_FAILED_MARKER } from '@/lib/crypto/secretFields';

/**
 * TAREFA-SANEAMENTO-013 (BT360-DT-0010): os interceptores da extensão `$allOperations` de
 * src/lib/prisma.ts foram extraídos para src/lib/prisma-interceptors.ts — módulo puro, sem
 * `pg.Pool`/Prometheus — exatamente para poderem ser testados em isolamento (antes, qualquer
 * teste que importasse prisma.ts subiria um pool de conexão real). Estes testes cobrem o
 * comportamento que existia inline, incluindo os caminhos de falha/guarda (bypass de RLS
 * negado em produção para model fora da allowlist, update que tenta trocar organizationId,
 * ciphertext indecifrável isolado ao registro).
 */

describe('resolveBypassRls', () => {
  it('nega bypass quando rawBypassRls é falso, em qualquer ambiente', () => {
    expect(resolveBypassRls(false, 'User', false)).toBe(false);
    expect(resolveBypassRls(false, 'User', true)).toBe(false);
  });

  it('permite bypass em qualquer model fora de produção', () => {
    expect(resolveBypassRls(true, 'Company', false)).toBe(true);
    expect(resolveBypassRls(true, 'Lead', false)).toBe(true);
  });

  it('em produção só permite models da allowlist de bootstrap', () => {
    expect(resolveBypassRls(true, 'User', true)).toBe(true);
    expect(resolveBypassRls(true, 'Organization', true)).toBe(true);
    expect(resolveBypassRls(true, 'AILog', true)).toBe(true);
  });

  it('em produção NEGA bypass para model fora da allowlist (guarda de segurança)', () => {
    // Company é o caso canônico: foi explicitamente excluído do bypass (migration
    // 20260825120000, ITEM-02) — dado comercial sensível, nunca deve rodar com RLS off.
    expect(resolveBypassRls(true, 'Company', true)).toBe(false);
    expect(resolveBypassRls(true, 'Contact', true)).toBe(false);
    expect(resolveBypassRls(true, 'CrmDeal', true)).toBe(false);
    expect(BYPASS_RLS_ALLOWED_MODELS).not.toContain('Company');
    expect(BYPASS_RLS_ALLOWED_MODELS).not.toContain('Contact');
  });
});

describe('injectTenantIntoWriteArgs', () => {
  const TENANT = 'org-123';

  it('injeta organizationId em create de model com tenant injetado', () => {
    const args = { data: { name: 'Acme' } };
    injectTenantIntoWriteArgs(args, 'Company', 'create', TENANT);
    expect((args as { data: { organizationId: string } }).data.organizationId).toBe(TENANT);
  });

  it('injeta organizationId em cada item de createMany', () => {
    const args = { data: [{ name: 'A' }, { name: 'B', organizationId: 'org-outro' }] };
    injectTenantIntoWriteArgs(args, 'Lead', 'createMany', TENANT);
    const data = (args as { data: Array<{ organizationId: string }> }).data;
    expect(data[0].organizationId).toBe(TENANT);
    // Sobrescreve organizationId vindo do payload — o tenant da request sempre vence.
    expect(data[1].organizationId).toBe(TENANT);
  });

  it('em upsert injeta no create e REMOVE organizationId do update', () => {
    const args = {
      where: { id: 'x' },
      create: { name: 'Novo' },
      update: { name: 'Editado', organizationId: 'org-atacante' },
    };
    injectTenantIntoWriteArgs(args, 'Contact', 'upsert', TENANT);
    const a = args as {
      create: { organizationId: string };
      update: Record<string, unknown>;
    };
    expect(a.create.organizationId).toBe(TENANT);
    expect('organizationId' in a.update).toBe(false);
    expect(a.update.name).toBe('Editado');
  });

  it('em update/updateMany remove organizationId do data (guarda multi-tenant)', () => {
    const args = { where: { id: 'x' }, data: { name: 'Y', organizationId: 'org-atacante' } };
    injectTenantIntoWriteArgs(args, 'Activity', 'update', TENANT);
    const a = args as { data: Record<string, unknown> };
    expect('organizationId' in a.data).toBe(false);
    expect(a.data.name).toBe('Y');
  });

  it('não toca em nada sem tenantId ou em model fora da lista', () => {
    const args = { data: { name: 'Acme' } };
    injectTenantIntoWriteArgs(args, 'Company', 'create', undefined);
    expect((args as { data: Record<string, unknown> }).data.organizationId).toBeUndefined();

    const args2 = { data: { name: 'Org' } };
    injectTenantIntoWriteArgs(args2, 'Organization', 'create', TENANT);
    expect((args2 as { data: Record<string, unknown> }).data.organizationId).toBeUndefined();
  });

  it('não toca em operações de leitura', () => {
    const args = { where: { name: 'Acme' } };
    injectTenantIntoWriteArgs(args, 'Company', 'findMany', TENANT);
    expect(args).toEqual({ where: { name: 'Acme' } });
  });
});

describe('applyPiiEncryptionToWriteArgs', () => {
  it('cifra email/phone/whatsapp e grava índices cegos em create de Contact', () => {
    const args = { data: { name: 'Fulano', email: 'Fulano@Example.com', phone: '+55 11 99999-0000' } };
    applyPiiEncryptionToWriteArgs(args, 'Contact', 'create');
    const data = (args as { data: Record<string, unknown> }).data;
    expect(data.name).toBe('Fulano'); // campo não-PII permanece texto puro
    expect(String(data.email)).toMatch(/^enc:v1:/);
    expect(String(data.phone)).toMatch(/^enc:v1:/);
    // Índice cego calculado sobre o texto puro ANTES da cifragem — determinístico (HMAC),
    // nunca o ciphertext.
    expect(data.emailIndex).toEqual(expect.any(String));
    expect(data.emailDomainIndex).toEqual(expect.any(String));
    expect(data.phoneIndex).toEqual(expect.any(String));
    expect(String(data.emailIndex)).not.toContain('enc:v1:');
  });

  it('em update parcial só inclui no patch o índice do campo tocado', () => {
    const args = { where: { id: 'c1' }, data: { email: 'novo@example.com' } };
    applyPiiEncryptionToWriteArgs(args, 'Contact', 'update');
    const data = (args as { data: Record<string, unknown> }).data;
    expect(data.emailIndex).toEqual(expect.any(String));
    expect(data.emailDomainIndex).toEqual(expect.any(String));
    // Não tocou phone/whatsapp → índices deles NÃO podem ser apagados do registro.
    expect('phoneIndex' in data).toBe(false);
    expect('whatsappIndex' in data).toBe(false);
  });

  it('em update que não toca PII não adiciona nenhum índice', () => {
    const args = { where: { id: 'c1' }, data: { name: 'Só nome' } };
    applyPiiEncryptionToWriteArgs(args, 'Contact', 'update');
    const data = (args as { data: Record<string, unknown> }).data;
    expect(data.name).toBe('Só nome');
    expect('emailIndex' in data).toBe(false);
    expect('phoneIndex' in data).toBe(false);
  });

  it('em createMany cifra cada item do array', () => {
    const args = {
      data: [
        { email: 'a@x.com' },
        { email: 'b@x.com' },
      ],
    };
    applyPiiEncryptionToWriteArgs(args, 'Contact', 'createMany');
    const data = (args as { data: Array<Record<string, unknown>> }).data;
    for (const d of data) {
      expect(String(d.email)).toMatch(/^enc:v1:/);
      expect(d.emailIndex).toEqual(expect.any(String));
    }
  });

  it('em upsert cifra create completo e update parcial', () => {
    const args = {
      where: { id: 'c1' },
      create: { email: 'novo@x.com' },
      update: { phone: '+5511999990000' },
    };
    applyPiiEncryptionToWriteArgs(args, 'Contact', 'upsert');
    const a = args as { create: Record<string, unknown>; update: Record<string, unknown> };
    expect(String(a.create.email)).toMatch(/^enc:v1:/);
    expect(a.create.emailIndex).toEqual(expect.any(String));
    expect(String(a.update.phone)).toMatch(/^enc:v1:/);
    expect(a.update.phoneIndex).toEqual(expect.any(String));
    expect('emailIndex' in a.update).toBe(false);
  });

  it('não toca em model sem campos criptografados nem em leitura', () => {
    const args = { data: { name: 'Org' } };
    applyPiiEncryptionToWriteArgs(args, 'Organization', 'create');
    expect(args).toEqual({ data: { name: 'Org' } });

    const readArgs = { where: { id: 'c1' } };
    applyPiiEncryptionToWriteArgs(readArgs, 'Contact', 'findUnique');
    expect(readArgs).toEqual({ where: { id: 'c1' } });
  });
});

describe('applySoftDeleteReadFilter / isAuditableModel', () => {
  it('adiciona where.deletedAt = null em leituras de model auditável, preservando where existente', () => {
    const args = { where: { name: 'Acme' }, take: 10 };
    applySoftDeleteReadFilter(args, 'Lead', 'findMany');
    const a = args as { where: Record<string, unknown>; take: number };
    expect(a.where.deletedAt).toBeNull();
    expect(a.where.name).toBe('Acme');
    expect(a.take).toBe(10);
  });

  it('cobre findFirst/findFirstOrThrow/count/aggregate/groupBy', () => {
    for (const op of ['findFirst', 'findFirstOrThrow', 'count', 'aggregate', 'groupBy']) {
      const args = { where: {} };
      applySoftDeleteReadFilter(args, 'Company', op);
      expect((args as { where: { deletedAt: unknown } }).where.deletedAt).toBeNull();
    }
  });

  it('não filtra em escrita nem em model não auditável', () => {
    const writeArgs = { where: { id: 'x' }, data: {} };
    applySoftDeleteReadFilter(writeArgs, 'Lead', 'update');
    expect((writeArgs as { where: Record<string, unknown> }).where.deletedAt).toBeUndefined();

    const nonAuditable = { where: {} };
    applySoftDeleteReadFilter(nonAuditable, 'Organization', 'findMany');
    expect((nonAuditable as { where: Record<string, unknown> }).where.deletedAt).toBeUndefined();

    expect(isAuditableModel('Lead')).toBe(true);
    expect(isAuditableModel('Organization')).toBe(false);
  });
});

describe('decryptNestedContactPii', () => {
  it('decifra email/phone/whatsapp cifrados em qualquer profundidade do resultado', () => {
    const email = encryptField('maria@example.com');
    const phone = encryptField('+5511999990000');
    const result = {
      id: 'lead-1',
      contact: {
        id: 'c1',
        email,
        phone,
        whatsapp: 'texto legado sem cifra',
        profile: { deep: { email } },
      },
      contacts: [{ email }],
    };
    decryptNestedContactPii(result);
    const r = result as {
      contact: {
        email: string;
        phone: string;
        whatsapp: string;
        profile: { deep: { email: string } };
      };
      contacts: Array<{ email: string }>;
    };
    expect(r.contact.email).toBe('maria@example.com');
    expect(r.contact.phone).toBe('+5511999990000');
    expect(r.contact.whatsapp).toBe('texto legado sem cifra'); // passthrough sem prefixo enc:v1:
    expect(r.contact.profile.deep.email).toBe('maria@example.com');
    expect(r.contacts[0].email).toBe('maria@example.com');
  });

  it('isola falha de descriptografia ao campo/registro (não derruba a query)', () => {
    const result = {
      id: 'lead-2',
      contact: { id: 'c2', email: 'enc:v1:cifrado-adulterado' },
    };
    decryptNestedContactPii(result);
    const r = result as { contact: { email: string } };
    expect(r.contact.email).toBe(DECRYPTION_FAILED_MARKER);
  });

  it('respeita o limite de profundidade (não decifra além de 6 níveis)', () => {
    const secret = encryptField('profundo@example.com');
    // Monta cadeia aninhada: node.l.l...l.email — o objeto que contém `email` fica a
    // profundidade 8 (> NESTED_CONTACT_PII_MAX_DEPTH = 6), então a travessia para cedo e o
    // ciphertext permanece intacto (fail-safe: nunca decifra "no escuro" fora do limite).
    let node: Record<string, unknown> = { email: secret };
    for (let i = 0; i < 8; i++) node = { l: node };
    decryptNestedContactPii(node);
    let cursor: Record<string, unknown> = node;
    for (let i = 0; i < 8; i++) cursor = cursor.l as Record<string, unknown>;
    expect((cursor as { email: string }).email).toBe(secret);
  });

  it('é idempotente sobre valores já decifrados e ignora primitivos', () => {
    const result = { contact: { email: 'ja@decifrado.com', name: 'Fulano' } };
    decryptNestedContactPii(result);
    expect((result as { contact: { email: string } }).contact.email).toBe('ja@decifrado.com');
    expect(decryptNestedContactPii(null)).toBeNull();
    expect(decryptNestedContactPii('string')).toBe('string');
    expect(decryptNestedContactPii(42)).toBe(42);
  });
});

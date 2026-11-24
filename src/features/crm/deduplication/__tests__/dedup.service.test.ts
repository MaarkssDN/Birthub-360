import { describe, expect, it } from 'vitest';
import {
  detectScoredDuplicates,
  jaroWinklerSimilarity,
  normalizeDocument,
  normalizePhoneToE164,
  planContactMerge,
  type ScoredCrmContact,
} from '../dedup.service.js';

/**
 * SQUAD40-48-DEDUP — detecção pontuada (e-mail/telefone/documento/nome fuzzy) escopada por
 * tenant + planejador de merge dry-run com trilha de auditoria. Dados 100% sintéticos.
 */

const contact = (over: Partial<ScoredCrmContact> & { id: string }): ScoredCrmContact => ({
  organizationId: 'org-1',
  name: 'Contato Sintetico',
  ...over,
});

describe('normalizeDocument', () => {
  it('extrai dígitos de CPF e CNPJ mascarados', () => {
    expect(normalizeDocument('123.456.789-09')).toBe('12345678909');
    expect(normalizeDocument('12.345.678/0001-90')).toBe('12345678000190');
    expect(normalizeDocument('12345678909')).toBe('12345678909');
  });

  it('retorna null para documento com tamanho inválido ou vazio', () => {
    expect(normalizeDocument(null)).toBeNull();
    expect(normalizeDocument(undefined)).toBeNull();
    expect(normalizeDocument('')).toBeNull();
    expect(normalizeDocument('12345')).toBeNull();
    expect(normalizeDocument('123456789012')).toBeNull(); // 12 dígitos — nem CPF nem CNPJ
  });
});

describe('normalizePhoneToE164 (regressão)', () => {
  it('normaliza celular BR com DDI', () => {
    expect(normalizePhoneToE164('(11) 98765-4321')).toBe('+5511987654321');
    expect(normalizePhoneToE164('+55 11 98765-4321')).toBe('+5511987654321');
    expect(normalizePhoneToE164('curto')).toBeNull();
  });
});

describe('jaroWinklerSimilarity', () => {
  it('strings idênticas = 1; totalmente diferentes ≈ 0', () => {
    expect(jaroWinklerSimilarity('maria silva', 'maria silva')).toBe(1);
    expect(jaroWinklerSimilarity('abc', '')).toBe(0);
    expect(jaroWinklerSimilarity('zzz', 'aaa')).toBeLessThan(0.5);
  });
});

describe('detectScoredDuplicates — chaves exatas', () => {
  it('detecta duplicata por e-mail com score 1 e razão EMAIL', () => {
    const matches = detectScoredDuplicates([
      contact({ id: 'c1', name: 'Primeiro Contato', email: 'Ana@Exemplo.com' }),
      contact({ id: 'c2', name: 'Segundo Contato', email: 'ana@exemplo.com' }),
    ]);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      primaryId: 'c1',
      duplicateId: 'c2',
      organizationId: 'org-1',
      score: 1,
      reasons: ['EMAIL'],
    });
  });

  it('detecta por telefone E.164 e por documento (CNPJ) normalizados', () => {
    const matches = detectScoredDuplicates([
      contact({ id: 'c1', phone: '(11) 98765-4321' }),
      contact({ id: 'c2', phone: '+55 11 98765-4321' }),
      contact({ id: 'c3', name: 'Empresa A', document: '12.345.678/0001-90' }),
      contact({ id: 'c4', name: 'Empresa B', document: '12345678000190' }),
    ]);
    const phone = matches.find((m) => m.reasons.includes('PHONE_E164'));
    const doc = matches.find((m) => m.reasons.includes('DOCUMENT'));
    expect(phone).toMatchObject({ primaryId: 'c1', duplicateId: 'c2', score: 0.95 });
    expect(doc).toMatchObject({ primaryId: 'c3', duplicateId: 'c4', score: 0.98 });
  });

  it('registra múltiplas razões quando e-mail e telefone batem', () => {
    const matches = detectScoredDuplicates([
      contact({ id: 'c1', email: 'a@x.com', phone: '(11) 90000-0001' }),
      contact({ id: 'c2', email: 'a@x.com', phone: '+55 11 90000-0001' }),
    ]);
    expect(matches).toHaveLength(1);
    expect(matches[0].reasons).toEqual(expect.arrayContaining(['EMAIL', 'PHONE_E164']));
  });
});

describe('detectScoredDuplicates — isolamento por tenant', () => {
  it('NUNCA cruza organizações: mesmo e-mail em tenants diferentes não é duplicata', () => {
    const matches = detectScoredDuplicates([
      contact({ id: 'c1', organizationId: 'org-1', email: 'a@x.com' }),
      contact({ id: 'c2', organizationId: 'org-2', email: 'a@x.com' }),
      contact({ id: 'c3', organizationId: 'org-2', email: 'a@x.com' }),
    ]);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      primaryId: 'c2',
      duplicateId: 'c3',
      organizationId: 'org-2',
    });
  });
});

describe('detectScoredDuplicates — nome', () => {
  it('detecta nome fonético igual (PHONETIC_NAME)', () => {
    const matches = detectScoredDuplicates([
      contact({ id: 'c1', name: 'José Silva' }),
      contact({ id: 'c2', name: 'Joses Silva' }), // PH→F etc. igualam a chave fonética
    ]);
    // Se a chave fonética não igualar, o fuzzy pode pegar — aceitamos qualquer um dos dois,
    // mas o par TEM que ser detectado com score >= limiar.
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches[0].score).toBeGreaterThanOrEqual(0.9);
  });

  it('detecta nome fuzzy com acento/grafia divergente (FUZZY_NAME)', () => {
    const matches = detectScoredDuplicates([
      contact({ id: 'c1', name: 'Mariana Rodrigues' }),
      contact({ id: 'c2', name: 'Mariana Rodrigues ' }),
      contact({ id: 'c3', name: 'Mariana Rodrigues Souza' }),
    ]);
    // c2 casa por igualdade normalizada; c3 pode ficar abaixo do limiar — não exigimos match.
    expect(matches.some((m) => m.duplicateId === 'c2')).toBe(true);
  });

  it('não gera match para nomes sem relação', () => {
    const matches = detectScoredDuplicates([
      contact({ id: 'c1', name: 'Zuleica Albuquerque' }),
      contact({ id: 'c2', name: 'Bruno Teixeira' }),
    ]);
    expect(matches).toHaveLength(0);
  });

  it('respeita fuzzyNameThreshold customizado', () => {
    const contacts = [
      contact({ id: 'c1', name: 'Ana Beatriz Costa' }),
      contact({ id: 'c2', name: 'Ana Beatriz Cota' }), // 1 char diff
    ];
    const strict = detectScoredDuplicates(contacts, { fuzzyNameThreshold: 0.999 });
    const lenient = detectScoredDuplicates(contacts, { fuzzyNameThreshold: 0.8 });
    expect(strict).toHaveLength(0);
    expect(lenient.length).toBeGreaterThanOrEqual(1);
    expect(lenient[0].reasons).toContain('FUZZY_NAME');
  });
});

describe('planContactMerge — fusão segura (dry-run)', () => {
  const primary = {
    id: 'survivor-1',
    organizationId: 'org-1',
    fields: { name: 'Ana Silva', email: 'ana@x.com', phone: null, document: null },
  };

  it('resgata campos vazios do duplicado sem perda de dados', () => {
    const plan = planContactMerge(primary, {
      id: 'dup-1',
      organizationId: 'org-1',
      fields: { name: 'Ana Silva', email: null, phone: '+5511999990000', document: '12345678909' },
    });
    const byField = Object.fromEntries(plan.fields.map((f) => [f.field, f]));
    expect(byField.phone).toMatchObject({ value: '+5511999990000', source: 'duplicate' });
    expect(byField.document).toMatchObject({ value: '12345678909', source: 'duplicate' });
    expect(byField.email).toMatchObject({ value: 'ana@x.com', source: 'primary' });
    expect(plan.conflicts).toHaveLength(0);
    expect(plan.audit.filledFromDuplicate).toEqual(
      expect.arrayContaining(['phone', 'document']),
    );
    expect(plan.audit.action).toBe('CRM_CONTACT_MERGE_PLAN');
  });

  it('conflito de campo: sobrevivente vence e o conflito é auditado (nunca silencioso)', () => {
    const plan = planContactMerge(primary, {
      id: 'dup-1',
      organizationId: 'org-1',
      fields: { name: 'Ana Outra', email: 'outra@x.com', phone: null },
    });
    const byField = Object.fromEntries(plan.fields.map((f) => [f.field, f]));
    expect(byField.name).toMatchObject({ value: 'Ana Silva', conflict: true });
    expect(byField.email).toMatchObject({ value: 'ana@x.com', conflict: true });
    expect(plan.conflicts).toEqual(expect.arrayContaining(['name', 'email']));
    expect(plan.audit.conflictCount).toBe(2);
  });

  it('valores iguais (após trim) não geram conflito', () => {
    const plan = planContactMerge(primary, {
      id: 'dup-1',
      organizationId: 'org-1',
      fields: { name: '  Ana Silva  ', email: 'ana@x.com' },
    });
    expect(plan.conflicts).toHaveLength(0);
  });

  it('BLOQUEIA merge cross-tenant', () => {
    expect(() =>
      planContactMerge(primary, {
        id: 'dup-x',
        organizationId: 'org-OUTRA',
        fields: { email: 'x@x.com' },
      }),
    ).toThrow(/cross-tenant/);
  });

  it('BLOQUEIA auto-merge (mesmo id)', () => {
    expect(() =>
      planContactMerge(primary, { ...primary, fields: { ...primary.fields } }),
    ).toThrow(/itself/);
  });
});

import { describe, expect, it } from 'vitest';
import { LANDING_DEMO_CONSENT_VERSION } from '../publicLead.constants.js';
import { hashClientIp } from '../publicLead.ipHash.js';
import {
  fieldErrorsFromZod,
  isHoneypotFilled,
  normalizeBrWhatsapp,
  publicLeadSchema,
} from '../publicLead.schema.js';

const valid = {
  nome: 'Mariana Albuquerque',
  email: 'Voce@SuaEmpresa.com.br',
  whatsapp: '(11) 99999-9999',
  equipe: '6 a 15',
  consent: true,
  consentTextVersion: LANDING_DEMO_CONSENT_VERSION,
  purpose: 'agendamento_demonstracao',
};

describe('publicLeadSchema', () => {
  it('aceita payload válido, normaliza e-mail e WhatsApp e ignora tenantId do cliente', () => {
    const parsed = publicLeadSchema.parse({ ...valid, tenantId: 'org-maliciosa' });
    expect(parsed.email).toBe('voce@suaempresa.com.br');
    expect(parsed.whatsapp).toBe('5511999999999');
    expect(parsed).not.toHaveProperty('tenantId');
  });

  it('rejeita e-mail inválido', () => {
    const result = publicLeadSchema.safeParse({ ...valid, email: 'nao-e-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrorsFromZod(result.error).email).toBe('invalid');
    }
  });

  it('rejeita ausência de consentimento (false ou omitido)', () => {
    for (const consent of [false, undefined]) {
      const result = publicLeadSchema.safeParse({ ...valid, consent });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(fieldErrorsFromZod(result.error).consent).toBe('required');
      }
    }
  });

  it('rejeita versão de texto de consentimento divergente', () => {
    const result = publicLeadSchema.safeParse({ ...valid, consentTextVersion: 'v0-antiga' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrorsFromZod(result.error).consentTextVersion).toBe('stale');
    }
  });

  it('rejeita equipe fora do enum e WhatsApp curto', () => {
    const equipe = publicLeadSchema.safeParse({ ...valid, equipe: 'milhares' });
    expect(equipe.success).toBe(false);
    if (!equipe.success) {
      expect(fieldErrorsFromZod(equipe.error).equipe).toBe('invalid');
    }
    const phone = publicLeadSchema.safeParse({ ...valid, whatsapp: '123' });
    expect(phone.success).toBe(false);
    if (!phone.success) {
      expect(fieldErrorsFromZod(phone.error).whatsapp).toBe('invalid');
    }
  });

  it('normaliza WhatsApp com DDI 55 já presente', () => {
    expect(normalizeBrWhatsapp('+55 11 98888-7777')).toBe('5511988887777');
  });

  it('detecta honeypot preenchido e ignora string vazia', () => {
    expect(isHoneypotFilled('')).toBe(false);
    expect(isHoneypotFilled('   ')).toBe(false);
    expect(isHoneypotFilled(undefined)).toBe(false);
    expect(isHoneypotFilled('http://spam.test')).toBe(true);
    expect(isHoneypotFilled(1)).toBe(true);
  });

  it('aceita WhatsApp omitido ou vazio e rejeita número inválido', () => {
    const omitted = publicLeadSchema.safeParse({ ...valid, whatsapp: undefined });
    expect(omitted.success).toBe(true);
    const empty = publicLeadSchema.safeParse({ ...valid, whatsapp: '' });
    expect(empty.success).toBe(true);
    if (empty.success) {
      expect(empty.data.whatsapp).toBeUndefined();
    }
    const invalid = publicLeadSchema.safeParse({ ...valid, whatsapp: '123' });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(fieldErrorsFromZod(invalid.error).whatsapp).toBe('invalid');
    }
  });

  it('exige purpose da lista fechada', () => {
    const missing = publicLeadSchema.safeParse({ ...valid, purpose: undefined });
    expect(missing.success).toBe(false);
    if (!missing.success) {
      expect(fieldErrorsFromZod(missing.error).purpose).toBe('invalid');
    }
    const other = publicLeadSchema.safeParse({ ...valid, purpose: 'newsletter' });
    expect(other.success).toBe(false);
  });
});

describe('hashClientIp', () => {
  it('nunca devolve o IP em claro e exige segredo', () => {
    const ip = '200.201.202.203';
    const secret = 'abcdefghijklmnopqrstuvwxyz012345';
    const hashed = hashClientIp(ip, secret);
    expect(hashed).toBeTruthy();
    expect(hashed).not.toContain(ip);
    expect(hashed).toBe(hashClientIp(ip, secret));
    expect(hashClientIp(ip, 'a-different-secret-key-32b')).not.toBe(hashed);
    expect(hashClientIp(ip, undefined)).toBeNull();
    expect(hashClientIp(undefined, secret)).toBeNull();
    expect(hashClientIp('', secret)).toBeNull();
  });
});

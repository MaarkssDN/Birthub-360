import { describe, expect, it } from 'vitest';
import {
  getFirstInvalidLeadField,
  isValidBrazilianWhatsapp,
  isValidLeadEmail,
  normalizeBrazilianWhatsapp,
  validateLeadForm,
} from '@/features/landing/services/leadFormValidation';

describe('leadFormValidation', () => {
  it('normaliza WhatsApp BR com máscara e DDI 55', () => {
    expect(normalizeBrazilianWhatsapp('(11) 99999-9999')).toBe('11999999999');
    expect(normalizeBrazilianWhatsapp('+55 11 99999-9999')).toBe('11999999999');
    expect(normalizeBrazilianWhatsapp('1133334444')).toBe('1133334444');
  });

  it('aceita WhatsApp com DDD de 10 ou 11 dígitos e rejeita os demais', () => {
    expect(isValidBrazilianWhatsapp('(11) 99999-9999')).toBe(true);
    expect(isValidBrazilianWhatsapp('(11) 3333-4444')).toBe(true);
    expect(isValidBrazilianWhatsapp('123')).toBe(false);
    expect(isValidBrazilianWhatsapp('')).toBe(false);
  });

  it('valida e-mail simples e exige nome, WhatsApp e consentimento', () => {
    expect(isValidLeadEmail('mariana@vanguarda.com.br')).toBe(true);
    expect(isValidLeadEmail('invalido-sem-arroba')).toBe(false);

    const errors = validateLeadForm({
      nome: ' ',
      email: 'invalido-sem-arroba',
      whatsapp: '123',
      equipe: '6 a 15',
      consent: false,
    });

    expect(errors.nome).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.whatsapp).toBeDefined();
    expect(errors.consent).toBeDefined();
    expect(getFirstInvalidLeadField(errors)).toBe('nome');
  });
});

import { describe, expect, it } from 'vitest';
import {
  getFirstInvalidLeadField,
  isValidBrazilianWhatsapp,
  isValidLeadEmail,
  mapLeadServerFieldErrors,
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

  it('valida e-mail simples e exige nome e consentimento; WhatsApp só é validado se preenchido', () => {
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

    const withoutWhatsapp = validateLeadForm({
      nome: 'Mariana Albuquerque',
      email: 'mariana@vanguarda.com.br',
      whatsapp: '',
      equipe: '6 a 15',
      consent: true,
    });
    expect(withoutWhatsapp).toEqual({});
  });

  it('mapeia fields de 400 do servidor para erros de campo e mensagem de formulário', () => {
    const mapped = mapLeadServerFieldErrors({
      email: 'invalid',
      consent: 'required',
      consentTextVersion: 'stale',
    });
    expect(mapped.fieldErrors.email).toMatch(/e-mail válido/i);
    expect(mapped.fieldErrors.consent).toMatch(/autorizar o tratamento/i);
    expect(mapped.formMessage).toMatch(/versão do termo de consentimento/i);
  });
});

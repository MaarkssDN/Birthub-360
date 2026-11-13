// @vitest-environment node
/**
 * DEM-20261113-002 / Onda 1, MEL-04 — máscara irreversível de PII em logs.
 * Cobre sanitizeLogValue (logger.ts) e maskPiiInText (piiMask.ts):
 * CPF, CNPJ, e-mail e telefone em strings livres, mensagens de erro e
 * payloads aninhados devem sair mascarados; strings sem PII passam intactas.
 */
import { describe, expect, it } from 'vitest';
import { sanitizeLogValue } from '../../../src/lib/logger.js';
import { maskPiiInText } from '../../../src/lib/security/piiMask.js';

describe('MEL-04: máscara de PII em logs', () => {
  it('mascara CPF, CNPJ, e-mail e telefone em texto livre', () => {
    const out = maskPiiInText(
      'lead joao@empresa.com.br cpf 123.456.789-09 tel (11) 98765-4321 cnpj 12.345.678/0001-90',
    );
    expect(out).not.toContain('joao@empresa.com.br');
    expect(out).not.toContain('123.456.789-09');
    expect(out).not.toContain('98765-4321');
    expect(out).not.toContain('12.345.678/0001-90');
    expect(out).toContain('[EMAIL_OCULTO]');
    expect(out).toContain('[CPF_OCULTO]');
    expect(out).toContain('[TELEFONE_OCULTO]');
    expect(out).toContain('[CNPJ_OCULTO]');
  });

  it('não altera strings sem PII', () => {
    expect(sanitizeLogValue('lead importado com sucesso')).toBe('lead importado com sucesso');
    expect(sanitizeLogValue('count=42 status=ok')).toBe('count=42 status=ok');
  });

  it('sanitiza mensagem de Error (err.message/err.stack)', () => {
    const err = new Error('falha ao enviar para maria.silva@cliente.com');
    sanitizeLogValue(err);
    expect(err.message).toContain('[EMAIL_OCULTO]');
    expect(err.message).not.toContain('maria.silva@cliente.com');
  });

  it('sanitiza objetos aninhados', () => {
    const payload = {
      lead: { email: 'a@b.com', name: 'Ana' },
      meta: { attempts: 3 },
      arr: ['cpf 111.222.333-44 ok'],
    };
    const out = sanitizeLogValue(payload) as typeof payload;
    expect(out.lead.email).toBe('[EMAIL_OCULTO]');
    expect(out.lead.name).toBe('Ana');
    expect(out.meta.attempts).toBe(3);
    expect(out.arr[0]).toBe('cpf [CPF_OCULTO] ok');
  });

  it('respeita profundidade máxima sem quebrar', () => {
    let deep: Record<string, unknown> = { email: 'x@y.com' };
    for (let i = 0; i < 10; i++) deep = { next: deep };
    expect(() => sanitizeLogValue(deep)).not.toThrow();
  });
});

import { describe, expect, it } from 'vitest';
import { scanText } from '../../../scripts/security/pii-log-scanner.js';

describe('pii-log-scanner — TAREFA-SANEAMENTO-040', () => {
  it('detecta CPF formatado e sem formatação', () => {
    const a = scanText('login cpf=123.456.789-09 ok');
    expect(a).toEqual([{ kind: 'CPF', line: 1, maskedSnippet: expect.any(String) }]);
    expect(a[0].maskedSnippet).not.toContain('123.456.789-09');
    const b = scanText('doc 12345678909');
    expect(b.map((f) => f.kind)).toContain('CPF');
  });

  it('detecta e-mail, telefone e CNPJ', () => {
    const findings = scanText('maria@empresa.com.br ligue (11) 98765-4321 cnpj 12.345.678/0001-90');
    expect(findings.map((f) => f.kind).sort()).toEqual(['CNPJ', 'EMAIL', 'PHONE']);
  });

  it('detecta cartão válido por Luhn e ignora sequência inválida', () => {
    expect(scanText('cartão 4111 1111 1111 1111').map((f) => f.kind)).toContain('CARD');
    expect(scanText('número 4111 1111 1111 1112').map((f) => f.kind)).not.toContain('CARD');
  });

  it('não reporta PHONE sobreposto a CPF/cartão', () => {
    const kinds = scanText('4111 1111 1111 1111 e 12345678909').map((f) => f.kind);
    expect(kinds).toContain('CARD');
    expect(kinds).toContain('CPF');
    expect(kinds).not.toContain('PHONE');
  });

  it('detecta JWT/segredo Bearer sem vazar o valor', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const findings = scanText(`Authorization: Bearer ${jwt}`);
    expect(findings.map((f) => f.kind)).toContain('SECRET');
    expect(findings.every((f) => !f.maskedSnippet.includes(jwt.slice(10, 30)))).toBe(true);
  });

  it('linha limpa não gera achados; reporta número da linha correto', () => {
    expect(scanText('tudo limpo aqui\nsem nada\n')).toEqual([]);
    const findings = scanText('ok\nruim cpf 123.456.789-09\nok');
    expect(findings[0].line).toBe(2);
  });
});

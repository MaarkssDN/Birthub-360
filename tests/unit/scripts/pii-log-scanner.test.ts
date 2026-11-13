/**
 * TAREFA-SANEAMENTO-040 / BT360-DT-0090 (Agente 22) — cobre o harness de varredura de PII em
 * logs (scripts/verification/pii-log-scanner). Testa o CONTRATO do scanner: caminho limpo passa,
 * caminho sujo falha com findings mascarados, canaries de injeção são detectados e valores já
 * mascarados não geram falso positivo. Não depende de banco/rede — é teste unitário puro.
 */
import { describe, expect, it } from 'vitest';
// @ts-expect-error — módulo .mjs sem tipos; contrato exercitado aqui.
import {
  assertNoPii,
  createPiiCanaries,
  findCanaryLeak,
  scanTextForPii,
} from '../../../scripts/verification/pii-log-scanner/piiLogScanner.mjs';

describe('piiLogScanner — varredura de PII em logs', () => {
  it('aceita log limpo de aplicação (caminho de sucesso)', () => {
    const clean = [
      '{"level":"info","msg":"servidor ouvindo","port":3000}',
      'WARN retry em 500ms para /api/leads',
      'ERROR request failed status=500 route=/api/auth/login',
    ].join('\n');
    expect(scanTextForPii(clean)).toEqual([]);
    expect(() => assertNoPii(clean, { context: 'teste-limpo' })).not.toThrow();
  });

  it('detecta e-mail, CPF e segredo atribuído com linha/coluna corretos (caminho de falha)', () => {
    const dirty = [
      'INFO boot ok',
      'DEBUG user joao.silva@empresa.com.br autenticado',
      'cpf do cliente: 123.456.789-09',
      'falha login password="Sup3rSecreta!"',
    ].join('\n');
    const findings = scanTextForPii(dirty);
    const patterns = findings.map((f) => f.pattern);
    expect(patterns).toContain('email');
    expect(patterns).toContain('cpf-formatado');
    expect(patterns).toContain('segredo-atribuido');

    const email = findings.find((f) => f.pattern === 'email');
    expect(email?.line).toBe(2);
    const cpf = findings.find((f) => f.pattern === 'cpf-formatado');
    expect(cpf?.line).toBe(3);

    // Nunca vazar o PII em claro no finding — só preview mascarado.
    for (const f of findings) {
      expect(f.masked).not.toContain('@');
      expect(JSON.stringify(f)).not.toContain('joao.silva');
      expect(JSON.stringify(f)).not.toContain('123.456.789-09');
      expect(JSON.stringify(f)).not.toContain('Sup3rSecreta');
    }
  });

  it('assertNoPii lança erro descritivo e mascarado quando há vazamento', () => {
    expect(() =>
      assertNoPii('token: abcdefgh12345678\nemail vazou p/ fulano@x.com', {
        context: 'spec-x',
      }),
    ).toThrow(/Vazamento de PII detectado.*spec-x/s);
  });

  it('não reporta valores já mascarados pelo logger (sem falso positivo)', () => {
    const masked = [
      'WARN reset password=********',
      'INFO api_key: "<redacted>"',
      'DEBUG secret: [REDACTED]',
      'INFO token=***',
    ].join('\n');
    expect(scanTextForPii(masked)).toEqual([]);
  });

  it('detecta JWT, chave AWS e telefone em formatos reais', () => {
    const dirty = [
      'jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJVadQssw5c',
      'aws AKIAIOSFODNN7EXAMPLE',
      'ligação para (11) 98765-4321',
    ].join('\n');
    const patterns = scanTextForPii(dirty).map((f) => f.pattern);
    expect(patterns).toContain('jwt');
    expect(patterns).toContain('aws-access-key');
    expect(patterns).toContain('telefone-br-com-ddd');
  });

  it('canaries de injeção: PII sintético injetado é detectado e localizável', () => {
    const canaries = createPiiCanaries('vitest');
    // O canary precisa ser um formato que o scanner reconhece — prova de que a injeção funciona.
    const injected = `user=${canaries.email} cpf=${canaries.cpf} password=${canaries.password}`;
    const findings = scanTextForPii(injected);
    expect(findings.length).toBeGreaterThanOrEqual(2);

    // E o detector de canary encontra o valor exato no log capturado (vazamento real).
    const leaks = findCanaryLeak(`log capturado: ${canaries.email}`, canaries);
    expect(leaks).toHaveLength(1);
    expect(leaks[0].canary).toBe('email');
    expect(leaks[0].masked).not.toContain('@');

    // Log limpo não contém nenhum canary.
    expect(findCanaryLeak('nada aqui', canaries)).toEqual([]);
  });
});

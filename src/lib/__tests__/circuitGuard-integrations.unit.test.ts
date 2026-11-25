import { beforeEach, describe, expect, it } from 'vitest';
import { CircuitOpenError, circuitGuard, getCircuitHealthSnapshot } from '../circuitGuard.js';

// MEL-42 (Onda 6 / DEM-20261114-007): o circuitGuard compartilhado passa a cobrir todas as
// integrações externas operadas pelo Agente 06 — Bitrix, Stripe, Omie, WhatsApp e provedores
// de IA (estes últimos via nomes dinâmicos `ai:<provider>`). Estes testes fixam o contrato:
// os circuitos existem no snapshot de /health/ready desde o boot e são isolados entre si.
describe('CircuitGuard — integrações MEL-42', () => {
  beforeEach(() => {
    circuitGuard.reset();
  });

  it('expõe stripe, omie e whatsapp no snapshot de saúde desde o boot (KNOWN_SERVICES)', () => {
    const snapshot = getCircuitHealthSnapshot();

    for (const service of ['bitrix', 'stripe', 'omie', 'whatsapp', 'ai'] as const) {
      expect(snapshot[service], `circuito "${service}" ausente no snapshot`).toBeDefined();
      expect(snapshot[service].state).toBe('CLOSED');
    }
  });

  it('cria circuitos dinâmicos por provedor de IA (ai:gemini, ai:openai, ai:claude) sob demanda', async () => {
    await expect(circuitGuard.execute('ai:gemini', async () => 'gemini-response')).resolves.toBe(
      'gemini-response',
    );
    await expect(circuitGuard.execute('ai:openai', async () => 'openai-response')).resolves.toBe(
      'openai-response',
    );
    await expect(circuitGuard.execute('ai:claude', async () => 'claude-response')).resolves.toBe(
      'claude-response',
    );

    const snapshot = getCircuitHealthSnapshot();
    expect(snapshot['ai:gemini'].state).toBe('CLOSED');
    expect(snapshot['ai:openai'].state).toBe('CLOSED');
    expect(snapshot['ai:claude'].state).toBe('CLOSED');
  });

  it('isola falhas entre integrações: stripe OPEN não afeta omie nem whatsapp', async () => {
    for (let i = 0; i < 3; i++) {
      await expect(
        circuitGuard.execute('stripe', async () => {
          throw new Error('stripe 503');
        }),
      ).rejects.toThrow('stripe 503');
    }

    expect(circuitGuard.getState('stripe')).toBe('OPEN');
    expect(circuitGuard.getState('omie')).toBe('CLOSED');
    expect(circuitGuard.getState('whatsapp')).toBe('CLOSED');
    expect(circuitGuard.getState('bitrix')).toBe('CLOSED');

    // Stripe falha rápido; as demais integrações seguem operacionais.
    await expect(circuitGuard.execute('stripe', async () => 'ok')).rejects.toThrow(
      CircuitOpenError,
    );
    await expect(circuitGuard.execute('omie', async () => 'omie-ok')).resolves.toBe('omie-ok');
    await expect(circuitGuard.execute('whatsapp', async () => 'wa-ok')).resolves.toBe('wa-ok');
  });

  it('provedores de IA falham de forma independente: ai:openai OPEN não bloqueia ai:gemini', async () => {
    for (let i = 0; i < 3; i++) {
      await expect(
        circuitGuard.execute('ai:openai', async () => {
          throw new Error('openai timeout');
        }),
      ).rejects.toThrow('openai timeout');
    }

    expect(circuitGuard.getState('ai:openai')).toBe('OPEN');
    expect(circuitGuard.getState('ai:gemini')).toBe('CLOSED');

    await expect(circuitGuard.execute('ai:gemini', async () => 'gemini-fallback')).resolves.toBe(
      'gemini-fallback',
    );
  });
});

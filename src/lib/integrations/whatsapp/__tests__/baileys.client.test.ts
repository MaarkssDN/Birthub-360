import { describe, expect, it } from 'vitest';
import { WhatsAppAntiBanThrottler } from '../baileys.client.js';

/**
 * Testes do anti-ban throttler (Agente 56 Luna, Onda 4).
 *
 * Cenário crítico: o worker de comandos WhatsApp roda com concurrency > 1 (BullMQ), então
 * disparos da MESMA organização chegam a `throttle()` em paralelo. Sem serialização por org,
 * ambas as chamadas liam o mesmo `lastDispatchedAt` e nenhuma dormia — rajada real passava
 * sem delay. Estes testes provam que a cadeia por organização serializa os disparos.
 */
describe('WhatsAppAntiBanThrottler — serialização por organização', () => {
  it('serializa chamadas concorrentes da mesma organização (segundo disparo espera o delay)', async () => {
    const throttler = new WhatsAppAntiBanThrottler();
    const orgId = 'org-concorrencia';
    const delayMs = 60;

    const startedAt = Date.now();
    // Dispara duas chamadas "ao mesmo tempo" — como o BullMQ faria com concurrency > 1.
    const [first, second] = await Promise.all([
      throttler.throttle(orgId, delayMs),
      throttler.throttle(orgId, delayMs),
    ]);
    const elapsed = Date.now() - startedAt;

    expect(first).toBe(delayMs);
    expect(second).toBe(delayMs);
    // A segunda chamada só podia começar depois que a primeira gravou lastDispatchedAt; como
    // elapsed(≈0) < delayMs, ela dorme ~delayMs. Se não houvesse serialização, as duas
    // correriam em paralelo e o total seria ~0ms (nenhuma dormiria no primeiro disparo) ou
    // ~delayMs no máximo — serializado, o piso é ~delayMs para a segunda.
    expect(elapsed).toBeGreaterThanOrEqual(delayMs - 15);

    const record = throttler.getRecord(orgId);
    expect(record?.totalDispatched).toBe(2);
  });

  it('não bloqueia organizações diferentes entre si', async () => {
    const throttler = new WhatsAppAntiBanThrottler();

    // Org A tem um disparo recente → próxima chamada dela dorme; org B nunca disparou →
    // retorna imediatamente. Se a serialização fosse global (errada), B esperaria A.
    await throttler.throttle('org-lenta', 120);

    const startedAt = Date.now();
    let fastResolvedAt = 0;
    const fastPromise = throttler.throttle('org-rapida', 5).then((d) => {
      fastResolvedAt = Date.now() - startedAt;
      return d;
    });
    const [slow, fast] = await Promise.all([throttler.throttle('org-lenta', 120), fastPromise]);

    expect(slow).toBe(120);
    expect(fast).toBe(5);
    // org-rapida resolveu sem esperar o sleep de ~120ms de org-lenta.
    expect(fastResolvedAt).toBeLessThan(120);
    expect(throttler.getRecord('org-rapida')?.totalDispatched).toBe(1);
  });

  it('primeiro disparo de uma organização não dorme (sem histórico)', async () => {
    const throttler = new WhatsAppAntiBanThrottler();
    const startedAt = Date.now();
    const delay = await throttler.throttle('org-nova', 5000);
    const elapsed = Date.now() - startedAt;

    expect(delay).toBe(5000);
    expect(elapsed).toBeLessThan(100); // sem registro anterior → sem sleep
    expect(throttler.getRecord('org-nova')?.totalDispatched).toBe(1);
  });
});

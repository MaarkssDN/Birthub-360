import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { isValidStripeSignature } from '../../../../src/features/integrations/stripe/stripe.helpers.js';

describe('Agente 26 (Dália) - Proteção contra Replay Attack em Webhooks Stripe', () => {
  const secret = 'whsec_test_secret_1234567890abcdef';
  const rawBody = Buffer.from(JSON.stringify({ id: 'evt_123', type: 'payment_intent.succeeded' }));
  const nowMs = 1700000000000; // Tempo base fixo
  const nowSec = Math.floor(nowMs / 1000);

  function createHeader(timestampSec: number, sec: string, body: Buffer): string {
    const payload = `${timestampSec}.${body.toString('utf8')}`;
    const v1 = createHmac('sha256', sec).update(payload).digest('hex');
    return `t=${timestampSec},v1=${v1}`;
  }

  it('deve aceitar webhook com assinatura correta e timestamp recente dentro da janela de 5 minutos', () => {
    const signatureHeader = createHeader(nowSec - 30, secret, rawBody);
    const valid = isValidStripeSignature({
      rawBody,
      signatureHeader,
      secret,
      nowMs,
      maxSkewSeconds: 300,
    });
    expect(valid).toBe(true);
  });

  it('deve rejeitar webhook com assinatura expirada (replay attack com timestamp mais antigo que 5 min)', () => {
    // 301 segundos no passado
    const signatureHeader = createHeader(nowSec - 301, secret, rawBody);
    const valid = isValidStripeSignature({
      rawBody,
      signatureHeader,
      secret,
      nowMs,
      maxSkewSeconds: 300,
    });
    expect(valid).toBe(false);
  });

  it('deve rejeitar webhook com timestamp no futuro além da janela de tolerância', () => {
    // 301 segundos no futuro
    const signatureHeader = createHeader(nowSec + 301, secret, rawBody);
    const valid = isValidStripeSignature({
      rawBody,
      signatureHeader,
      secret,
      nowMs,
      maxSkewSeconds: 300,
    });
    expect(valid).toBe(false);
  });

  it('deve rejeitar webhook se o segredo ou assinatura v1 forem inválidos', () => {
    const signatureHeader = createHeader(nowSec, 'wrong_secret', rawBody);
    const valid = isValidStripeSignature({
      rawBody,
      signatureHeader,
      secret,
      nowMs,
      maxSkewSeconds: 300,
    });
    expect(valid).toBe(false);
  });
});

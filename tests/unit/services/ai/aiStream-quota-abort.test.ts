import { describe, expect, it } from 'vitest';
import { aiStreamService, QuotaExceededError } from '../../../../src/services/ai/aiStream.service.js';

describe('AiStreamService — Quota Protection & In-Flight Abort', () => {
  it('corta o streaming e aciona abortController assim que o limite de tokens da organizacao eh ultrapassado', async () => {
    const abortController = new AbortController();

    // Stream simulando chunks longos (cada um com ~40 caracteres = ~10 tokens)
    async function* fakeStream() {
      yield 'Chunk 1 com tamanho razoavel para teste.'; // ~10 tokens
      yield 'Chunk 2 com tamanho razoavel para teste.'; // ~10 tokens
      yield 'Chunk 3 com tamanho razoavel para teste.'; // ~10 tokens
      yield 'Chunk 4 com tamanho razoavel para teste.'; // ~10 tokens
    }

    const collectedChunks: string[] = [];
    let caughtError: unknown = null;

    try {
      // Limite de apenas 15 tokens: deve passar o chunk 1, mas estourar no chunk 2
      for await (const chunk of aiStreamService.processStreamWithQuota(fakeStream(), {
        organizationId: 'org-123',
        remainingTokens: 15,
        abortController,
      })) {
        collectedChunks.push(chunk);
      }
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(QuotaExceededError);
    expect((caughtError as QuotaExceededError).message).toContain('CotaExcedida');
    expect(abortController.signal.aborted).toBe(true);
    expect(collectedChunks).toHaveLength(1); // Apenas o primeiro chunk foi emitido antes do corte
  });
});

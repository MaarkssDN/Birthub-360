/**
 * src/services/ai/aiStream.service.ts
 * Streaming de IA com corte em tempo real por esgotamento de quota de tokens (Handoff 07-para-23 / DIV-AGENTE-23-001).
 */

export class QuotaExceededError extends Error {
  constructor(
    public readonly organizationId: string,
    public readonly consumedTokens: number,
  ) {
    super(
      `CotaExcedida: Limite de tokens da organizacao '${organizationId}' ultrapassado durante streaming (${consumedTokens} tokens consumidos).`,
    );
    this.name = 'QuotaExceededError';
  }
}

export class AiStreamService {
  /**
   * Consome um stream de chunks de texto monitorando tokens recebidos (estimativa 1 token ~ 4 caracteres).
   * Se os tokens acumulados atingirem a quota restante do tenant, aborta imediatamente o AbortController.
   */
  public async *processStreamWithQuota(
    chunkStream: AsyncIterable<string>,
    options: {
      organizationId: string;
      remainingTokens: number;
      abortController: AbortController;
    },
  ): AsyncGenerator<string, void, unknown> {
    let accumulatedTokens = 0;

    for await (const chunk of chunkStream) {
      if (options.abortController.signal.aborted) {
        throw new QuotaExceededError(options.organizationId, accumulatedTokens);
      }

      // Estimativa conservadora de tokens: ~4 caracteres por token
      const chunkTokens = Math.max(1, Math.ceil(chunk.length / 4));
      accumulatedTokens += chunkTokens;

      if (accumulatedTokens > options.remainingTokens) {
        options.abortController.abort();
        throw new QuotaExceededError(options.organizationId, accumulatedTokens);
      }

      yield chunk;
    }
  }
}

export const aiStreamService = new AiStreamService();

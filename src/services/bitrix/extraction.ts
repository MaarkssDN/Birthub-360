/**
 * src/services/bitrix/extraction.ts
 * Exportador / orquestrador com suporte a streaming em chunks para prevencao de OOM em grandes volumes.
 * (Handoff 06-para-06a / DIV-AGENTE-06-001)
 */

interface ChunkProcessResult {
  totalProcessed: number;
  chunksCount: number;
  peakHeapUsedBytes: number;
}

class BitrixStreamingExtractionService {
  /**
   * Async generator que consome uma fonte paginada em blocos definidos (ex: 500 por vez)
   * e descarrega para persistencia/callback sem manter todo o dataset em memoria.
   */
  public async *streamChunks<T>(
    fetcher: (offset: number, limit: number) => Promise<T[]>,
    chunkSize: number = 500,
    maxTotal?: number,
  ): AsyncGenerator<T[], void, unknown> {
    let offset = 0;
    let fetchedTotal = 0;

    while (true) {
      const limit = maxTotal ? Math.min(chunkSize, maxTotal - fetchedTotal) : chunkSize;
      if (limit <= 0) break;

      const batch = await fetcher(offset, limit);
      if (!batch || batch.length === 0) break;

      yield batch;

      fetchedTotal += batch.length;
      offset += batch.length;

      if (batch.length < limit || (maxTotal && fetchedTotal >= maxTotal)) {
        break;
      }
    }
  }

  /**
   * Processa uma extracao massiva por streaming garantindo que a memoria permaneca baixa.
   */
  public async processMassiveExtraction<T>(
    fetcher: (offset: number, limit: number) => Promise<T[]>,
    chunkHandler: (chunk: T[], chunkIndex: number) => Promise<void>,
    options: { chunkSize?: number; maxTotal?: number } = {},
  ): Promise<ChunkProcessResult> {
    const chunkSize = options.chunkSize ?? 500;
    let totalProcessed = 0;
    let chunksCount = 0;
    let peakHeap = 0;

    for await (const chunk of this.streamChunks(fetcher, chunkSize, options.maxTotal)) {
      chunksCount++;
      totalProcessed += chunk.length;

      await chunkHandler(chunk, chunksCount);

      const mem = process.memoryUsage().heapUsed;
      if (mem > peakHeap) {
        peakHeap = mem;
      }
    }

    return {
      totalProcessed,
      chunksCount,
      peakHeapUsedBytes: peakHeap,
    };
  }
}

export const bitrixStreamingExtractionService = new BitrixStreamingExtractionService();

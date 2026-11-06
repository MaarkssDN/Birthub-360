import { describe, expect, it } from 'vitest';
import { bitrixStreamingExtractionService } from '../../../../src/services/bitrix/extraction.js';

describe('BitrixStreamingExtractionService — Memory & Streaming Validation', () => {
  it('extracao de 10.000 contatos simulados mantem consumo de heap estavel abaixo de 150MB', async () => {
    const totalSimulated = 10_000;
    const initialHeap = process.memoryUsage().heapUsed;

    // Simula fonte de dados externa paginada retornando registros leves
    const fakeFetcher = async (offset: number, limit: number) => {
      const remaining = Math.max(0, totalSimulated - offset);
      const count = Math.min(limit, remaining);
      return Array.from({ length: count }, (_, i) => ({
        id: `contact-${offset + i}`,
        name: `Lead ${offset + i}`,
        email: `lead${offset + i}@exemplo.com`,
      }));
    };

    let processedCount = 0;
    const result = await bitrixStreamingExtractionService.processMassiveExtraction(
      fakeFetcher,
      async (chunk) => {
        processedCount += chunk.length;
      },
      { chunkSize: 500, maxTotal: totalSimulated },
    );

    const finalHeap = process.memoryUsage().heapUsed;
    const heapUsedMb = finalHeap / (1024 * 1024);

    expect(result.totalProcessed).toBe(10_000);
    expect(result.chunksCount).toBe(20);
    expect(processedCount).toBe(10_000);
    // SLA de aceitacao do handoff: heap estavel abaixo de 150MB
    expect(heapUsedMb).toBeLessThan(150);
  });
});

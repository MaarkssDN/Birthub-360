import { beforeEach, describe, expect, it, vi } from 'vitest';

const hybridSearchMock = vi.fn();

vi.mock('../../../knowledge/search.service.js', () => ({
  searchService: {
    hybridSearch: (...args: unknown[]) => hybridSearchMock(...args),
  },
}));

const { VectorSearchService } = await import('../vector-search.service.js');

describe('VectorSearchService.searchChunks (BT360-DT-0041)', () => {
  beforeEach(() => {
    hybridSearchMock.mockReset();
  });

  it('retorna [] quando organizationId está ausente, sem chamar a busca', async () => {
    const result = await VectorSearchService.searchChunks('contrato', '');
    expect(result).toEqual([]);
    expect(hybridSearchMock).not.toHaveBeenCalled();
  });

  it('mapeia hits do hybridSearch para SearchResult no caminho de sucesso', async () => {
    hybridSearchMock.mockResolvedValueOnce({
      hits: [
        {
          chunkId: 'chunk-1',
          documentId: 'doc-1',
          documentTitle: 'Manual de rastreador',
          content: 'Conteúdo do trecho',
          chunkIndex: 0,
          matchedBy: ['semantic'],
          similarity: 0.9,
          score: 0.5,
        },
      ],
      semanticAvailable: true,
      keywordAvailable: true,
      query: 'rastreador',
    });

    const result = await VectorSearchService.searchChunks('rastreador', 'org-1', 5);

    expect(hybridSearchMock).toHaveBeenCalledWith('org-1', 'rastreador', 5);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'chunk-1',
      content: 'Conteúdo do trecho',
      similarity: 0.9,
    });
    expect(result[0].metadata).toMatchObject({ documentId: 'doc-1', matchedBy: ['semantic'] });
  });

  it('propaga erro de infraestrutura em vez de devolver lista vazia', async () => {
    hybridSearchMock.mockRejectedValueOnce(new Error('Base de Conhecimento indisponível'));

    await expect(VectorSearchService.searchChunks('rastreador', 'org-1')).rejects.toThrow(
      'Base de Conhecimento indisponível',
    );
  });
});

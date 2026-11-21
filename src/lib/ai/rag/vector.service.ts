export interface VectorSearchQueryInput {
  tenantId: string;
  embedding: readonly number[];
  topK?: number;
  minSimilarity?: number;
  hnswEfSearch?: number;
}

export interface VectorSearchHit {
  documentId: string;
  tenantId: string;
  content: string;
  similarity: number;
}

export interface VectorDbExecutorPort {
  queryPartitionedHnsw(params: {
    sql: string;
    values: readonly unknown[];
    hnswEfSearch: number;
  }): Promise<VectorSearchHit[]>;
}

export function buildHnswTenantVectorQuery(input: VectorSearchQueryInput): {
  sql: string;
  values: [string, string, number, number];
  hnswEfSearch: number;
} {
  if (!input.tenantId?.trim()) {
    throw new Error(
      'tenantId é obrigatório na busca semântica do PgVector (isolamento multi-tenant).',
    );
  }
  if (!Array.isArray(input.embedding) || input.embedding.length === 0) {
    throw new Error('embedding vetorial não pode ser vazio.');
  }
  for (const val of input.embedding) {
    if (!Number.isFinite(val)) {
      throw new Error('embedding contém valor numérico inválido.');
    }
  }

  const vectorLiteral = `[${input.embedding.join(',')}]`;
  const topK = Math.min(Math.max(1, Math.trunc(input.topK ?? 5)), 50);
  const minSimilarity = Math.min(Math.max(0, input.minSimilarity ?? 0.7), 1);
  const hnswEfSearch = Math.min(Math.max(10, Math.trunc(input.hnswEfSearch ?? 40)), 400);

  const sql = [
    'SELECT id AS "documentId", tenant_id AS "tenantId", content,',
    '       (1 - (embedding <=> $2::vector)) AS similarity',
    'FROM knowledge_embeddings',
    'WHERE tenant_id = $1',
    '  AND (1 - (embedding <=> $2::vector)) >= $3',
    'ORDER BY embedding <=> $2::vector ASC',
    'LIMIT $4',
  ].join('\n');

  return {
    sql,
    values: [input.tenantId.trim(), vectorLiteral, minSimilarity, topK],
    hnswEfSearch,
  };
}

export class TenantPartitionedVectorService {
  constructor(private readonly db: VectorDbExecutorPort) {}

  async searchSimilarDocuments(input: VectorSearchQueryInput): Promise<VectorSearchHit[]> {
    const query = buildHnswTenantVectorQuery(input);
    const hits = await this.db.queryPartitionedHnsw(query);
    // Double-check defensivo em memória garantindo que nenhum documento de outro tenant passe
    return hits.filter((hit) => hit.tenantId === input.tenantId.trim());
  }
}

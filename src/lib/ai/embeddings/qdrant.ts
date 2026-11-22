/**
 * Cliente Qdrant para embeddings
 * Substitui implementação local de embeddings por vector database escalável
 */
import { QdrantClient } from '@qdrant/js-client-rest';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = 'document_embeddings';

let qdrantClient: QdrantClient | null = null;

function getClient(): QdrantClient {
  if (!qdrantClient) {
    qdrantClient = new QdrantClient({
      url: QDRANT_URL,
    });
  }
  return qdrantClient;
}

export interface EmbeddingMetadata {
  tenantId: string;
  documentId: string;
  documentType?: string;
  title?: string;
  chunkIndex?: number;
  [key: string]: unknown;
}

export interface SearchOptions {
  limit?: number;
  scoreThreshold?: number;
  filter?: {
    tenantId: string;
    documentType?: string;
  };
}

/**
 * Inicializa a coleção Qdrant se não existir
 */
export async function initializeQdrantCollection(): Promise<void> {
  const client = getClient();

  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1536, // Tamanho padrão de embeddings OpenAI/Groq
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
      });
      console.log(`Coleção Qdrant '${COLLECTION_NAME}' criada com sucesso.`);
    }
  } catch (error) {
    console.error('Erro ao inicializar coleção Qdrant:', error);
    throw error;
  }
}

/**
 * Upsert embeddings no Qdrant
 */
export async function upsertEmbedding(
  tenantId: string,
  documentId: string,
  vector: number[],
  metadata: EmbeddingMetadata,
): Promise<string> {
  const client = getClient();

  try {
    const pointId = `${tenantId}-${documentId}-${metadata.chunkIndex || 0}`;

    await client.upsert(COLLECTION_NAME, {
      points: [
        {
          id: pointId,
          vector,
          payload: {
            ...metadata,
            tenantId,
            documentId,
          },
        },
      ],
    });

    return pointId;
  } catch (error) {
    console.error('Erro ao upsert embedding no Qdrant:', error);
    throw error;
  }
}

/**
 * Busca embeddings semânticos no Qdrant
 */
export async function searchEmbeddings(
  tenantId: string,
  queryVector: number[],
  options: SearchOptions = {},
): Promise<Array<{ id: string; score: number; payload: EmbeddingMetadata }>> {
  const client = getClient();
  const { limit = 10, scoreThreshold = 0.7, filter } = options;

  try {
    const filterQuery = filter
      ? {
          must: [
            {
              key: 'tenantId',
              match: { value: tenantId },
            },
            ...(filter.documentType
              ? [
                  {
                    key: 'documentType',
                    match: { value: filter.documentType },
                  },
                ]
              : []),
          ],
        }
      : {
          must: [
            {
              key: 'tenantId',
              match: { value: tenantId },
            },
          ],
        };

    const response = await client.query(COLLECTION_NAME, {
      query: queryVector,
      limit,
      score_threshold: scoreThreshold,
      filter: filterQuery,
      with_payload: true,
    });

    const points = 'points' in response ? response.points : response;
    return (points as any[]).map((result) => ({
      id: result.id as string,
      score: result.score || 0,
      payload: result.payload as EmbeddingMetadata,
    }));
  } catch (error) {
    console.error('Erro ao buscar embeddings no Qdrant:', error);
    throw error;
  }
}

/**
 * Deleta embeddings de um documento específico
 */
export async function deleteDocumentEmbeddings(
  tenantId: string,
  documentId: string,
): Promise<void> {
  const client = getClient();

  try {
    await client.delete(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'tenantId',
            match: { value: tenantId },
          },
          {
            key: 'documentId',
            match: { value: documentId },
          },
        ],
      },
    });
  } catch (error) {
    console.error('Erro ao deletar embeddings do Qdrant:', error);
    throw error;
  }
}

/**
 * Deleta embeddings de um tenant específico
 */
export async function deleteTenantEmbeddings(tenantId: string): Promise<void> {
  const client = getClient();

  try {
    await client.delete(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'tenantId',
            match: { value: tenantId },
          },
        ],
      },
    });
  } catch (error) {
    console.error('Erro ao deletar embeddings do tenant no Qdrant:', error);
    throw error;
  }
}

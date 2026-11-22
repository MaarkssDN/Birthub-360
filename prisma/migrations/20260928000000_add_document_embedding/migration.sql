-- Migration: add_document_embedding
-- Data: 2026-09-28
-- Responsável: Agente 01
-- Onda: IA-1
-- Descrição: Adiciona tabela DocumentEmbedding para rastreamento de embeddings no Qdrant

-- Criar tabela DocumentEmbedding
CREATE TABLE "DocumentEmbedding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "vectorId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentEmbedding_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE INDEX "DocumentEmbedding_tenantId_documentId_idx" ON "DocumentEmbedding"("tenantId", "documentId");
CREATE INDEX "DocumentEmbedding_vectorId_idx" ON "DocumentEmbedding"("vectorId");

-- Comentário para documentação
COMMENT ON TABLE "DocumentEmbedding" IS 'Rastreamento de embeddings no Qdrant - mantém sincronia com PostgreSQL para deleção por tenant (GDPR) e metadados';

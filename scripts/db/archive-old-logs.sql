-- ==============================================================================
-- scripts/db/archive-old-logs.sql
-- Responsável: Agente 01A (Confiabilidade de Dados, RLS e Retenção)
-- Handoff: 00-para-01a-particionamento-retencao-logs.md (DIV-AGENTE-01A-002)
--
-- Estratégia de Particionamento e Otimização para Purga Assíncrona de Logs
-- ==============================================================================

-- 1. Índices parciais para aceleração de queries de purga sem onerar o índice geral:
-- Permite que a query `WHERE "createdAt" < cutoff` use um índice leve contendo apenas linhas candidatas.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_ailog_retention_old" 
ON "AILog" ("createdAt") 
WHERE "createdAt" < (CURRENT_DATE - INTERVAL '60 days');

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_bitrix_sync_log_retention_old" 
ON "BitrixSyncLog" ("createdAt") 
WHERE "createdAt" < (CURRENT_DATE - INTERVAL '45 days');

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_external_crm_sync_log_retention_old" 
ON "ExternalCrmSyncLog" ("createdAt") 
WHERE "createdAt" < (CURRENT_DATE - INTERVAL '45 days');

-- 2. Procedimento de Arquivamento/Expurgo Otimizado por Data (para execução em rotina cron noturna)
-- Executa DELETE em lotes de 1.000 linhas com CTID para evitar page locks prolongados:
CREATE OR REPLACE FUNCTION purge_old_ailogs(batch_limit INT DEFAULT 1000, days_retention INT DEFAULT 90)
RETURNS INT AS $$
DECLARE
    rows_deleted INT := 0;
    iteration_deleted INT := 0;
    cutoff_timestamp TIMESTAMPTZ := NOW() - (days_retention || ' days')::INTERVAL;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT id FROM "AILog"
            WHERE "createdAt" < cutoff_timestamp
            LIMIT batch_limit
        )
        DELETE FROM "AILog"
        WHERE id IN (SELECT id FROM candidates);

        GET DIAGNOSTICS iteration_deleted = ROW_COUNT;
        rows_deleted := rows_deleted + iteration_deleted;

        EXIT WHEN iteration_deleted < batch_limit;
        PERFORM pg_sleep(0.05); -- pausa de 50ms para ceder I/O
    END LOOP;

    RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql;

-- 3. Documentação de Particionamento Futuro Nativo (PostgreSQL Declarative Partitioning)
-- Para volumes superiores a 50M de registros por mês, recomenda-se particionar "AILog" por RANGE:
--
-- CREATE TABLE "AILog_partitioned" (
--     id TEXT NOT NULL,
--     tokens INT NOT NULL,
--     cost DOUBLE PRECISION NOT NULL,
--     latencyMs INT NOT NULL,
--     model TEXT NOT NULL,
--     promptId TEXT,
--     organizationId TEXT,
--     agentRole TEXT,
--     createdAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     PRIMARY KEY (id, createdAt)
-- ) PARTITION BY RANGE (createdAt);
--
-- Ao final do ciclo de retenção:
-- ALTER TABLE "AILog_partitioned" DETACH PARTITION "AILog_y2026m01" CONCURRENTLY;
-- DROP TABLE "AILog_y2026m01";

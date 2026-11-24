-- Migration Zero-Downtime (Agente 12 Vera / Squad 10 · DEM-20261123-001)
-- Escopo: expand-only — colunas nullable `deletedBy` (TEXT) e `deleteReason` (TEXT)
--         nos models Agent, AgentSession, CadenceSequence e Workflow.
-- Origem: proposta .agents/handoffs/squad-10/10-para-11-12-proposta-deletedby-deletereason.md
--         (Opção A endossada por Mara; schema correspondente = Agente 11 Pietro).
--
-- Segurança / B-05:
--   * ADD COLUMN nullable SEM default e SEM NOT NULL → PostgreSQL 11+ executa em
--     tempo constante (metadata-only), sem reescrita de tabela (sem table rewrite).
--   * `IF NOT EXISTS` torna a migration idempotente (segura em reexecução/branching).
--   * `lock_timeout = '3s'` evita espera indefinida por ACCESS EXCLUSIVE lock; se a
--     tabela estiver sob lock, a migration falha rápido e pode ser reexecutada.
--   * Compatível N/N-1 (expand/contract): versão anterior do código não referencia
--     as novas colunas; novas colunas ficam NULL em linhas existentes (sem backfill).
--   * NÃO é workaround para audit append-only: AuditLog (beforeState/afterState)
--     continua sendo a trilha de auditoria; estas colunas são apenas metadados
--     de soft-delete consumidos por `buildSoftDeleteData` (DMMF-driven).
--
-- Rollback (manual, somente se necessário — reversível e não destrutivo de dados):
--   ALTER TABLE "Agent"           DROP COLUMN IF EXISTS "deletedBy", DROP COLUMN IF EXISTS "deleteReason";
--   ALTER TABLE "AgentSession"    DROP COLUMN IF EXISTS "deletedBy", DROP COLUMN IF EXISTS "deleteReason";
--   ALTER TABLE "CadenceSequence" DROP COLUMN IF EXISTS "deletedBy", DROP COLUMN IF EXISTS "deleteReason";
--   ALTER TABLE "Workflow"        DROP COLUMN IF EXISTS "deletedBy", DROP COLUMN IF EXISTS "deleteReason";
--   ATENÇÃO: rollback só é seguro ANTES de qualquer escrita nessas colunas pelo
--   interceptor; após soft deletes popularem os campos, o DROP perde metadados.
--
-- Locks esperados: ACCESS EXCLUSIVE por microsegundos por tabela (metadata-only).
-- Riscos: baixos — nenhuma FK, índice, RLS ou constraint é tocada; tabelas já têm
--   RLS ENABLE/FORCE (ver migrations 20260816120000 e 20260925000000), inalterado.

SET lock_timeout = '3s';

ALTER TABLE "Agent"
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;

ALTER TABLE "AgentSession"
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;

ALTER TABLE "CadenceSequence"
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;

ALTER TABLE "Workflow"
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;

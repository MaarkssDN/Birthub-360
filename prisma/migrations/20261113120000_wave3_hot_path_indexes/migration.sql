-- Migration: 20261113120000_wave3_hot_path_indexes
-- Demanda: DEM-20261113-004 / MEL-17 (Onda 3, Agente 01)
-- Classificação (runbook docs/security/runbooks/MIGRATION_ROLLBACK.md): ADITIVA —
-- somente CREATE INDEX IF NOT EXISTS. Nenhuma linha existente é lida, alterada ou
-- removida; CREATE INDEX em Postgres toma lock SHARE que bloqueia escritas na tabela
-- durante a construção (sem CONCURRENTLY, mesmo padrão das migrations de índice
-- anteriores deste repo, ex.: 20261012000000_add_missing_rls_and_fk_indexes). Em
-- tabelas grandes (Lead/Activity/Company/Contact) a janela de bloqueio de escrita é
-- o custo conhecido — se o volume de produção exigir, aplicar manualmente com
-- CONCURRENTLY fora do `migrate deploy` (ver runbook) e depois marcar a migration
-- como aplicada via `prisma migrate resolve`.
--
-- Justificativa por índice (padrão de query real → índice), análise estática —
-- sem EXPLAIN ANALYZE contra banco de produção nesta onda:
--
-- 1. "Lead"("organizationId","funnel","pipelineId")
--    PrismaCrm360Repository.getBoardLeads/getDeals:
--      lead.findMany({ where: { organizationId, funnel, pipelineId? },
--                      orderBy: [probability desc, updatedAt desc] })
--    Nenhum índice existente cobria a tripla; (organizationId,funnel) e
--    (organizationId,pipelineId,pipelineStageId) deixavam o planner refinar linhas
--    a mais quando pipelineId está presente (board filtrado por pipeline).
--
-- 2. "Lead"("organizationId","status","funnel")
--    PrismaLeadRepository.findAllWithFilters: where { organizationId, status?,
--    funnel? } + PrismaCrm360Repository.getOverviewData (counts por
--    funnel/status). Cobre o par status+funnel sem refino extra sobre
--    (organizationId,status).
--
-- 3. "Activity"("organizationId","date")
--    PrismaActivityRepository.findRange/findAllWithFilters e
--    activity.service.findRange: where { organizationId, date: {gte,lt} }
--    orderBy date asc — agenda/calendário (mês inteiro numa query). Range scan
--    direto em vez de varrer o recorte da org.
--
-- 4. "Activity"("leadId","date")
--    PrismaLeadRepository.findById → include activities orderBy date desc:
--    filtra por leadId e ordena por date dentro do lead.
--
-- 5. "Note"("leadId","createdAt")
--    PrismaLeadRepository.findById → include internalNotes orderBy createdAt desc.
--
-- 6. "Company"("organizationId","createdAt")
--    PrismaCompanyRepository.findAll (fallback sem Meilisearch): where
--    { organizationId, deletedAt: null, ... } orderBy createdAt desc paginado.
--
-- 7. "Contact"("organizationId","createdAt")
--    PrismaContactRepository.findAll: idem — listagem paginada por createdAt desc.
--
-- Índices avaliados e NÃO criados (já cobertos ou baixo valor):
--   - TimelineEvent(leadId,createdAt): já existe (@@index no schema).
--   - CopilotoDealHealthSnapshot(organizationId,leadId,createdAt): já existe e
--     cobre a query distinct/orderBy de loadLatestForecastProbabilityAi.
--   - LeadStageHistory / LeadFieldChange: já indexados nos eixos usados.
--   - CrmPipelineStage(pipelineId,leadStatus): tabela pequena (dezenas de
--     linhas por pipeline), findFirst por leadStatus+pipelineId é trivial.
--   - Busca textual `contains insensitive` (fallback Postgres de Lead/Company/
--     Contact): ILIKE não usa btree; exigiria pg_trgm/GIN — fora do escopo
--     cirúrgico desta onda (Meilisearch é o caminho primário de busca).

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Lead_organizationId_funnel_pipelineId_idx" ON "Lead"("organizationId", "funnel", "pipelineId");
-- CreateIndex
CREATE INDEX IF NOT EXISTS "Lead_organizationId_status_funnel_idx" ON "Lead"("organizationId", "status", "funnel");
-- CreateIndex
CREATE INDEX IF NOT EXISTS "Activity_organizationId_date_idx" ON "Activity"("organizationId", "date");
-- CreateIndex
CREATE INDEX IF NOT EXISTS "Activity_leadId_date_idx" ON "Activity"("leadId", "date");
-- CreateIndex
CREATE INDEX IF NOT EXISTS "Note_leadId_createdAt_idx" ON "Note"("leadId", "createdAt");
-- CreateIndex
CREATE INDEX IF NOT EXISTS "Company_organizationId_createdAt_idx" ON "Company"("organizationId", "createdAt");
-- CreateIndex
CREATE INDEX IF NOT EXISTS "Contact_organizationId_createdAt_idx" ON "Contact"("organizationId", "createdAt");

-- ROLLBACK (manual, se necessário — migration aditiva, sem dados a preservar):
-- DROP INDEX IF EXISTS "Lead_organizationId_funnel_pipelineId_idx";
-- DROP INDEX IF EXISTS "Lead_organizationId_status_funnel_idx";
-- DROP INDEX IF EXISTS "Activity_organizationId_date_idx";
-- DROP INDEX IF EXISTS "Activity_leadId_date_idx";
-- DROP INDEX IF EXISTS "Note_leadId_createdAt_idx";
-- DROP INDEX IF EXISTS "Company_organizationId_createdAt_idx";
-- DROP INDEX IF EXISTS "Contact_organizationId_createdAt_idx";
-- Em ambiente com `prisma migrate` gerenciado: `prisma migrate resolve --rolled-back
-- 20261113120000_wave3_hot_path_indexes` após aplicar o SQL acima manualmente
-- (ver docs/security/runbooks/MIGRATION_ROLLBACK.md, Passo 1).

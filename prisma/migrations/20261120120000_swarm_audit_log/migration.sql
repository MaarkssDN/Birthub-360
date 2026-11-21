-- SwarmAuditLog — handoff .agents/handoffs/onda-1/14-para-01-swarm-audit-log-schema.md.
-- GET /api/agent/characters/activity retornava 500 porque a tabela nunca foi criada.
--
-- Classificação (runbook MIGRATION_ROLLBACK): ADITIVA — CREATE TABLE/INDEX/FK/RLS apenas, tabela
-- nova e vazia; nenhuma linha existente é lida/alterada; zero downtime (B-05: o código antigo
-- ignora a tabela; o serviço atual só passa a funcionar após a migração).
-- LGPD: "ipAddress" e "userAgent" são dado pessoal; retenção PENDENTE (decisão humana, 07/15).

CREATE TABLE "SwarmAuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "result" TEXT NOT NULL,
    "errorMessage" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "correlationId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwarmAuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SwarmAuditLog" ADD CONSTRAINT "SwarmAuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "SwarmAuditLog_organizationId_createdAt_idx" ON "SwarmAuditLog"("organizationId", "createdAt");

ALTER TABLE "SwarmAuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SwarmAuditLog" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "SwarmAuditLog";
CREATE POLICY "tenant_isolation" ON "SwarmAuditLog" AS PERMISSIVE FOR ALL TO public
    USING ("organizationId" = current_setting('app.current_tenant_id', true))
    WITH CHECK ("organizationId" = current_setting('app.current_tenant_id', true));

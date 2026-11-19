-- Canal público de solicitação DSR (LGPD art. 18) — handoff
-- `.agents/handoffs/21-para-01-dsr-canal-publico-lgpd.md` (Agente 21, W7).
--
-- Classificação (runbook MIGRATION_ROLLBACK): ADITIVA — CREATE TYPE/TABLE/INDEX/
-- FK/RLS apenas; nenhuma linha existente é lida, alterada ou removida.
--
-- Decisões de modelagem (espelham PublicLeadConsent, migration 20261111040000):
-- - e-mail do titular NÃO fica em claro: `emailEncrypted` (AES-256-GCM via
--   lib/crypto/secretFields) + `emailIndex` (blind index HMAC, contactEmailIndex)
--   para dedupe/lookup sem PII em WHEREs.
-- - token de verificação e token de status são guardados SOMENTE como SHA-256;
--   os valores em claro existem apenas no e-mail ao titular.
-- - RLS forçada por tenant: todas as rotas públicas resolvem a organização no
--   servidor (env LANDING_LEAD_ORGANIZATION_ID) e executam dentro de
--   requestContext tenant — mesmo padrão de publicLead.service.ts.

CREATE TYPE "DataSubjectRightType" AS ENUM ('ACCESS', 'PORTABILITY', 'CORRECTION', 'ERASURE', 'CONSENT_REVOCATION', 'SHARING_INFO');
CREATE TYPE "DataSubjectRequestStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "rightType" "DataSubjectRightType" NOT NULL,
    "status" "DataSubjectRequestStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "emailEncrypted" TEXT NOT NULL,
    "emailIndex" TEXT NOT NULL,
    "contactId" TEXT,
    "verificationTokenHash" TEXT,
    "verificationExpiresAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "statusTokenHash" TEXT NOT NULL,
    "resultSummary" JSONB,
    "preferredChannel" TEXT,
    "detailsEncrypted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "DataSubjectRequest_protocol_key" ON "DataSubjectRequest"("protocol");
CREATE UNIQUE INDEX "DataSubjectRequest_statusTokenHash_key" ON "DataSubjectRequest"("statusTokenHash");
CREATE INDEX "DataSubjectRequest_organizationId_emailIndex_idx" ON "DataSubjectRequest"("organizationId", "emailIndex");
CREATE INDEX "DataSubjectRequest_organizationId_status_idx" ON "DataSubjectRequest"("organizationId", "status");

ALTER TABLE "DataSubjectRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DataSubjectRequest" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "DataSubjectRequest";
CREATE POLICY "tenant_isolation" ON "DataSubjectRequest" AS PERMISSIVE FOR ALL TO public
    USING ("organizationId" = current_setting('app.current_tenant_id', true))
    WITH CHECK ("organizationId" = current_setting('app.current_tenant_id', true));

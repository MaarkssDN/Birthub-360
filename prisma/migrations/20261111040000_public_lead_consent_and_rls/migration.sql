-- Captura pública de lead da landing 360°: prova de consentimento LGPD
-- (texto + versão + timestamp) isolada por tenant, com RLS forçada.
-- NÃO aplicar em produção sem o OK explícito do Marcelo.

CREATE TABLE "PublicLeadConsent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "termsVersion" TEXT NOT NULL,
    "termsText" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicLeadConsent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PublicLeadConsent" ADD CONSTRAINT "PublicLeadConsent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicLeadConsent" ADD CONSTRAINT "PublicLeadConsent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "PublicLeadConsent_organizationId_idx" ON "PublicLeadConsent"("organizationId");
CREATE INDEX "PublicLeadConsent_organizationId_leadId_idx" ON "PublicLeadConsent"("organizationId", "leadId");
CREATE INDEX "PublicLeadConsent_leadId_idx" ON "PublicLeadConsent"("leadId");

ALTER TABLE "PublicLeadConsent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PublicLeadConsent" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "PublicLeadConsent";
CREATE POLICY "tenant_isolation" ON "PublicLeadConsent" AS PERMISSIVE FOR ALL TO public
    USING ("organizationId" = current_setting('app.current_tenant_id', true))
    WITH CHECK ("organizationId" = current_setting('app.current_tenant_id', true));

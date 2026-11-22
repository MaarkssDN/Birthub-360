-- RLS for LeadTouchpoint
CREATE TABLE IF NOT EXISTS "LeadTouchpoint" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channel" TEXT,
    "campaign" TEXT,
    "source" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "LeadTouchpoint_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LeadTouchpoint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadTouchpoint" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "LeadTouchpoint";
CREATE POLICY "tenant_isolation" ON "LeadTouchpoint" AS PERMISSIVE FOR ALL TO public
    USING ("organizationId" = current_setting('app.current_tenant_id', true))
    WITH CHECK ("organizationId" = current_setting('app.current_tenant_id', true));

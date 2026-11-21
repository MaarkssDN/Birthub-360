-- Migration Zero-Downtime (Onda 2 / Agente 11 Pietro + Agente 12 Vera)
-- 1. Expand: colunas nullable instantâneas em TimelineEvent (PostgreSQL 11+ sem table rewrite)
SET lock_timeout = '3s';

ALTER TABLE "TimelineEvent"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;

-- 2. Índices compostos para listagens ativas com filtro deletedAt IS NULL
CREATE INDEX IF NOT EXISTS "Activity_organizationId_deletedAt_date_idx"
  ON "Activity"("organizationId", "deletedAt", "date");

CREATE INDEX IF NOT EXISTS "Activity_leadId_deletedAt_date_idx"
  ON "Activity"("leadId", "deletedAt", "date");

CREATE INDEX IF NOT EXISTS "TimelineEvent_leadId_deletedAt_createdAt_idx"
  ON "TimelineEvent"("leadId", "deletedAt", "createdAt");

-- 3. Troca de ON DELETE CASCADE -> ON DELETE RESTRICT sem lock prolongado (NOT VALID + VALIDATE CONSTRAINT)
ALTER TABLE "Activity" DROP CONSTRAINT IF EXISTS "Activity_leadId_fkey";
ALTER TABLE "Activity"
  ADD CONSTRAINT "Activity_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Activity" VALIDATE CONSTRAINT "Activity_leadId_fkey";

ALTER TABLE "Activity" DROP CONSTRAINT IF EXISTS "Activity_organizationId_fkey";
ALTER TABLE "Activity"
  ADD CONSTRAINT "Activity_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Activity" VALIDATE CONSTRAINT "Activity_organizationId_fkey";

ALTER TABLE "TimelineEvent" DROP CONSTRAINT IF EXISTS "TimelineEvent_leadId_fkey";
ALTER TABLE "TimelineEvent"
  ADD CONSTRAINT "TimelineEvent_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "TimelineEvent" VALIDATE CONSTRAINT "TimelineEvent_leadId_fkey";

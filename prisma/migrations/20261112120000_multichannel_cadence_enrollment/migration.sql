-- Cadência Multicanal Adaptativa: persistência durável de enrollments.
-- Handoff 07→00 (repasse ao 01, dono de src/shared + schema):
-- `.agents/handoffs/onda-00/07-para-00-automation-dryrun-sandbox.md` item 3 —
-- `sharedCadenceEnrollmentsStore` era um Map em memória por processo: enrollments se perdiam em
-- restart/deploy e divergiam entre réplicas. Contrato:
-- `src/shared/contracts/multichannelCadence.contract.ts`; store:
-- `src/shared/infra/PrismaMultichannelCadenceEnrollmentStore.ts`.
-- Classificação (runbook MIGRATION_ROLLBACK): ADITIVA — CREATE TYPE/TABLE/INDEX/FK/RLS apenas;
-- nenhuma linha existente é lida, alterada ou removida. Rollback = DROP TABLE/TYPE (ver bloco ao
-- final).

-- CreateEnum
CREATE TYPE "MultichannelCadenceEnrollmentStatus" AS ENUM ('Active', 'Completed', 'Paused', 'OptedOut', 'Failed');

-- CreateTable
CREATE TABLE "MultichannelCadenceEnrollment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cadenceId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "status" "MultichannelCadenceEnrollmentStatus" NOT NULL DEFAULT 'Active',
    "enrolledAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActionAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MultichannelCadenceEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MultichannelCadenceEnrollment_organizationId_leadId_idx" ON "MultichannelCadenceEnrollment"("organizationId", "leadId");
-- CreateIndex
CREATE INDEX "MultichannelCadenceEnrollment_organizationId_status_idx" ON "MultichannelCadenceEnrollment"("organizationId", "status");
-- CreateIndex
CREATE INDEX "MultichannelCadenceEnrollment_organizationId_cadenceId_idx" ON "MultichannelCadenceEnrollment"("organizationId", "cadenceId");

-- AddForeignKey
ALTER TABLE "MultichannelCadenceEnrollment" ADD CONSTRAINT "MultichannelCadenceEnrollment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: tenant_isolation estrito, FORCE, sem cláusula de bypass (padrão 01A pós-20260825120000).

ALTER TABLE "MultichannelCadenceEnrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MultichannelCadenceEnrollment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "MultichannelCadenceEnrollment";
CREATE POLICY "tenant_isolation" ON "MultichannelCadenceEnrollment" AS PERMISSIVE FOR ALL TO public
    USING ("organizationId" = current_setting('app.current_tenant_id', true))
    WITH CHECK ("organizationId" = current_setting('app.current_tenant_id', true));

-- ROLLBACK (manual, se necessário — migration aditiva, sem dados a preservar além da tabela nova):
-- DROP POLICY IF EXISTS "tenant_isolation" ON "MultichannelCadenceEnrollment";
-- ALTER TABLE "MultichannelCadenceEnrollment" DISABLE ROW LEVEL SECURITY;
-- DROP TABLE "MultichannelCadenceEnrollment";
-- DROP TYPE "MultichannelCadenceEnrollmentStatus";
-- Em ambiente com `prisma migrate` gerenciado: `prisma migrate resolve --rolled-back <name>` após
-- aplicar o SQL acima manualmente (ver docs/security/runbooks/MIGRATION_ROLLBACK.md).

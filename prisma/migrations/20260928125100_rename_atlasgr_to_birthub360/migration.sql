-- Rename Enum values
ALTER TYPE "LeadStatus" RENAME VALUE 'Piloto Atlas Profile' TO 'Piloto Birthub 360 Profile';
ALTER TYPE "LeadStatus" RENAME VALUE 'Piloto Atlas Profile - Concluído' TO 'Piloto Birthub 360 Profile - Concluído';
ALTER TYPE "LeadStatus" RENAME VALUE 'Piloto Atlas Profile - Cancelado' TO 'Piloto Birthub 360 Profile - Cancelado';

-- Rename Table
ALTER TABLE "AtlasGRCallResult" RENAME TO "Birthub360CallResult";

-- Rename constraints and indices if needed (Prisma will drop/recreate them if necessary, but this is a manual migration)
ALTER TABLE "Birthub360CallResult" RENAME CONSTRAINT "AtlasGRCallResult_pkey" TO "Birthub360CallResult_pkey";
ALTER INDEX "AtlasGRCallResult_callId_key" RENAME TO "Birthub360CallResult_callId_key";
ALTER INDEX "AtlasGRCallResult_organizationId_idx" RENAME TO "Birthub360CallResult_organizationId_idx";
ALTER INDEX "AtlasGRCallResult_leadId_idx" RENAME TO "Birthub360CallResult_leadId_idx";

ALTER TABLE "Birthub360CallResult" RENAME CONSTRAINT "AtlasGRCallResult_organizationId_fkey" TO "Birthub360CallResult_organizationId_fkey";

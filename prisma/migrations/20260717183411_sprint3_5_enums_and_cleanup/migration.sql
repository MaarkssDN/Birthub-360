/*
  Warnings:

  - The `status` column on the `Activity` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Company` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Contact` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `fitScore` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `segment` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Lead` table. All the data in the column will be lost.
  - The `status` column on the `Lead` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `temperature` column on the `Lead` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `Activity` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
DROP TYPE IF EXISTS "CompanyStatus" CASCADE;
CREATE TYPE "CompanyStatus" AS ENUM ('Ativo', 'Inativo', 'Em análise');

-- CreateEnum
DROP TYPE IF EXISTS "ContactStatus" CASCADE;
CREATE TYPE "ContactStatus" AS ENUM ('Ativo', 'Inativo');

-- CreateEnum
DROP TYPE IF EXISTS "LeadStatus" CASCADE;
CREATE TYPE "LeadStatus" AS ENUM ('Novo Lead', 'Qualificação', 'Primeiro Contato', 'Diagnóstico', 'Proposta', 'Negociação', 'Fechado Ganho', 'Fechado Perdido');

-- CreateEnum
DROP TYPE IF EXISTS "LeadTemperature" CASCADE;
CREATE TYPE "LeadTemperature" AS ENUM ('Frio', 'Morno', 'Quente');

-- CreateEnum
DROP TYPE IF EXISTS "ActivityType" CASCADE;
CREATE TYPE "ActivityType" AS ENUM ('Ligação', 'WhatsApp', 'E-mail', 'Reunião', 'Follow-up', 'Visita', 'Tarefa');

-- CreateEnum
DROP TYPE IF EXISTS "ActivityStatus" CASCADE;
CREATE TYPE "ActivityStatus" AS ENUM ('Pendente', 'Em andamento', 'Concluída', 'Cancelada');

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Activity" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Activity" ALTER COLUMN "type" TYPE "ActivityType" USING "type"::"text"::"ActivityType";
ALTER TABLE "Activity" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Activity" ALTER COLUMN "status" TYPE "ActivityStatus" USING "status"::"text"::"ActivityStatus";
ALTER TABLE "Activity" ALTER COLUMN "status" SET DEFAULT 'Pendente';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Company" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Company" ALTER COLUMN "status" TYPE "CompanyStatus" USING "status"::"text"::"CompanyStatus";
ALTER TABLE "Company" ALTER COLUMN "status" SET DEFAULT 'Ativo';

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Contact" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Contact" ALTER COLUMN "status" TYPE "ContactStatus" USING "status"::"text"::"ContactStatus";
ALTER TABLE "Contact" ALTER COLUMN "status" SET DEFAULT 'Ativo';

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "fitScore",
DROP COLUMN "location",
DROP COLUMN "name",
DROP COLUMN "notes",
DROP COLUMN "segment",
DROP COLUMN "size",
ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Lead" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Lead" ALTER COLUMN "status" TYPE "LeadStatus" USING "status"::"text"::"LeadStatus";
ALTER TABLE "Lead" ALTER COLUMN "status" SET DEFAULT 'Novo Lead';
ALTER TABLE "Lead" ALTER COLUMN "temperature" DROP DEFAULT;
ALTER TABLE "Lead" ALTER COLUMN "temperature" TYPE "LeadTemperature" USING "temperature"::"text"::"LeadTemperature";

-- CreateIndex
CREATE INDEX "Activity_organizationId_idx" ON "Activity"("organizationId");

-- CreateIndex
CREATE INDEX "Company_organizationId_idx" ON "Company"("organizationId");

-- CreateIndex
CREATE INDEX "Company_cnpj_idx" ON "Company"("cnpj");

-- CreateIndex
CREATE INDEX "Company_legalName_idx" ON "Company"("legalName");

-- CreateIndex
CREATE INDEX "Contact_organizationId_idx" ON "Contact"("organizationId");

-- CreateIndex
CREATE INDEX "Lead_organizationId_idx" ON "Lead"("organizationId");

-- CreateIndex
CREATE INDEX "Lead_organizationId_status_idx" ON "Lead"("organizationId", "status");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

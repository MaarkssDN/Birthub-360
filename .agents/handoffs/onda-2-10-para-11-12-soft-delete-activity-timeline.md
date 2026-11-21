# Handoff: 11 (Pietro) & 12 (Vera) — Soft Delete e `onDelete: Restrict` em `Activity` e `TimelineEvent`

- **Agente emissor:** 10 — Mara (Coordenador de Dados & Persistência)
- **Destinatários:** 11 — Pietro (`prisma/schema.prisma`), 12 — Vera (`prisma/migrations/**`), Aprovação Humana (00 — Astra)
- **Onda / Branch:** Onda 2 · `agente/10-onda2-dados-qa`
- **Status:** PROPOSTA — **schema não alterado** (bloqueador exclusivo Pietro 11 + Vera 12 conforme `AGENTS.md` §14 e `prisma/migrations/MIGRATION_ZERO_DOWNTIME_CHECKLIST.md`)

---

## 1. Diagnóstico do estado atual (`prisma/schema.prisma` linhas 750–800)

1. **`Activity` (linhas 750–785)**
   - **Já possui** os campos de soft delete: `deletedAt DateTime?`, `deletedBy String?`, `deleteReason String?` (linhas 769–771).
   - **Porém**, as FKs ainda estão com `onDelete: Cascade`:
     - `lead Lead @relation(fields: [leadId], references: [id], onDelete: Cascade)` (linha 760)
     - `organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)` (linha 765)
   - Além disso, `PrismaActivityRepository.delete` (`src/features/activities/infra/PrismaActivityRepository.ts:197`) ainda executa `prisma.activity.delete({ where: { id } })` (hard delete) e as leituras (`findAllPaginated`, `findRange`, `findAllWithFilters`) não filtram `deletedAt: null`.

2. **`TimelineEvent` (linhas 787–799)**
   - **Não possui** `deletedAt` nem `organizationId` próprio.
   - FK com cascade: `lead Lead @relation(fields: [leadId], references: [id], onDelete: Cascade)` (linha 793).
   - Um hard delete acidental de `Lead` apaga em cascata toda a trilha histórica comercial (`Activity` e `TimelineEvent`), violando rastreabilidade e auditoria (Agente 18 — Ayla).

---

## 2. Alterações propostas em `prisma/schema.prisma` (Agente 11 — Pietro)

```prisma
model Activity {
  // ... campos existentes ...
  leadId         String
  lead           Lead         @relation(fields: [leadId], references: [id], onDelete: Restrict)
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?
  deletedBy    String?
  deleteReason String?

  // Índices existentes mantidos + índice parcial/composto para listagens ativas:
  @@index([organizationId, deletedAt, date])
  @@index([leadId, deletedAt, date])
}

model TimelineEvent {
  id          String    @id @default(cuid())
  type        String
  description String

  leadId      String
  lead        Lead      @relation(fields: [leadId], references: [id], onDelete: Restrict)

  createdAt    DateTime  @default(now())
  deletedAt    DateTime?
  deletedBy    String?
  deleteReason String?

  @@index([leadId])
  @@index([leadId, createdAt])
  @@index([leadId, deletedAt, createdAt])
}
```

---

## 3. Plano de migração Zero-Downtime em 2 fases (Agente 12 — Vera)

Seguindo `prisma/migrations/MIGRATION_ZERO_DOWNTIME_CHECKLIST.md` (Expand → Migrate/Deploy → Contract):

### Fase 1 — Expand & Soft Delete no código (compatível com versão N e N-1)
1. **Migration SQL 1 (`expand_timeline_soft_delete_and_indexes`):**
   - `ALTER TABLE "TimelineEvent" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "deletedBy" TEXT, ADD COLUMN IF NOT EXISTS "deleteReason" TEXT;` (metadados instantâneos no PostgreSQL 11+, sem `DEFAULT` não-nulo, zero table rewrite).
   - `CREATE INDEX CONCURRENTLY IF NOT EXISTS "Activity_organizationId_deletedAt_date_idx" ON "Activity"("organizationId", "deletedAt", "date");`
   - `CREATE INDEX CONCURRENTLY IF NOT EXISTS "TimelineEvent_leadId_deletedAt_createdAt_idx" ON "TimelineEvent"("leadId", "deletedAt", "createdAt");`
2. **Código de aplicação (Squad 40 / Agente 45 Otto + Agente 41 Cadu):**
   - `PrismaActivityRepository.delete` passa a fazer `prisma.activity.update({ where: { id }, data: { deletedAt: new Date() } })`.
   - `PrismaActivityRepository` (`findAllPaginated`, `findRange`, `findAllWithFilters`) e `PrismaLeadRepository` (`include: { activities: { where: { deletedAt: null } }, timeline: { where: { deletedAt: null } } }`) passam a filtrar `deletedAt: null`.
   - Qualquer fluxo de exclusão de `Lead` faz soft delete em transação (`lead.deletedAt`, `activity.updateMany`, `timelineEvent.updateMany`) antes de eventual expurgo LGPD (Agente 15 — Olavo).

### Fase 2 — Troca de FK `CASCADE` → `RESTRICT` sem lock longo
1. **Pré-check:** confirmar em produção/staging que nenhum fluxo de negócio executa `DELETE FROM "Lead"` sem antes expurgar ou arquivar dependentes (exceto job de expurgo LGPD do Agente 15, que deve deletar filhos explicitamente na ordem `TimelineEvent` → `Activity` → `Lead`).
2. **Migration SQL 2 (`restrict_activity_timeline_fks`):**
   - No PostgreSQL, recriar a FK com `NOT VALID` + `VALIDATE CONSTRAINT` evita `ACCESS EXCLUSIVE` prolongado durante a varredura:
     ```sql
     SET lock_timeout = '3s';

     ALTER TABLE "Activity" DROP CONSTRAINT "Activity_leadId_fkey",
       ADD CONSTRAINT "Activity_leadId_fkey"
       FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
       ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
     ALTER TABLE "Activity" VALIDATE CONSTRAINT "Activity_leadId_fkey";

     ALTER TABLE "TimelineEvent" DROP CONSTRAINT "TimelineEvent_leadId_fkey",
       ADD CONSTRAINT "TimelineEvent_leadId_fkey"
       FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
       ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
     ALTER TABLE "TimelineEvent" VALIDATE CONSTRAINT "TimelineEvent_leadId_fkey";
     ```
3. **Rollback:** reexecutar o mesmo bloco com `ON DELETE CASCADE NOT VALID` + `VALIDATE CONSTRAINT` (instantâneo, sem perda de dados).

-- Correção de drift TIMESTAMPTZ(3) → TIMESTAMP(3) em MultichannelCadenceEnrollment.
--
-- A migration 20261112120000_multichannel_cadence_enrollment criou enrolledAt/lastActionAt/
-- createdAt/updatedAt como TIMESTAMPTZ(3), mas o schema Prisma (model
-- MultichannelCadenceEnrollment, campos DateTime simples, sem @db.Timestamptz) espera
-- TIMESTAMP(3). Isso fazia o gate `verify:migration-drift` (`prisma migrate diff
-- --from-config-datasource --to-schema`) falhar em main com 4 "type changed".
--
-- O arquivo original NÃO foi editado (já aplicado; checksum do _prisma_migrations).
--
-- Classificação (runbook MIGRATION_ROLLBACK, Passo 0): ALTER COLUMN ... TYPE com
-- conversão = DESTRUTIVA-ish — perde a informação de fuso da coluna. É seguro aqui
-- porque os valores foram sempre gravados em UTC (Prisma lê/escreve DateTime como UTC) e
-- o fuso armazenado é sempre 'UTC'. A conversão usa `USING "col" AT TIME ZONE 'UTC'`:
-- timestamptz → timestamp interpretando o instante em UTC, preservando o valor exato.
--
-- Auditoria das demais migrations com TIMESTAMPTZ (20261020210000, 20261020220000,
-- 20261020230000, 20261020240000, 20261027180000): todas as colunas TIMESTAMPTZ delas
-- correspondem a campos DateTime com `@db.Timestamptz(3)` no schema (ConsentAuditRecord,
-- ConsentAuditChainHead, FlywheelApproachRecord, RebalanceApproval, FlywheelFewShotExample,
-- TenantKeyEnvelope, DomainEventOutbox, DomainEventConsumption) — NÃO driftam. Apenas
-- MultichannelCadenceEnrollment estava divergente.

ALTER TABLE "MultichannelCadenceEnrollment"
    ALTER COLUMN "enrolledAt" TYPE TIMESTAMP(3) USING "enrolledAt" AT TIME ZONE 'UTC',
    ALTER COLUMN "lastActionAt" TYPE TIMESTAMP(3) USING "lastActionAt" AT TIME ZONE 'UTC',
    ALTER COLUMN "createdAt" TYPE TIMESTAMP(3) USING "createdAt" AT TIME ZONE 'UTC',
    ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- ROLLBACK: reverter para TIMESTAMPTZ(3) preservando o instante (valores em UTC):
-- ALTER TABLE "MultichannelCadenceEnrollment"
--     ALTER COLUMN "enrolledAt" TYPE TIMESTAMPTZ(3) USING "enrolledAt" AT TIME ZONE 'UTC',
--     ALTER COLUMN "lastActionAt" TYPE TIMESTAMPTZ(3) USING "lastActionAt" AT TIME ZONE 'UTC',
--     ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
--     ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
-- A informação de fuso original não é recuperável (era sempre UTC); os instantes são
-- preservados. Após aplicar o SQL manual, registrar com
-- `prisma migrate resolve --rolled-back 20261114120000_fix_cadence_enrollment_timestamp_tz`
-- — ver docs/security/runbooks/MIGRATION_ROLLBACK.md.

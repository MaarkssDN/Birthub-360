# Política de Migrações Não-Destrutivas (Expand -> Migrate -> Contract) — BirthHub 360

## 1. Princípio Fundamental de Zero Downtime
Em ambientes corporativos de alta disponibilidade (Enterprise SaaS Multi-Tenant), operações que removem colunas, tabelas ou modificam tipos bruscamente causam locks de tabela e falhas em instâncias da aplicação que estejam rodando a versão anterior durante deploys progressivos (Canary / Blue-Green).

Toda alteração de esquema no BirthHub 360 deve obedecer estritamente à estratégia **Expand -> Migrate -> Contract**:

1. **Fase 1: Expand (Expansão)**:
   - Adicionar novas colunas como opcionais (`nullable`) ou com valores `default`.
   - Adicionar novas tabelas com RLS habilitado na mesma migração (`ENABLE` + `FORCE ROW LEVEL SECURITY`).
   - Manter colunas antigas ativas.
2. **Fase 2: Migrate (Migração / Dual-Write)**:
   - A aplicação lê e escreve no formato novo, mantendo compatibilidade ou migrando dados em background.
   - Deploys de aplicação rodam sem indisponibilidade de dados.
3. **Fase 3: Contract (Contração)**:
   - Somente após 100% dos serviços estarem rodando com a nova versão e os dados migrados, colunas e tabelas obsoletas podem ser marcadas para depreciação e, eventualmente, removidas em janelas programadas.

---

## 2. Inventário e Congelamento das 15 Migrações Históricas
Durante a auditoria de Tech Debt de 2026-09-29, foram identificadas 15 migrações contendo instruções `DROP TABLE` ou `ALTER TABLE ... DROP`. 
Todas já foram aplicadas e consolidadas nos bancos de dados de homologação e produção. O histórico é **congelado e imutável** para garantir reprodutibilidade em `prisma migrate deploy`:

1. `20260717141021_add_lead_enrichment` — ALTER TABLE "User" DROP
2. `20260717183411_sprint3_5_enums_and_cleanup` — ALTER TABLE "Activity" ALTER COLUMN "type" DROP
3. `20260720235926_sync_accumulated_schema_drift` — ALTER TABLE "User" DROP
4. `20260721113210_user_passwordhash_optional` — ALTER TABLE "user" ALTER COLUMN "passwordHash" DROP
5. `20260804203000_bitrix_sync_rule_lead_source` — ALTER TABLE "BitrixSyncRule" ALTER COLUMN "categoryId" DROP
6. `20260805220000_two_funnels_and_bitrix_fields` — ALTER TABLE "public"."Lead" ALTER COLUMN "status" DROP
7. `20260810130000_remove_knowledge_document` — DROP TABLE
8. `20260817134959_onda11_db_cleanup` — ALTER TABLE "CallSuppression" DROP
9. `20260827200000_drop_dead_ai_governance_models` — DROP TABLE
10. `20260828040000_drop_contact_pii_hash_dec01_superseded` — DROP COLUMN
11. `20260908020000_multi_cargo_agent_governance_foundation` — DROP TABLE
12. `20260908090000_public_booking_link_create_and_rls` — DROP TABLE
13. `20260909131444_saved_view` — DROP TABLE
14. `20260913000100_notes_cross_entity_and_attachments` — ALTER TABLE "Company" DROP
15. `20260918151000_remove_legacy_nba_shadow_domain` — DROP TABLE

---

## 3. Regras para Novas Migrações
A partir da Fase 1 do programa Enterprise Production-Ready:
- Qualquer nova migração contendo `DROP TABLE`, `DROP COLUMN` ou quebras retroativas é **bloqueada automaticamente** pelo gate `scripts/db/check-migration-safety.ts`, **a menos que** o `migration.sql` contenha o bloco `-- ROLLBACK:` exigido pelo runbook `docs/security/runbooks/MIGRATION_ROLLBACK.md` (Passo 4) — nesse caso o gate automatizado aprova e a exceção segue o fluxo de aprovação abaixo.
- O gate roda no CI em `.github/workflows/migration-safety.yml` em todo PR que toque `prisma/migrations/**` ou `prisma/schema.prisma`. Teste local: `npx tsx scripts/db/check-migration-safety.ts`.
- Exceções excepcionais exigem:
  - Justificativa técnica formal documentada.
  - Script de migração reversa (Rollback).
  - Snapshot / backup de dados validado previamente.
  - Aprovação do Arquiteto de Software e DBA/Agente de Confiabilidade de Dados.

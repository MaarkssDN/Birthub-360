# Relatório — Agente 01, Onda 3 (DEM-20261113-004)

- **Branch:** `agente/01-onda3-banco` (worktree `agente-01-onda3-banco`)
- **Base:** `integracao/onda-3` = origin/main recente
- **Data:** 2026-11-13/14

## MEL-17 — Índices em queries quentes ✅

**Entrega:** migration aditiva `prisma/migrations/20261113120000_wave3_hot_path_indexes/migration.sql`
+ 7 `@@index` em `prisma/schema.prisma`.

**Índices criados** (justificativa completa no cabeçalho do migration.sql):

| Índice | Query real que motiva |
|---|---|
| `Lead(organizationId, funnel, pipelineId)` | `PrismaCrm360Repository.getBoardLeads/getDeals` — board Kanban `{org, funnel, pipelineId?}` orderBy probability/updatedAt |
| `Lead(organizationId, status, funnel)` | `PrismaLeadRepository.findAllWithFilters` + `getOverviewData` — `{org, status?, funnel?}` |
| `Activity(organizationId, date)` | `PrismaActivityRepository.findRange/findAllWithFilters`, `activity.service.findRange` — agenda `{org, date gte/lt}` orderBy date |
| `Activity(leadId, date)` | `Lead.findById` include activities orderBy date desc |
| `Note(leadId, createdAt)` | `Lead.findById` include internalNotes orderBy createdAt desc |
| `Company(organizationId, createdAt)` | `PrismaCompanyRepository.findAll` — listagem paginada `{org, deletedAt:null}` orderBy createdAt desc |
| `Contact(organizationId, createdAt)` | `PrismaContactRepository.findAll` — idem |

**Análise estática honesta:** não havia banco de produção disponível para EXPLAIN ANALYZE;
a justificativa é por padrão de query real (where/orderBy dos repositories) cruzado com os
índices existentes. Índices avaliados e rejeitados estão documentados no migration.sql
(TimelineEvent/CopilotoDealHealthSnapshot/LeadStageHistory já cobertos; CrmPipelineStage
tabela pequena; ILIKE fallback fora de escopo).

**Padrão de migration:** segui o padrão do repo — `CREATE INDEX IF NOT EXISTS` simples
(sem `CONCURRENTLY`, igual a `20261012000000_add_missing_rls_and_fk_indexes`), cabeçalho
classificando como **ADITIVA** (runbook MIGRATION_ROLLBACK) e bloco `-- ROLLBACK:`
comentado ao final. Sem `migrate dev/push` executado — só arquivos escritos.

## MEL-18 — Decisão split do schema.prisma ✅ (somente decisão)

**Entrega:** `.agents/runs/onda-3/01-mel18-decisao-split-schema.md`.

**Recomendação: NÃO executar agora; viável e adiar para onda dedicada.**

Fatores-chave: multi-file schema é GA desde Prisma 6.7 e o projeto está em 7.10 — suporte
confirmado, mas exige `schema: 'prisma'` (diretório) em `prisma.config.ts` e spike de
validação (bug conhecido prisma/prisma#28673 no 7.0.0). O split quebra/atualiza ≥7
consumidores que leem `prisma/schema.prisma` como texto (3 scripts de segurança/LGPD,
3 testes, `package.json` `verify:migration-drift` — este último exige aprovação do 00,
workflow de CI, `prisma/AGENTS.md`). Benefício é de ergonomia/revisão, não correção de bug.
Plano completo de 7 passos no documento.

## MEL-20 — Teste de isolamento tenant-prisma ✅

**Entrega:** `tests/unit/lib/tenant-isolation-guard.test.ts` (13 testes, todos verdes).

Cobre lacunas que `tenant-scoping-parity.test.ts` (drift entre camadas) e
`prisma-interceptors.unit.test.ts` (interceptores puros) não cobriam:

- `withTenantContext`/`runWithContext`/`requestContext` — fail-closed sem tenant
  (`TenantContextMissingError`), store correto, nada vaza para fora do contexto.
- `getTenantPrisma` com `@/lib/prisma` mockado: injeta `organizationId` no `where` de
  reads (findMany/count/aggregate/groupBy/findFirst) e writes de models COM a coluna;
  pass-through em model global (FeatureFlag); create sobrescreve organizationId do
  payload; update/upsert removem organizationId do data (guarda anti-troca-de-tenant).

**Gap documentado (não alterado — fora do escopo cirúrgico):** `runWithContext` não
valida presença de tenant (diferente de `withTenantContext`). A contenção real nesse
caso fica na RLS do Postgres (FORCE + `app.current_tenant_id` unset → zero linhas).
Teste registra o comportamento atual; se quiserem endurecer para fail-fast na app,
é decisão de design a registrar em handoff futuro.

## Gates executados

| Gate | Resultado |
|---|---|
| `npx prisma validate` | ✅ schema válido |
| `npx prisma generate` | ✅ client 7.10.0 gerado |
| `npx tsc --noEmit` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 (1520 warnings pré-existentes, nenhum novo — arquivos tocados são .prisma/.sql/.md/.test.ts fora do escopo do biome `src`) |
| `vitest` tenant-isolation-guard + parity + interceptors | ✅ 38/38 |
| `vitest` tests/unit/db + reencryptTargetsContract | ✅ 33/33 |

**Não executado (proibido/fora de escopo):** `migrate dev`/`push`/`deploy`, push, merge.

## Commits

1. `937c6e8a0` feat(db): MEL-17 índices em queries quentes
2. `361c14e2d` docs(agentes): MEL-18 decisão split schema
3. `7ce5dd80d` test(tenancy): MEL-20 regressão isolamento tenant-prisma
(+ commit final com relatório/handoff)

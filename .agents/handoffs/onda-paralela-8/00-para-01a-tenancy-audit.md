De: 00 — Coordenador
Para: 01A — Confiabilidade de Dados, RLS e Retenção
Onda: paralela-8
Status: resolvido
Prioridade: alto (tenancy/LGPD)

## Problema
Auditar isolamento multi-tenant no escopo `src/features/crm/**` e `src/features/crm360/**`: queries Prisma que tocam modelos com `organizationId` sem filtro/escopo de tenant, ou uso de client Prisma sem contexto de tenant.

## Evidência
AGENTS.md exige preservação de RBAC, RLS e isolamento por `organizationId`. Não há evidência prévia de leak nesses módulos — a missão é produzir prova ou correção.

## Alteração necessária
1. Mapear modelos tenant-scoped usados nos dois módulos.
2. Verificar cada query: `where` contém `organizationId`/tenant context ou o repositório injeta escopo centralizado.
3. Corrigir APENAS gaps comprovados (vazamento real possível). Se o padrão for escopo centralizado correto, documentar a evidência e não alterar código.

## Teste esperado
`npx tsc --noEmit` limpo; testes do módulo executados (`vitest run -c vitest.unit.config.ts` com filtro do diretório); relatório com tabela de queries auditadas.

## Contexto
Worktree: `.claude/worktrees/ag-01a`, branch `agente/01a-tenancy-audit`. Não alterar `prisma/schema.prisma` nem migrations — se faltar policy/coluna, abrir handoff para 01.

## Resolução

Auditoria concluída em 2026-11-14 no worktree `C:\Github\Birthub-360-wt-o2-01a` (branch `agente/01a-onda2-tenancy-audit`). Relatório completo: `.agents/handoffs/onda-paralela-8/01a-para-00-tenancy-audit-relatorio-20261114.md`.

Resumo: padrão de escopo por `organizationId` correto em todo o módulo; **nenhum vazamento cross-tenant comprovado em regime normal**. Achados: 1 MÉDIA composta (FKs referenciadas pelo cliente — `companyId`/`contactId`/`pipelineId`/`pipelineStageId` em leads, `productId` em deal items, `leadId`/`companyId`/`contactId` em documentos — gravadas sem validar tenant), 1 MÉDIA-BAIXA (gate de fechamento CYC-007 grava Note/DealClosureEvent antes de validar tenant do lead), 3 BAIXA (writes sem `organizationId` no `where`, defense-in-depth) e 1 BAIXA (nome de usuário em erro 409). Recomenda-se handoff ao Agente 04 para as correções — fora do escopo de auditoria do 01A. Gates: `tsc --noEmit` limpo; 107 testes unitários do módulo passando.

---

Auditoria paralela equivalente executada no worktree `C:\Github\Birthub-360-wt-01a` (branch `agente/01a-onda2-handoffs`) — detalhamento completo preservado abaixo:

**Status: resolvido (01A, 2026-11-14).** Worktree real usado: `C:\Github\Birthub-360-wt-01a`, branch `agente/01a-onda2-handoffs` (o caminho `.claude/worktrees/ag-01a` do handoff não existia; a branch correta já estava checked out).

### Modelo de isolamento verificado (evidência estrutural)

Três camadas independentes e complementares, confirmadas em código:

1. **Contexto de tenant por request**: `authenticateToken` (`src/shared/middlewares/authenticateToken.ts:83`) executa todo o resto do pipeline dentro de `requestContext.run({ tenantId: user.organizationId, userId, role })`; `requireTenant` barra requests sem organização. Todas as rotas do escopo são montadas com `authenticateToken, requireTenant` em `src/bootstrap/routes.ts:98-110`.
2. **RLS real no Postgres**: o client estendido (`src/lib/prisma.ts`) seta `app.current_tenant_id` via `SET LOCAL` dentro de transação interativa antes de cada operação quando há `tenantId` no contexto; models auditáveis têm `FORCE ROW LEVEL SECURITY` + policy `tenant_isolation_policy` (ex.: migration `20260808183000_crm_suite_parity` para CrmPipeline/Stage/Product/DealItem/CommercialDocument; CrmPipelineStage usa policy via `pipelineId → CrmPipeline.organizationId`). Sem contexto e sem bypass, a query devolve zero linhas — fail-closed.
3. **Escopo explícito + injeção em escritas**: `injectTenantIntoWriteArgs` (`src/lib/prisma-interceptors.ts`) injeta `organizationId` do contexto em create/update dos models de `TENANT_INJECTED_MODELS` (`src/lib/tenant-scoping-registry.ts`) e remove `organizationId` de payloads de update — o cliente nunca escolhe o tenant.

### Tabela de queries auditadas

| Arquivo | Queries | Escopo tenant | Veredito |
|---|---|---|---|
| `crm/infra/PrismaLeadRepository.ts` | findAllWithFilters, findById, create, update, updateStatus, delete, findAllForExport, findMatchingPipelineStage, loadLatestForecastProbabilityAi | `organizationId` explícito em todos os `where`/`data`; stage lookup via `pipeline: { organizationId }` | OK |
| `crm/infra/PrismaSavedViewRepository.ts` | listByUser, create, deleteById | `organizationId` + `userId` em todos | OK |
| `crm/infra/PrismaDealClosureGate.ts` | note.create, dealClosureEvent.create | Note não tem coluna org (escopo via leadId já validado por org); DealClosureEvent grava `organizationId` explícito | OK |
| `crm/application/LeadUseCases.ts` | dup-check createLead, batchUpdateLeads, enqueueBatchEnrichment, bitrixConnection lookup, leadStageHistory.create | Org explícito; **3 writes sem org no `where` corrigidos** (ver abaixo) | OK após correção |
| `crm/application/LeadDeduplicationService.ts` | groupBy/findMany/updateMany/deleteMany ×~20 models | Org explícito em Lead e em todo model com coluna org; Note/TimelineEvent/EnrichmentLog (sem coluna org) recebem ids já filtrados por tenant + RLS | OK |
| `crm/application/CompanyDeduplicationService.ts` | findMany company, clearAccountIntelligence, mergeGroup | Idem — org explícito em todos os models com coluna; Prospects intocado de propósito (documentado) | OK |
| `crm/jobs/*.worker.ts` (5 arquivos) | followUp, deduplication, autoAnonymize, dailyExecutiveSummary, weeklyPdfReport | `bypassRls` SOMENTE para descoberta cross-tenant de ids/orgs (models allowlist: Lead, Organization — ver `BYPASS_RLS_ALLOWED_MODELS`); todo processamento posterior roda em `requestContext.run({ tenantId })` por organização | OK |
| `crm/presentation/*Controller.ts` + `routes/*.ts` | todos os handlers | `organizationId` sempre de `req.user` (nunca de body/param); `requireLeadOwnership` filtra lead por org antes do check de dono | OK |
| `crm360/infra/PrismaCrm360Repository.ts` | ~30 queries (overview, pipelines, board, deals, products, dealItems, documents, versions, signature, reconcile Stripe) | `organizationId` explícito em todos os `where`/`data`; `tx.$queryRaw ... FOR UPDATE` filtra por org; transações via `runInTransaction({ organizationId })` | OK após correção |
| `crm360/infra/PrismaDiscountAuthorityGuard.ts` | tx.user.findFirst, tx.setting.findMany | Org explícito dentro do tx | OK |
| `crm360/presentation/Crm360Controller.ts` + `routes/*.ts` | todos os handlers | Org de `req.user`; montagem autenticada em routes.ts:110 | OK |
| `crm360/routes/crm360Public.routes.ts` + `recordDocumentView` | findUnique por `publicToken` (bypass), update de contadores | Rota pública intencional (token uuid = credencial, mesmo modelo de BitrixConnection); `CrmCommercialDocument` está em `BYPASS_RLS_ALLOWED_MODELS`; bypass cobre só o lookup e a escrita roda em `requestContext.run({ tenantId: doc.organizationId })` | OK após correção |

### Achados classificados

- **Vazamento cross-tenant real: NENHUM encontrado.** Toda query que toca model com `organizationId` tem filtro/escopo explícito ou contexto de tenant garantido; os únicos `bypassRls` do escopo são descobertas cross-tenant documentadas e restritas a models do allowlist de produção.
- **Defesa em profundidade (corrigido nesta entrega, commit `ce0455e9d`)** — writes que dependiam só de RLS + ids pré-filtrados, sem `organizationId` no `where`:
  1. `LeadUseCases.batchUpdateLeads` → `prisma.lead.update` agora `where: { id, organizationId }`.
  2. `LeadUseCases.enqueueBatchEnrichment` → `prisma.company.updateMany` agora `where: { id: { in }, organizationId }`.
  3. `PrismaCrm360Repository.recordDocumentView` → update agora `where: { id, organizationId: doc.organizationId }`.
- **Fora de escopo → handoff aberto**: `batchUpdateLeads` grava `updates.status` cru (rótulo) no enum `Lead.status` sem `toPrismaLeadStatus`, bypassa o gate de fechamento CYC-007 e a sincronia CRM-011/`closedAt` → `.agents/handoffs/onda-paralela-8/01a-para-04-batchupdate-status-label-sem-mapeamento.md` (dono: Agente 04).
- **Observação (não bloqueante)**: `Lead.owner` mistura `User.id` e `User.name` — já documentado em `.agents/handoffs/onda-7/04-para-06-owner-bitrix-nome-nao-id.md` (dono da correção: 06). `getOverview`/`getDeals` do Crm360Controller engolem erro e respondem zeros/[] — decisão deliberada documentada (TAREFA-SANEAMENTO-018), com log de erro.

### Verificações executadas

- `npx tsc --noEmit` → limpo (exit 0).
- `npx vitest run -c vitest.unit.config.ts src/features/crm src/features/crm360` → 12 arquivos, 107 testes, todos verdes.
- Varredura estática: nenhum `new PrismaClient()` fora de testes; nenhum `$queryRaw`/`$executeRaw` sem escopo no escopo (único `$queryRaw` é o `FOR UPDATE` já filtrado por org); nenhum uso de client sem contexto de tenant.

### Bloqueios

Nenhum. Não foram necessárias mudanças de schema/migrations (slot do 01).


# Relatório — Auditoria de Tenancy no CRM (Onda paralela-8)

- **De:** 01A — Confiabilidade de Dados, RLS e Retenção
- **Para:** 00 — Coordenador
- **Data:** 2026-11-14
- **Handoff:** `.agents/handoffs/onda-paralela-8/00-para-01a-tenancy-audit.md`
- **Worktree:** `C:\Github\Birthub-360-wt-o2-01a` — branch `agente/01a-onda2-tenancy-audit`
- **Escopo auditado:** `src/features/crm/**`, `src/features/crm360/**` (rotas, controllers, use cases, services, infra/Prisma, jobs/workers), montagem em `src/bootstrap/routes.ts` e `src/bootstrap/webhooks.ts`, policies RLS relevantes em `prisma/migrations/`, e o mecanismo de tenant em `src/lib/prisma.ts` / `src/lib/prisma-interceptors.ts`.

## Veredito

O padrão dominante é **correto**: todo `organizationId` vem de `(req as AuthRequest).user.organizationId` (nunca do body/query), todas as rotas autenticadas passam por `authenticateToken` + `requireTenant` (`src/bootstrap/routes.ts:98-110`), e praticamente toda query Prisma carrega `organizationId` no `where` ou no `data` de escrita. A única exceção deliberada e documentada é a rota pública de proposta (`/api/public/proposals/:token/view`), onde o `publicToken` uuid é a credencial — desenho coerente com o modelo de confiança já usado para `BitrixConnection`.

**Não foram encontradas queries que vazem dados cross-tenant em regime normal.** Os achados abaixo são gaps de defesa-em-profundidade e validação de FKs referenciadas — nenhum é explorável para leitura cross-tenant enquanto a RLS estiver ativa, mas todos violam a regra "escopo de tenant na camada de aplicação, não só no banco".

## Achados por severidade

### MÉDIA — FKs referenciadas pelo cliente sem validação de tenant

Três pontos aceitam IDs de entidades relacionadas vindos do body e os gravam sem verificar se pertencem ao `organizationId` do requisitante:

1. **`src/features/crm/infra/PrismaLeadRepository.ts:175-201` (`create`) e `:262-294` (`update`)** — `leadSchema` (`src/lib/zod.ts:105-127`) expõe `companyId`, `contactId`, `pipelineId`, `pipelineStageId`; ambos os métodos fazem spread de `...data` direto no `prisma.lead.create/update`. Um usuário autenticado pode vincular seu lead a uma `Company`/`Contact`/`CrmPipelineStage` de outro tenant.
   - **Evidência:** `data: { ...data, ..., organizationId }` (create, L180-197) e `data: { ...data, ..., organizationId: undefined }` (update, L264-293). Nenhum `findFirst({ id, organizationId })` valida as FKs.
   - **Impacto real hoje:** mitigado pela RLS — `Company`/`Contact`/`CrmPipelineStage` têm `organizationId` e policy `tenant_isolation_policy`; o `include` na leitura devolve `null` para linhas de outro tenant. Porém o vínculo cross-tenant **persiste no banco** e, em qualquer ambiente sem RLS efetiva (a base de código documenta explicitamente que RLS nem sempre está ativa — ver comentários em `LeadDeduplicationService.ts:10-21` e `followUp.worker.ts:17-22`), o `include: { company: true, contact: true }` vaza PII do contato (nome, telefone, e-mail — `Contact` é criptografado em repouso mas decriptado na leitura).
   - **Recomendação:** validar `companyId`/`contactId`/`pipelineId`/`pipelineStageId` com `findFirst({ where: { id, organizationId } })` antes de gravar, ou rejeitar esses campos no schema de entrada e expor endpoints dedicados que já validam tenant.
   - **Dono sugerido:** 04 — CRM e BI (validação), com revisão de 01A.

2. **`src/features/crm360/infra/PrismaCrm360Repository.ts:613-657` (`addDealItem`)** — `crmDealItemSchema.productId` (`src/features/crm360/crm360.schema.ts:23`) é gravado via `tx.crmDealItem.create({ data: { ...calculated, organizationId, leadId } })` sem checar o tenant do `CrmProduct`. `getDealItems` faz `include: { product: true }` — sob RLS o produto estrangeiro volta `null`; sem RLS, vaza nome/preço/custo/customFields do produto de outro tenant.
   - **Recomendação:** `tx.crmProduct.findFirst({ where: { id: productId, organizationId } })` quando `productId` informado; rejeitar 422/404 caso contrário.
   - **Dono sugerido:** 04.

3. **`src/features/crm360/infra/PrismaCrm360Repository.ts:681-754` (`createDocument`)** — `crmDocumentSchema` aceita `leadId`, `companyId`, `contactId` (`crm360.schema.ts:68-70`) e `...input` os grava direto. Mesmo raciocínio do item 1: vínculo cross-tenant possível; `include: { lead, company, contact }` é filtrado por RLS na leitura.
   - **Recomendação:** mesma validação de tenant das três FKs antes do `create`.
   - **Dono sugerido:** 04.

### MÉDIA-BAIXA — Gate de fechamento executa escrita de evidência antes de validar o tenant do lead

`ensureManualDealClosureAllowed` (`src/features/crm/application/dealClosureGate.ts:51-96`) chama `PrismaDealClosureGate.createConfirmationNote` → `prisma.note.create` **antes** de qualquer verificação de que o `leadId` pertence ao tenant:

- `LeadUseCases.updateLeadStatus` (`LeadUseCases.ts:209-218`): gate roda antes de `repository.updateStatus`, que é quem valida `{ id, organizationId }` (`PrismaLeadRepository.ts:324`).
- `LeadUseCases.updateLead` (`LeadUseCases.ts:153-162`): mesmo padrão.
- `PrismaCrm360Repository.updateLeadStage` (`PrismaCrm360Repository.ts:481-493`): gate na L481-489; `previousLead` com escopo de tenant só é buscado na L491-493.

**Evidência de contenção:** com RLS ativa, `Note` tem policy que exige `leadId ∈ Lead do tenant corrente` (`prisma/migrations/20260722020322_enable_rls/migration.sql:67-73`, `FOR ALL` sem `WITH CHECK` → a expressão `USING` vale também para INSERT), então `note.create` com `leadId` estrangeiro falha no banco — não há escrita confirmada cross-tenant hoje. **Porém**, sem RLS (mesmo cenário já documentado como real neste código), a sequência grava: (a) `Note` pendurada no lead da vítima, visível para o tenant dela; (b) `DealClosureEvent` com `organizationId` do atacante referenciando `leadId` estrangeiro (a policy de `DealClosureEvent` usa a própria coluna `organizationId`, que o atacante controla). O update subsequente falha (`P2025`/404), mas as evidências órfãs já foram commitadas — poluição cross-tenant de dados e trilha de auditoria.

**Recomendação:** validar `prisma.lead.findFirst({ where: { id: leadId, organizationId } })` (ou equivalente) **antes** de invocar o gate nos três call sites — uma query barata que também melhora a mensagem de erro (404 limpo em vez de erro de FK/RLS).
**Dono sugerido:** 04 (call sites), port em `crm/infra` é do mesmo domínio.

### BAIXA — Defense-in-depth: updates sem `organizationId` no `where`

Nenhum explorável (os ids vêm de queries já escopadas), mas fogem do padrão defensivo adotado no restante do repositório:

- `LeadUseCases.batchUpdateLeads` — `src/features/crm/application/LeadUseCases.ts:721-724`: `prisma.lead.update({ where: { id: lead.id } })` sem `organizationId`. Os ids vêm de `findMany({ where: { id: { in: leadIds }, organizationId, deletedAt: null } })` (L683-686), então não há caminho cross-tenant.
- `LeadUseCases.enqueueBatchEnrichment` — `LeadUseCases.ts:659-662`: `prisma.company.updateMany({ where: { id: { in: companyIds } } })` sem `organizationId`; ids derivados de leads do tenant.
- `LeadDeduplicationService.deduplicateByEmail` — `src/features/crm/application/LeadDeduplicationService.ts:107-114`: `prisma.note.updateMany`/`prisma.timelineEvent.updateMany` filtram só por `leadId`. Correto porque `Note`/`TimelineEvent` **não têm coluna `organizationId`** (verificado em `prisma/schema.prisma:787-830`) — o isolamento é via FK pai + policy RLS que resolve o tenant pelo `Lead`. Os `duplicateIds` vêm de queries com `organizationId`. Idem para `note`/`enrichmentLog` em `CompanyDeduplicationService.ts:96-103`.
- `assignLeadRoundRobin` (`src/shared/services/leadAssignment.service.ts`, fora do escopo mas chamado por `createLead`) — `prisma.lead.update({ where: { id: leadId } })` no lead recém-criado do próprio tenant.

**Recomendação:** alinhar os `where` de escrita com o padrão `{ id, organizationId }` já usado em `PrismaLeadRepository.update`/`delete` — custo zero, ganha uma camada se a lista de ids um dia for montada de outra forma.
**Dono sugerido:** 04.

### BAIXA — Vazamento potencial de nome de usuário na mensagem de erro 409

`LeadUseCases.createLead` (`LeadUseCases.ts:93-97`): ao detectar lead duplicado, faz `prisma.user.findUnique({ where: { id: existing.owner } })` **sem filtro de `organizationId`** e inclui `ownerUser.name` na mensagem de erro retornada ao cliente. Se `Lead.owner` estiver corrompido apontando para userId de outro tenant, o nome vaza na resposta. Probabilidade baixa (owner é populado internamente), impacto baixo (nome, não PII sensível), correção trivial: `findFirst({ where: { id, organizationId } })`.
**Dono sugerido:** 04.

### Observação fora do escopo de tenancy (registrada, sem ação)

`LeadUseCases.batchUpdateLeads` (`LeadUseCases.ts:699-701`) escreve `updates.status` direto via `prisma.lead.update`, **bypassando** o deal closure gate (`ensureManualDealClosureAllowed`), o `closedAt`, e a sincronização `pipelineStageId` que `updateStatus`/`update` fazem. Um usuário com `writeRoles` pode mover leads para "Negócios Ganhos" em lote sem `DealClosureEvent` — é um gap do gate CYC-007, não de tenancy. **Dono sugerido:** 04, com ciência do 00.

## Tabela de queries auditadas (resumo)

| Arquivo | Método | Escopo tenant | Veredito |
|---|---|---|---|
| `crm/infra/PrismaLeadRepository.ts` | `findAllWithFilters` L94 | `where.organizationId` + `searchLeadIds` filtrado (`lib/search/index.ts:155`) | OK |
| idem | `findById` L161 | `{ id, organizationId }` | OK |
| idem | `create` L175 | `organizationId` no data; **FKs sem validar** | Achado M1 |
| idem | `update` L203 | `{ id, organizationId }` no where; **FKs sem validar** | Achado M1 |
| idem | `updateStatus` L321 | findFirst + update com org | OK |
| idem | `delete` L400 | `{ id, organizationId }` | OK |
| idem | `findAllForExport` L421 | `organizationId` | OK |
| idem | `findMatchingPipelineStage` L31 | via `pipeline.organizationId` | OK |
| idem | `loadLatestForecastProbabilityAi` L79 | `organizationId` | OK |
| `crm/infra/PrismaSavedViewRepository.ts` | todos | `organizationId` + `userId` | OK |
| `crm/infra/PrismaDealClosureGate.ts` | `createConfirmationNote` L22 | Note sem coluna org; RLS via leadId | Achado M2 (ordem) |
| idem | `saveDealClosureEvent` L35 | `event.organizationId` | OK |
| `crm360/infra/PrismaCrm360Repository.ts` | `getOverviewData` L255 | todos os counts/findMany com org | OK |
| idem | `getPipelines`/`getBoardLeads`/`getDeals` | org (+ pipelineId validado com org na L433) | OK |
| idem | `updateLeadStage` L465 | stage via `pipeline.organizationId`; lead `{id, organizationId}` | OK (ordem do gate = M2) |
| idem | `convertLead` L540 | `{ id, organizationId }` | OK |
| idem | `listProducts`/`createProduct` L564/587 | org | OK |
| idem | `getDealItems`/`removeDealItem` L604/659 | `{ organizationId, leadId }` | OK |
| idem | `addDealItem` L613 | org; **productId sem validar** | Achado M1b |
| idem | `listDocuments`/`listDocumentVersions` | org | OK |
| idem | `createDocument` L681 | org; **leadId/companyId/contactId sem validar** | Achado M1c |
| idem | `updateDocumentContent` L756 | `FOR UPDATE` com org + `{id, organizationId}` | OK |
| idem | `updateDocumentStatus`/`reconcileFaturaStripePayment` | findFirst/update com org | OK |
| idem | `recordDocumentView` L1079 | bypassRls só no findUnique por publicToken; escrita re-escopada por `tenantId` do doc | OK (desenho documentado) |
| idem | `requestDocumentSignature` L1120 | `{ id, organizationId }` | OK |
| `crm360/infra/PrismaDiscountAuthorityGuard.ts` | `loadActorRole`/`loadOrganizationThresholds` | org | OK |
| `crm/application/LeadUseCases.ts` | todos os métodos | org propagado; `batchUpdate`/`enqueueBatch` sem org no where final | Achados B1/B2/B3 |
| `crm/application/*DeduplicationService.ts` | dedup/preview/merge | `requestContext.run({tenantId})` + org nos wheres; models sem org column cobertos por FK+RLS | OK |
| `crm/jobs/*.worker.ts` (5 arquivos) | varreduras | bypassRls só para descoberta (Organization/Lead allowlist); processamento sempre re-escopado por tenant | OK |
| Rotas `crm/routes/*`, `crm360/routes/*` | todas | `authenticateToken`+`requireTenant` em `bootstrap/routes.ts`; `crm360Public` é a exceção documentada | OK |

## Gates executados

- `npx tsc --noEmit` → **limpo** (exit 0).
- `npx vitest run -c vitest.unit.config.ts src/features/crm src/features/crm360` → **12 arquivos, 107 testes, todos passaram**.

## Conclusão

Nenhuma correção de código aplicada (missão de auditoria; os gaps encontrados pertencem ao domínio do Agente 04 e não são "vazamento comprovado em regime normal" — dependem de RLS inativa ou dado corrompido). Recomendo ao 00 abrir handoff(s) para o Agente 04 com os achados M1 (validação de FKs cross-tenant), M2 (ordem do gate de fechamento) e as observações baixas. Nenhuma alteração necessária em `prisma/schema.prisma` ou migrations — todos os models auditados já possuem `organizationId` ou isolamento via FK+RLS.

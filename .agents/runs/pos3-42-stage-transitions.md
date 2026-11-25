# POS3-42-STAGE-TRANSITIONS — Transições de estágio e consistência do pipeline

**Agente:** 42 — Lívia (Pipelines, Deals e Estágios, Squad 40)
**Branch:** `agente/42-stage-transitions-s40` (worktree `wt-42-stages`, base `1e1ecb76b`)
**Data:** 2026-11-25

## 1. Mapeamento da máquina de estados atual

Não existe máquina de estados formal. O caminho real de transição de etapa é:

- **`PUT /api/crm/records/:id/stage`** (`src/features/crm360/routes/crm360.routes.ts:31`)
  → `Crm360Controller.moveRecord` (`presentation/Crm360Controller.ts:107`)
  → `Crm360UseCases.updateLeadStage` (`application/Crm360UseCases.ts:29`)
  → `PrismaCrm360Repository.updateLeadStage` (`infra/PrismaCrm360Repository.ts:407`).
- **`POST /api/crm/leads/:id/convert`** → `convertLead` (mesmo repositório, linha ~523) — única
  conversão Lead → Negócio "oficial" (grava timeline `conversion` + `LeadStageHistory`).
- Efeitos colaterais da transição: `status`/`closedAt` derivados de `stage.leadStatus`,
  `probability` da etapa, `funnel` recalculado pela entidade do pipeline, `LeadStageHistory`
  via `recordStageTransition` (shared, fire-and-forget por design) e `LeadFieldChange` quando
  `expectedCloseDate` muda. Gate CYC-007 (`ensureManualDealClosureAllowed`) só na etapa
  "Negócios Ganhos".
- `src/features/crm/deals/deals.service.ts` (`DealsService`, lock otimista + batch atômico)
  **não possui nenhum caller de produção** — só testes (`tests/unit/features/crm/onda3CrmSquad40.test.tsx`).
  Não é caminho vivo de transição; mantido sem alteração.
- `PrismaLeadRepository.update/updateStatus` (fora do ownership — ver handoff) sincroniza
  `pipelineStageId` a partir de `status` via `findMatchingPipelineStage`; os conjuntos de
  `leadStatus` dos dois funis são disjuntos, então esse caminho não cruza funis.

## 2. Falhas comprovadas encontradas e corrigidas

Todas em `src/features/crm360/infra/PrismaCrm360Repository.ts` (ownership do 42):

### F1 — Transição cross-funnel aceita silenciosamente (corrigida)
`updateLeadStage` aceitava qualquer `crmPipelineStage` da organização. Mover um **Negócio**
para etapa do pipeline de Leads gravava `funnel: Lead` — o negócio sumia de `getDeals`,
`getOverviewData` (openDeals/pipelineValue) e forecast, mantendo `amount`/itens. Inversamente,
um **Lead** movido para etapa do pipeline de Negócios virava negócio sem passar por
`convertLead` (sem timeline de conversão, sem as guardas daquele caminho). `SmartProcess`
também era aceita e rebaixava o registro para `Negocio` por eliminação.
**Correção:** guard que compara `stage.pipeline.entity` com o `LeadFunnel` esperado do
registro; divergência → `AppError` 400 antes de qualquer escrita.

### F2 — `convertLead` sem guarda de estado (corrigida)
`convertLead` não verificava o estado atual: chamar convert num registro já em `Negocio`
resetava etapa/probabilidade, apagava `closedAt` e gravava uma 2ª timeline `conversion` +
`LeadStageHistory` espúria. Registro soft-deleted também era mutável.
**Correção:** `findFirstOrThrow` com `deletedAt: null` + rejeição 409 quando
`funnel !== Lead`. Conversão agora é mão única Lead → Negócio.

### F3 — `expectedCloseDate` inválida → 500 (corrigida)
`moveCrmRecordSchema` não declarava o campo e o controller fazia `new Date(body)` — data
lixo produzia `Invalid Date`, que estourava erro do Prisma (500) em vez de 400.
**Correção:** schema passa a declarar `expectedCloseDate` (string ou número); o repositório
valida `getTime()` e lança `AppError` 400. Assinatura alargada para
`Date | string | number` em `ICrm360Repository`, `Crm360UseCases` e a implementação.

### F4 — Lead soft-deleted mutável por `updateLeadStage` (corrigida)
`findFirstOrThrow`/`update` não filtravam `deletedAt` (diferente de `getDeals`).
**Correção:** `deletedAt: null` nos três pontos (lookup do lead, `update`, e `convertLead`).

### F5 — Etapa sem `leadStatus` produzia divergência status↔etapa (corrigida)
Etapa customizada sem `leadStatus` não atualizava `status`/`closedAt`: um negócio fechado
movido para ela permanecia "Perdido" nos relatórios sentado numa coluna aberta.
Hoje só existem os estágios default (todos mapeados), mas o schema permite `leadStatus`
nulo — a rejeição 400 evita a inconsistência caso etapas customizadas venham a existir.

## 3. Verificações executadas

- **Vitest (executado, VERDE):**
  `node node_modules/vitest/vitest.mjs run -c vitest.unit.config.ts --environment node --pool forks src/features/crm360/infra/__tests__/PrismaCrm360Repository.stageTransitions.test.ts`
  → **10/10 testes passando** (5 cenários de `updateLeadStage` — movimento válido, reabertura
  de fechado, `expectedCloseDate` válida, cross-funnel Negócio→Lead e Lead→Negócio, etapa sem
  `leadStatus`, data inválida, lead inexistente — e 2 de `convertLead` — sucesso e 409).
  ⚠️ Contorno de ambiente: o `node_modules` do checkout principal estava sendo reinstalado;
  a symlink do worktree foi apontada temporariamente para o `node_modules` intacto de
  `dem-20261123-onda3/wt-41-activities` (mesmo lockfile, gerado no Prisma do schema da época).
  Versões de vitest/TS podem divergir minimamente do CI — rerodar no ambiente normal é
  recomendado, mas os testes são unitários com prisma mockado.
- **Biome lint (executado, limpo):** `biome lint` nos 5 arquivos alterados → 0 problemas.
- **TypeScript (executado, VERDE no escopo):** `tsc --noEmit` full-project é inviável neste
  host (>30 min, `allowJs` + FS lento); rodado typecheck escopado do grafo `crm360/**` +
  dependências (`dealClosureGate`, `PrismaDealClosureGate`, `vite-env.d.ts`) via tsconfig
  temporário → **0 erros**. Nenhum erro nos arquivos alterados.
- Revisão estática do diff completo (somente arquivos do ownership).
- **Incidente de worktree:** `git status` inicial limpo, mas `Dockerfile`, `docker-compose.yml`
  e `.trivyignore.yaml` apareceram modificados com conteúdo **mais antigo** que HEAD (diff
  removia o pin por digest adicionado em 2026-11-24 — artefato de provisionamento, mtime
  2026-11-24 16:07, provavelmente falso-negativo de racy-git no status inicial). Restaurados
  via `git checkout HEAD --` antes do commit final; worktree limpo.

## 4. Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/features/crm360/infra/PrismaCrm360Repository.ts` | guards F1/F2/F3/F4/F5 em `updateLeadStage` e `convertLead` |
| `src/features/crm360/crm360.schema.ts` | `moveCrmRecordSchema` declara `expectedCloseDate` |
| `src/features/crm360/domain/ICrm360Repository.ts` | assinatura `expectedCloseDate?: Date \| string \| number` |
| `src/features/crm360/application/Crm360UseCases.ts` | idem (pass-through) |
| `src/features/crm360/infra/__tests__/PrismaCrm360Repository.stageTransitions.test.ts` | **novo** — 9 testes (5 válidos/negativos de updateLeadStage, 2 de convertLead, mais reabertura e expectedCloseDate) |

## 5. Limitações e decisões registradas (não implementadas — fora de escopo/decisão)

- **Não existe regra de ordem/pulo de etapa** em lugar nenhum (`tunnelTargetStageId` e
  `automation` do `CrmPipelineStage` são campos mortos). Qualquer drag-and-drop entre
  colunas do mesmo funil é aceito — inclusive pular etapas e reabrir ganho/perdido.
  Formalizar uma máquina de estados é decisão de produto → handoff ao Coordenador.
- `convertLead` não bloqueia conversão de lead desqualificado/fechado — política de
  negócio, não bug comprovado.
- `getPipelines`/`getBoardLeads` não filtram `pipeline.active`/`deletedAt` — pipeline
  inativo continua operável; sem rota de criação/edição de pipeline hoje, é latente.
- `recordStageTransition` é fire-and-forget por design documentado (histórico não derruba
  a operação) — mantido.
- Efeitos em cadência/forecast: nenhum efeito colateral ausente encontrado — forecast lê
  `status`/`probability` já atualizados; cadências consomem `LeadStatus` (dono 44) —
  nenhuma escrita nova introduzida que exigisse handoff de contrato para eles.

## 6. Handoffs emitidos

- `.agents/handoffs/onda-4/42-para-04-contratos-stage-transitions.md` — novos 400/409 do
  endpoint para cobertura de integração pelo Agente 04.
- `.agents/handoffs/onda-4/42-para-00-decisao-maquina-estados.md` — decisão de produto
  sobre ordenação de etapas (pulo/reabertura) pendente.

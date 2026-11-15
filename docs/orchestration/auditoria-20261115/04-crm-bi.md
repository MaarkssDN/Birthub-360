# Auditoria DEM-20261115-001 — Cluster Agente 04 (CRM e BI)

Data: 2026-11-15 · Escopo: domínio CRM/BI do Birth Hub 360 · Método: leitura estática de código (sem execução, sem modificação de arquivos).

---

## 1. Escopo auditado

Li integralmente ou em partes relevantes:

- `src/features/crm/` — `infra/PrismaLeadRepository.ts` (432 linhas, completo), `application/LeadUseCases.ts` (770 linhas, completo), `routes/lead.routes.ts`, `routes/{companyDedup,leadDedup,savedView}.routes.ts` (listagem), `presentation/LeadController.ts` (completo), `components/KanbanBoard.tsx`, `components/{KanbanCard,KanbanColumn}.tsx` (existência), `AGENTS.md` local.
- `src/features/crm360/` — `infra/PrismaCrm360Repository.ts` (1148 linhas, completo), `application/Crm360UseCases.ts` (completo), `presentation/Crm360Controller.ts` (trechos), `routes/crm360.routes.ts`, `routes/crm360Public.routes.ts`, `infra/defaultPipelineStages.ts`.
- `src/features/commercial-intelligence/` — `application/CommercialIntelligenceUseCases.ts` (fachada + cache), `application/scoring/dealScoring.ts`, `application/forecastEngine.ts`, `infra/PrismaCommercialIntelligenceRepository.ts` (completo), `routes/commercialIntelligence.routes.ts` (RBAC), `AGENTS.md` local.
- `src/features/analytics/` — `application/AnalyticsUseCases.ts` (completo), `infra/PrismaAnalyticsRepository.ts` (641+ linhas lidas), `routes/analytics.routes.ts`, `domain/Analytics.ts`, `analytics.service.ts` (trecho — duplicação legada de constantes), `AGENTS.md` local.
- `src/features/companies/`, `contacts/`, `activities/`, `notes/` — repositórios Prisma, rotas e `AGENTS.md` de cada um (leitura completa dos arquivos pequenos).
- `src/components/CrmBoard.tsx` (board Kanban real, ~886 linhas — trechos de drag/batch), `src/shared/middlewares/requireLeadOwnership.ts`, `src/shared/services/leadStageHistory.service.ts`, `src/lib/prisma.ts` + `src/lib/prisma-interceptors.ts` (soft-delete/RLS), `prisma/schema.prisma` (enums `LeadStatus`/`LeadFunnel`, `LeadStageHistory`).
- `src/features/leads/` **não existe** — o domínio "leads" é coberto por `src/features/crm` (modelo `Lead` com `funnel: Lead|Negocio`).

---

## 2. Elogios

- **Sincronia `status` ↔ `pipelineStageId` muito bem resolvida.** `PrismaLeadRepository.findMatchingPipelineStage` + `update`/`updateStatus` (`PrismaLeadRepository.ts:31-48, 231-317, 321-398`) fecham a divergência histórica entre o `LeadStatus` fixo e o `CrmPipeline` configurável, com registro em `LeadStageHistory` e `LeadFieldChange` via helpers únicos (`leadStageHistory.service.ts`, `leadFieldChangeHistory.service.ts`). O comentário CRM-011 documenta exatamente o bug que motivou a correção.
- **Gate determinístico de fechamento de negócio (CYC-007) aplicado nos 3 caminhos de escrita reais**: `LeadUseCases.updateLead`/`updateLeadStatus` (`LeadUseCases.ts:153-161, 209-217`) e `PrismaCrm360Repository.updateLeadStage` (`PrismaCrm360Repository.ts:477-485`), sempre com `actorUserId` obrigatório.
- **Fatura → "Pago" só via reconciliação Stripe ao vivo** (`PrismaCrm360Repository.ts:954-1067`): valida `succeeded`, valor em centavos (tolerância de 1 cent) e moeda; unique constraint contra reuso de cobrança; `AuditService.log`. O caminho genérico de status foi explicitamente bloqueado para Faturas (`:889-898`). Excelente.
- **Versionamento imutável de documentos comerciais** com `SELECT ... FOR UPDATE` dentro de `runInTransaction` (`PrismaCrm360Repository.ts:768-848`) — fecha race real de `versionNumber` duplicado.
- **Alçada de desconto transacional** (`assertDiscountAuthorityWithinTransaction`) em `addDealItem` e `createDocument`/`updateDocumentContent`, com justificativa arquitetural correta no comentário (`:617-626`).
- **Forecast Ponderado determinístico e honesto**: `forecastEngine.ts` é puro, versionado (`FORECAST_RULES_VERSION = 'v2'`), nunca fabrica probabilidade quando falta sinal; snapshots semanais via job; sem histórico → "não disponível" (`CommercialIntelligenceUseCases.forecastAccuracy`). Cache L2 Redis com chave por org+filtro e bypass determinístico para `now` explícito (`reportCache` + `cachedReport`, `:113-129`).
- **RBAC em profundidade no módulo executivo**: `commercialIntelligence.routes.ts` aplica `requireRole(COMMERCIAL_INTELLIGENCE_ROLES)` no router inteiro, além do mount global — defesa em profundidade explícita e documentada.
- **Export CSV de leads**: sanitização contra formula injection (`LeadUseCases.ts:459-466`), restrito a ADMIN/GESTOR com `auditAccessMiddleware` (`lead.routes.ts:24`), BOM UTF-8, ~100 colunas mapeadas com correções documentadas de desalinhamento de índice.
- **Enriquecimento em lote honesto**: `enqueueBatchEnrichment` distingue "nada pendente" de "fila fora do ar" (`enfileirado:false` + motivo), em vez de marcar empresas como "Enriquecendo" sem job real (`LeadUseCases.ts:609-665`).
- **Dedup de lead por empresa+funil no create** (`LeadUseCases.ts:83-103`) com mensagem que resolve o nome do owner; round-robin só quando não há owner; auto-enriquecimento fire-and-forget com log.
- **Busca híbrida Meilisearch com fallback Postgres** em `PrismaCompanyRepository.findAllWithFilters` (`:38-101`), paginação preservando ranking (`orderIndex`), e correção MEL-16 documentada removendo over-fetch de `contacts`/`leads` na listagem.
- **PII**: contatos têm `email/phone/whatsapp` cifrados em repouso; busca usa `contactSearchIndexClauses` e `decryptNestedContactPii` decifra em qualquer profundidade de `include` — solução elegante por forma, não por relação.
- **`requireLeadOwnership`** (`shared/middlewares/requireLeadOwnership.ts`) com fallback documentado para o legado "owner = nome do Bitrix", restrito ao próprio usuário — bem pensado.
- **Soft-delete uniforme**: extensão Prisma converte `delete`→`deletedAt` e injeta `deletedAt:null` em reads de models auditáveis (`prisma-interceptors.ts:316-327`), e `PrismaLeadRepository.delete` aplica soft delete explícito com tenant no `where`.
- **`isAi`/métricas nunca fabricadas**: `null` propagado como "Não disponível" em pipelineValue, averageTicket, tmqMetric etc.

---

## 3. Propostas de melhoria

1. **Unificar o caminho de mudança de etapa.** Hoje existem 3 escritores de etapa (`PUT /api/leads/:id`, `PUT /api/crm/records/:id/stage`, `POST /api/leads/batch-update`) com semânticas divergentes (ver achados P0/P1). Uma única função de domínio `moveLeadStage(orgId, leadId, stageId|status, actor)` chamada por todos eliminaria a classe inteira de bugs de sincronização `status`/`pipelineStageId`/`closedAt`/histórico.
2. **Paginar `getBoardLeads`/`getDeals`/`findDeals`.** O board carrega TODOS os leads do funil com `company+contact+pipelineStage+dealItems` (`PrismaCrm360Repository.ts:446-450`) e `findDeals` carrega todo o histórico de deals + stage history + field changes da org para CADA relatório (`dealScoring.ts:134-139`). Com volume real isso vira o primeiro gargalo; um cursor por etapa + agregações SQL para os relatórios resolveria.
3. **Corrigir `calculateRealTmq`** (ver P1) ou removê-lo até ter fonte correta — hoje `salesVelocityDays` é sempre `null`.
4. **Restringir `/api/analytics/*` por papel** ou segmentar por owner para CLOSER/SDR (ver P1 de RBAC) — hoje qualquer usuário autenticado vê receita e funil consolidados do tenant inteiro.
5. **Aplicar `requireLeadOwnership` (ou equivalente) nos endpoints crm360 de escrita** (`/records/:id/stage`, `/leads/:id/convert`, deal items, documents) para CLOSER/SDR — hoje a posse só é exigida em `PUT /api/leads/:id`.
6. **Criar índice/constraint para `LeadStageHistory` "aberto"**: garantir no máximo uma linha `exitedAt IS NULL` por `(leadId, stageId)` — `batchUpdateLeads` já viola isso hoje.
7. **Métricas de coorte por funil**: `cohortAnalysis`/`monthly` misturam funis Lead e Negócio; separar `funnel` no `where` permitiria cohort de MQL→SQL e de deals separadamente.
8. **`findCallActivityTimestamps` sem limite de data** (`PrismaAnalyticsRepository.ts:277-283`) — restringir a janela (ex.: 90d) ou agregar em SQL.
9. **Migrar `analytics.service.ts` legado**: constantes `FUNNEL_STAGES`/`WON`/`LOST` duplicadas entre `domain/Analytics.ts` e `analytics.service.ts` (`analytics.service.ts:20-37`) — fonte única já existe em `domain/Analytics.ts`; o service deveria importar de lá.
10. **Observabilidade de pipeline**: publicar métrica/contador de "leads com `pipelineStageId` nulo" por org — `attachLegacyRecords` só cobre funis padrão; pipelines customizados podem deixar leads órfãos silenciosamente.

---

## 4. Erros, falhas e dívidas técnicas

### P0 — crítico

**P0-1. `batchUpdateLeads` ignora o mapeamento label→enum e escreve `status` cru no campo enum do Prisma.**
`LeadUseCases.ts:699-701` faz `dataToUpdate.status = updates.status` e `prisma.lead.update` direto (`:721-724`), sem `toPrismaLeadStatus()`. A UI (`CrmBoard.tsx:483`) envia **rótulos de exibição** (`'Negócios Ganhos'`, `'Qualificação (SDR)'` — `LEAD_COLUMNS`/`DEAL_COLUMNS` em `CrmBoard.tsx:51-73`), que não são chaves do enum `LeadStatus` (`schema.prisma:48-69`). Resultado: **toda movimentação em lote pelo Kanban falha 100%** com erro de validação de enum (contabilizado em `failedCount`). Os testes (`LeadUseCases.batchUpdate.test.ts:39,55`) usam chaves enum (`'Qualificacao_SDR'`), ou seja, testam um contrato que a UI não usa. Além disso, mesmo quando funciona (chave enum), o caminho **bypassa `dealClosureGate`, `closedAt`, sync de `pipelineStageId` e `recordStageTransition`** — um CLOSER pode fechar negócios em massa para "Negócios Ganhos" sem evidência e sem `closedAt`, corrompendo relatórios de receita (`sumWonRevenueSince` depende de `closedAt`). Severidade P0: funcionalidade quebrada + bypass de controle financeiro.

### P1 — alto

**P1-1. `closedAt` é sobrescrito a cada update com status de fechamento — atribuição de receita migra de mês.**
`PrismaLeadRepository.update` (`:270`) e `updateStatus` (`:362`) fazem `closedAt: isClosingNow ? new Date() : null` **incondicionalmente** quando `status` está presente — inclusive quando o lead JÁ está em status de fechamento e nada mudou. Um `PUT /api/leads/:id {status:'Negócios Ganhos'}` num negócio já ganho (ex.: ajuste de outro campo via form que reenvia status, ou updateLeadStatus repetido) **reescreve `closedAt` para hoje**. Como `sumWonRevenueSince`, `monthly`, `realtimeCockpit` e `findLeadsClosedSince` (`PrismaAnalyticsRepository.ts:101-131, 166-177, 404-411`) agrupam receita por `closedAt`, negócios fechados em meses anteriores "pulam" para o mês corrente, inflando o mês atual e esvaziando os passados. Correção: só setar `closedAt` na **transição** (status anterior não-fechamento → fechamento), preservando o valor original.

**P1-2. Rotas CRM360 de escrita não exigem posse do lead — CLOSER/SDR editam negócio de qualquer colega.**
`lead.routes.ts:48` aplica `ownLeadOnly` em `PUT /:id`, mas `crm360.routes.ts:31-37,57-73` (`PUT /records/:id/stage`, `POST /leads/:id/convert`, deal items, documents) só tem `writeRoles` (ADMIN/GESTOR/CLOSER/SDR) e **nenhum** `requireLeadOwnership` — e `PrismaCrm360Repository.updateLeadStage`/`convertLead`/`addDealItem` tampouco verificam `owner`. Um CLOSER pode mover, converter ou alterar itens/propostas de deals que não são seus — inconsistência direta com a regra documentada em `requireLeadOwnership.ts` e com o CRM legado.

**P1-3. `POST /api/crm/leads/:id/convert` não valida funil atual — reconversão regride negócio ganho.**
`PrismaCrm360Repository.convertLead` (`:536-558`) faz `prisma.lead.update` sem checar `funnel`/status atual: chamar convert num lead que **já é Negócio e está ganho** reseta `status` para a 1ª etapa (`Nova_Oportunidade`), `closedAt: null`, `pipelineStageId` inicial — reabre um negócio ganho silenciosamente (só grava timeline 'conversion' + stage history). Não há gate de "já convertido" nem de "já fechado".

**P1-4. `/api/analytics/*` expõe métricas financeiras consolidadas a qualquer papel autenticado.**
`analytics.routes.ts` não aplica `requireRole` nenhum — diferente de `commercialIntelligence.routes.ts` que exige ADMIN/GESTOR. `overview`/`dashboard`/`sales-summary`/`realtime-cockpit` retornam `wonRevenueThisMonth`, `pipelineValue`, `totalWonRevenueEver`, `byOwner` com valores (`AnalyticsUseCases.ts:120-178, 348-353`; `PrismaAnalyticsRepository.ts:101-131`). Um CLOSER/SDR (ou qualquer role futura) vê receita e pipeline de toda a equipe — inconsistência de RBAC entre dois módulos que leem os mesmos dados.

**P1-5. `calculateRealTmq` filtra `stageName` por chaves enum que nunca existem em `LeadStageHistory`.**
`PrismaAnalyticsRepository.ts:299-307` busca `stageName: { in: ['Qualificacao_SDR','Reuniao_Agendada','Nova_Oportunidade'] }`, mas `recordStageTransition` grava `stage.name` = **rótulo de exibição** (`'Qualificação (SDR)'`, `'Reunião Agendada'`, `'Nova Oportunidade'` — ver `defaultPipelineStages.ts:26-80`). Nenhuma linha casa → `historyRows` vazio → retorna `null` → `tmqMetric`/`salesVelocityDays` **sempre "Não disponível"** no dashboard. Ou o filtro deve usar os nomes reais, ou gravar `stage.code`/enum no histórico.

**P1-6. `batchUpdateLeads` corrompe `LeadStageHistory` (entradas "abertas" duplicadas e stageName inconsistente).**
`LeadUseCases.ts:739-746` cria `leadStageHistory` direto com `stageName: String(status)` (rótulo cru ou chave enum, conforme o caller) **sem fechar a entrada aberta anterior** (`exitedAt`), sem `stageId`/`probability`/`pipelineId` e sem passar por `recordStageTransition`. Cada batch move deixa uma entrada zumbi `exitedAt: null`; relatórios que leem histórico (`buildStageDurationStats`, aging, jornada) veem transições fantasmas e durações erradas. Viola o desenho documentado em `commercial-intelligence/AGENTS.md` ("escrita em LeadStageHistory acontece FORA desta pasta, via stageHistory.ts — único ponto de escrita real").

### P2 — médio

**P2-1. `batchUpdateLeads` sem verificação de posse e sem validação de payload.**
Rota `POST /api/leads/batch-update` usa só `writeRoles` (`lead.routes.ts:39-41`); o use case não filtra por `owner` para CLOSER/SDR nem valida que `updates.status` é um status válido, que `updates.owner` é um `User.id` real do tenant, ou que `leadIds` pertencem ao funil esperado. Um SDR pode reatribuir leads alheios em massa (o `recordLeadFieldChanges` registra `changedBy`, mas a ação em si é permitida).

**P2-2. `findDeals`/`loadScoredDeals` carregam tabelas inteiras sem limite temporal.**
`PrismaCommercialIntelligenceRepository.findDeals` (`:31-49`) traz **todos** os negócios (incl. ganhos/perdidos históricos) com includes; `findStageHistory` (`:161-177`) e `findFieldChanges` (`:183-197`) trazem **todo** o histórico da org sem `where` de data. Cada relatório (e cada chamada de `healthScore`, que dispara 5 relatórios) faz esse full-scan; o cache de 60s ajuda, mas o primeiro hit e orgs grandes pagam caro. Falta paginação/janela ou agregação em SQL.

**P2-3. `getBoardLeads`/`getDeals`/`getOverviewData` sem paginação e com payload pesado.**
`PrismaCrm360Repository.ts:446-450` carrega todos os leads do funil com `company+contact+pipelineStage+dealItems`; `getDeals` (`:404-417`) idem sem `take`. O overview ainda faz `pipelineValue` via `findMany` de todos os deals abertos (`:291-298`) — um `aggregate` resolveria.

**P2-4. `updateLeadStage` não valida compatibilidade funil↔pipeline nem registra mudança de `status` em `LeadFieldChange`.**
Mover um card do funil Lead para etapa de Negócio (ou vice-versa) troca `funnel` silenciosamente (`PrismaCrm360Repository.ts:495-496`) — pode ser intencional, mas não há confirmação nem evento de "conversão" equivalente ao `convertLead` (que grava timeline 'conversion'; o move cross-funil não grava nada além do stage transition). Adicionalmente, `updateLeadStage` só registra `LeadFieldChange` para `expectedCloseAt` (`:523-531`) — mudança de etapa que implica mudança de `status` não deixa rastro de campo.

**P2-5. `PrismaContactRepository.update`/`delete`/`create` não incluem `organizationId` no `where` da escrita e não validam `companyId` do tenant.**
`PrismaContactRepository.ts:82-85, 91` usam `where: { id }` (o pré-check `findFirst` cobre tenant hoje, mas é defesa de uma camada só — o padrão correto já usado em `PrismaCompanyRepository.update` é `where: { id, organizationId }`). E `create`/`update` aceitam `companyId` arbitrário sem verificar que a empresa é do mesmo tenant → **vínculo cross-tenant possível** se um ID de empresa de outra org for conhecido (IDOR por FK). Mesmo risco em `leadSchema` se `companyId`/`contactId` não forem validados contra o tenant no use case (não verifiquei validação — `LeadUseCases.createLead` usa `validated.companyId` direto em `prisma.lead.create`).

**P2-6. `AnalyticsUseCases.funnel` omite estágios reais do funil.**
`FUNNEL_STAGES` (`domain/Analytics.ts:6-14`) lista 7 status e exclui `Convertido_em_Oportunidade`, `Piloto_*` e `Negocios_Perdidos` do gráfico — leads nesses status **somem do funil** (o `groupBy` conta, mas o map só itera `orderedStages`). Conversões "etapa a etapa" ficam subestimadas e perdidos não aparecem como saída do funil.

**P2-7. `groupQualifiedLeadsByOwner` define "qualificado" como "qualquer status fora de 3".**
`PrismaAnalyticsRepository.ts:238-255` conta como qualified TODO lead que não está em `Lead_Recebido`/`Cadencia_Iniciada`/`Lead_Desqualificado` — inclui ganhos, perdidos, deals e estágios de piloto, **misturando os dois funis** (sem filtro `funnel`). O `conversionRate` do `performanceReport` (`AnalyticsUseCases.ts:96-112`) herda essa imprecisão, e `isAi` é detectado por `owner.includes('IA')||owner.includes('SDR')` — heurística frágil sobre o campo owner (que mistura `User.id` e nomes legados do Bitrix, ver `requireLeadOwnership.ts`).

**P2-8. `findCallActivityTimestamps` sem janela temporal.**
`PrismaAnalyticsRepository.ts:277-283` traz `createdAt` de **todas** as atividades `Ligacao` da org desde sempre, só para montar um heatmap 7×24. Cresce linearmente para sempre; deveria ter `take`/janela ou agregação SQL (`date_trunc`).

**P2-9. `getOverviewData` usa `$transaction` array com queries que poderiam ser agregadas.**
`PrismaCrm360Repository.ts:263-344`: `pipelineValue` via `findMany` de todos os deals abertos (só para somar `amount` e `amount*probability`) — um `aggregate` com `_sum` evitaria trafegar a tabela inteira a cada abertura do overview.

**P2-10. `activities`/`notes` sem verificação de posse para CLOSER/SDR.**
`activity.routes.ts` dá `writeRoles` em PUT/POST/snooze sem `requireLeadOwnership` equivalente — qualquer SDR edita atividade de lead alheio (existe `ownerGuard.ts` mas só valida que `owner` é um usuário real, não posse do registro). Notes: `note.routes.ts` GET não tem `requireRole` (ok para leitura), mas POST aceita qualquer papel da lista sem validar que o ator pode escrever naquele lead específico.

### P3 — baixo / dívida

- **P3-1. `KanbanBoard.tsx` (`src/features/crm/components/`) é um componente morto/placeholder**: 28 linhas, renderiza `<div>`s simples, importa `KanbanCard`/`KanbanColumn` só por efeito colateral, não é usado pelo board real (`src/components/CrmBoard.tsx`). Candidato a remoção.
- **P3-2. Constantes de funil duplicadas**: `FUNNEL_STAGES`/`WON`/`LOST`/`CLOSED_*` existem em `domain/Analytics.ts` **e** duplicadas em `analytics.service.ts:20-37` — risco de divergência (o service é o caminho legado).
- **P3-3. `timeline` "edition" gravado em todo update de lead** (`PrismaLeadRepository.ts:287-292`): cada PUT gera um `TimelineEvent` "Dados do lead atualizados" mesmo quando nada mudou semanticamente — ruído na timeline.
- **P3-4. `countDuplicateCompanyGroupsAmongOpenDeals` usa fallback por `status` enum** (`PrismaCommercialIntelligenceRepository.ts:216-228`) enquanto `findDeals` prefere `stage.isWon/isLost` — pipelines customizados com estágios de fechamento renomeados divergem entre as duas métricas.
- **P3-5. `batchUpdateLeads` itera `leadIds` sequencialmente** (`LeadUseCases.ts:690-767`): N updates + N field-change writes em série; para lotes grandes é lento (e cada falha é logada individualmente — ok, mas sem transação/batch).
- **P3-6. `recordDocumentView` público**: `publicToken` é a credencial (uuid) — modelo aceitável e documentado, mas sem expiração/revogação visível no código lido; vale confirmar se há TTL.
- **P3-7. `getMetrics`/`/api/analytics` engole erros** (`AnalyticsUseCases.ts:408-410` retorna `{metrics:[],total:0}` em qualquer exceção) — esconde falhas de banco como "sem dados" (o comentário diz ser defensivo, mas conflita com a regra de "erro observável" do AGENTS.md §2).
- **P3-8. `LeadUseCases.enrichLead` faz `findById` 2×** (`:308` e `:341`) — o segundo fetch pós-update é necessário, mas o primeiro poderia ser `select` mínimo (só `companyId`/`title`/`company.cnpj/segment/size`).

---

## 5. Resumo executivo

O domínio CRM/BI está **acima da média do repositório em disciplina**: gates de fechamento determinísticos, reconciliação Stripe real para faturas, versionamento imutável de propostas com lock de linha, forecast determinístico versionado com "não disponível" honesto, cache de relatórios bem desenhado e RBAC forte no módulo executivo. A dívida concentra-se em **três escritores de etapa com semânticas divergentes**: o batch-update do Kanban está funcionalmente quebrado (envia rótulos para campo enum) e, pior, bypassa gate de fechamento, `closedAt`, sync de pipeline e histórico quando recebe chave enum; `closedAt` é reescrito a cada update e corrompe a atribuição mensal de receita; e a posse do lead (`requireLeadOwnership`) só existe em um dos três caminhos de escrita. No BI, `calculateRealTmq` está permanentemente nulo por mismatch de `stageName`, o funil analítico omite estágios reais, e `/api/analytics` expõe receita consolidada sem restrição de papel — inconsistência que deveria ser tratada como achado de segurança/privacidade comercial. Recomenda-se prioridade: P0-1 → P1-1/P1-2/P1-3 → P1-5 → P2 de performance.

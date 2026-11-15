# Auditoria CRM / BI / Prospecção — Agente 04/05

**Demanda:** DEM-20261115-001 (auditoria geral orquestrada pelo Agente 00)
**Escopo:** somente leitura. Módulos `src/features/crm`, `crm360`, `contacts`, `companies`, `activities`, `analytics`, `dashboard`, `prospecting` e rotas correspondentes.
**Data:** 2026-11-15

---

## 1. ELOGIOS (com evidências)

### 1.1 Arquitetura e governança

- **Camadas limpas e consistentes**: rotas (`src/features/crm/routes/lead.routes.ts`) → controller (`presentation/LeadController.ts`) → use cases (`application/LeadUseCases.ts`) → repositório Prisma (`infra/PrismaLeadRepository.ts`), com DI via `container.resolve` e validação zod (`validateRequest(leadSchema)`, `lead.routes.ts:42`).
- **RBAC e tenancy bem aplicados**: `requireRole` + `requireTenant` no mount (`src/bootstrap/routes.ts:104`), `requireLeadOwnership` impedindo CLOSER/SDR de editar lead alheio (`lead.routes.ts:15`, comentário em `LeadUseCases.ts:72-78` — força `owner = actor.userId` na criação para a regra de posse ter sentido).
- **LGPD auditada**: export CSV de leads tem `auditAccessMiddleware('Lead')` (`lead.routes.ts:24`), soft delete explícito (`PrismaLeadRepository.ts:400-419`), rotulagem LGPD na observação de contatos promovidos (`promote.ts:106-120`).

### 1.2 Qualidade de lógica de negócio

- **Gate de fechamento de negócio (CYC-007)** — exemplar: `dealClosureGate.ts:51-96` cria evidência real (`Note`) + `DealClosureEvent`, rejeita `triggeredBy` com cara de IA/automação via `isDeterministicCloseEvent` (pré-check antes de escrever, evitando nota falsa em tentativa rejeitada — linhas 44-68).
- **Sincronia status ↔ pipeline (CRM-011)**: `findMatchingPipelineStage` (`PrismaLeadRepository.ts:31-48`) mantém `pipelineStageId`/`probability` sincronizados em TODOS os caminhos de escrita de status, com fallback para pipeline default e preferência pelo pipeline atual do lead. Comentários documentam a divergência histórica que motivou a correção.
- **`closedAt` com semântica correta**: setado só na transição para status final, volta a `null` se reaberto (`PrismaLeadRepository.ts:328-337`) — relatórios de "ganho/perdido no mês" não contam updates posteriores.
- **Promote idempotente e honesto** (`promote.ts`): `resolveCompanyIdentity` com CNPJ determinístico, reaproveita `openLead` existente retornando `alreadyExists: true` (linhas 79-102), comentário explícito proibindo fallback silencioso que já fabricou empresa/lead falsos no passado (linhas 46-50), round-robin + SSE + push Bitrix fire-and-forget.
- **Enriquecimento maduro**: cache TTL configurável (`isEnrichmentFresh`, `enrichment.service.ts:116-133`), `EnrichmentLog` com `source`/`rawData` para proveniência (`schema.prisma:447-451`) + política de retenção de 60 dias (linhas 135-160), dedupe de contatos (`filterNewContacts`), cascata Apollo→Hunter→Google Places com `status: 'enriched'|'failed'|'no_new_data'` honesto sobre providers quebrados (`enrichmentCascade.service.ts:40-55`) e ping de Redis antes de enfileirar (`prospecting.routes.ts:374-396`).
- **Custo de providers protegido**: `requireRole` nas chamadas faturáveis Apollo/Hunter/IA com justificativa ACH-05-01 documentada por rota (`prospecting.routes.ts:62-67, 236-272, 292-313`), rate limit em `/interpret`, consent `z.literal(true)` + audit `AGENT_EXECUTED` (`prospecting.routes.ts:109, 125-135`), bloqueio de promoção de dados Google Places sem autorização de reuso (`prospecting.routes.ts:246-253`).
- **Scoring outbound (mesmo desabilitado) é o melhor do repo**: `scoring.ts` separa Fit/Intent/DataQuality, `UNKNOWN` sai do denominador em vez de virar 0, componentes `null` redistribuem peso, `SCORING_MODEL_VERSION` versionado, `reasons` explicáveis por componente (linhas 1-120).
- **Proveniência no domínio de prospecção**: `ProspectCandidate.source` + `provenance` com `status: 'reported'|'estimated'|'unverified'` e `queriedAt` (`domain/prospectTypes.ts:161-166`), `RequirementEvaluation.source` em cada critério avaliado (`requirementEngine.ts`).
- **Analytics com timezone correto**: `brazilMonthRange`/`shiftBrazilMonth` (`analytics.service.ts:86-97`), `FUNNEL_STAGES` explícita (linhas 21-29), `Promise.all` de counts em vez de N+1 (linhas 136-160), `forecastProbabilityAi` carregado em batch sem N+1 (`PrismaLeadRepository.ts:79-91`).
- **Testes de domínio presentes**: `LeadDeduplicationService.test.ts` (301 linhas), `LeadUseCases.*.test.ts`, `leadScoreCalculator.test.ts`, `prospecting.enrich-cascade.routes.test.ts`, `crmTools.enrichment.test.ts`.

---

## 2. PROPOSTAS DE IMPLEMENTAÇÃO

1. **Unificar os dois modelos de "lead de prospecção"**: hoje coexistem `Lead` (Prisma/CRM) e o subsistema `outbound/` (desabilitado, banco próprio via `toPgQuery`). Migrar o que for valioso do outbound (scoring Fit/Intent/DataQuality, evidence, requirementEngine) para dentro do fluxo `prospecting`/`crm` antes de qualquer reativação — ou remover o módulo morto. Ver ERRO-2.
2. **Score único e explicável no CRM**: hoje `Lead.score` recebe o *fit da empresa* (`LeadUseCases.ts:325`) enquanto o BANT do vendedor só existe client-side (`LeadDetailDrawer.tsx:336`). Proposta: persistir `scoreBant` (calculado server-side a partir de `qualification`) separado de `scoreFit` (empresa), e exibir os dois com `breakdown`/`reasons` — reutilizando o padrão de `fitScore.ts` (`breakdown[]`) e do `scoring.ts` do outbound.
3. **Kanban multi-select funcional**: consertar `batchUpdateLeads` (ERRO-1) e, de quebra, fazê-lo disparar as mesmas automações/eventos do caminho unitário (`fireAutomations`, `broadcastEvent`, sync Bitrix, gate de fechamento) — hoje uma mudança em lote de status é um caminho de escrita de segunda classe.
4. **Pipeline/estágios configuráveis por organização expostos na UI**: `CrmPipeline`/`CrmPipelineStage` existem e são sincronizados (CRM-011), mas os estágios de piloto "não têm mapeamento de UI ainda" (`schema.prisma:62-66`). Proposta: editor de pipeline por tenant + arrastar lead entre `CrmPipelineStage` customizadas em vez do enum fixo de 18 status.
5. **Dashboard de BI com drill-down**: `analytics.service.ts` já produz funnel, cohort, heatmap de ligações, `lostReasons`, `performanceReport` — falta UI que consuma `lostReasons`/`callHeatmap`/`performanceReport` de forma interativa (verificar widgets em `SinglePageDashboard.tsx` e adicionar filtros por período/owner/export).
6. **Metas e forecast**: `forecastProbabilityAi` já é exposto por lead (`PrismaLeadRepository.ts:56-90`); proposta de somar `probability × amount` por estágio no overview do CRM360 e comparar com meta mensal — base existe (`weightedPipeline` em `Crm360Controller.ts:26`).
7. **Qualidade de dados proativa**: `findAllWithFilters` já ordena por `probability`; proposta de widget "leads sem telefone/e-mail/owner" e job de higiene (mesmo padrão do `deduplication.worker.ts` existente em `crm/jobs/`).
8. **Remover `companyEnrichment.service.ts`** (ver ERRO-5) ou reescrevê-lo para consultar provider real — hoje fabrica `name: 'Empresa ${cnpj}'`.

---

## 3. ERROS, FALHAS E DÍVIDAS

### ERRO-1 — P1: `batchUpdateLeads` grava rótulo legível no enum Prisma → mudança de etapa em lote falha silenciosamente (e bypassaria todos os gates se funcionasse)

- **Evidência:** `src/features/crm/application/LeadUseCases.ts:699-724` — `dataToUpdate.status = updates.status` recebe o rótulo `'Qualificação (SDR)'`/`'Negócios Ganhos'` (enum `LEAD_STATUS` de `src/lib/zod.ts:10-29`) e grava via `prisma.lead.update` **sem** `toPrismaLeadStatus()`. O enum Prisma espera `'Qualificacao_SDR'`/`'Negocios_Ganhos'` (`prisma/schema.prisma:48-70`). O Prisma rejeita o valor → exceção por item → contada em `failedCount` (`LeadUseCases.ts:760-766`).
- **Consumidor real:** `src/components/CrmBoard.tsx:482-483` envia `{ updates: { status: newStatus } }` para `/api/leads/batch-update` — ou seja, **arrastar vários leads selecionados para outra coluna do Kanban sempre falha** e a UI recebe `success: true` com `failedCount` (o usuário não vê erro claro).
- **Agravante:** mesmo que o enum fosse corrigido, este caminho **não passa** por `ensureManualDealClosureAllowed` (gate CYC-007), não dispara `broadcastEvent(DEAL_WON/LOST)`, `fireAutomations`, `syncStatusChangeToCrms` (Bitrix/CRMs externos), nem sincroniza `pipelineStageId`/`probability` — é um bypass completo de todas as regras que `updateLead`/`updateStatus` aplicam. Também **não há validação zod** no body de `batch-update` (`lead.routes.ts:39-41` — `updates` é `any`).
- **Correção sugerida:** rotear batch por `updateLeadStatus`/`updateLead` por item (ou extrair o pipeline comum), com `toPrismaLeadStatus`, gate de fechamento e eventos — ou rejeitar `status` em lote até lá.

### ERRO-2 — P1: módulo `outbound/` inteiro está morto (503) mas contém um segundo CRM de leads completo — feature "cenográfica" de ~4k linhas

- **Evidência:** `src/bootstrap/routes.ts:211` monta `/api/outbound` com `unavailableLegacyModule('outbound')` → sempre `503 MODULE_NOT_READY` (`src/bootstrap/legacyModuleGate.ts:5-14`). O comentário admite: "legacy adapters do not yet share the canonical identity and tenant data model".
- **Conteúdo morto:** `src/features/prospecting/outbound/server/routes/leads.routes.ts` (1.371 linhas) implementa Kanban próprio (`PUT /leads/:id/stage`, `/tags`, `/save`), enriquecimento Apollo/CNPJ/notícias com IA, geração de copies por canal, cold email, tasks, chat — tudo sobre um banco paralelo acessado via `toPgQuery`/`getDatabase` (`outbound/server/db.ts`), com `requireAuth` próprio (`outbound/server/auth.ts`) e scoring/evidence/observability próprios.
- **Risco:** se alguém reativar a rota sem migrar identidade/tenancy, há **dois sistemas de lead divergentes** no mesmo Postgres (o `leads` do outbound vs `Lead` do Prisma), com modelos de dados incompatíveis (stage string livre vs enum, sem `organizationId` canônico visível nas queries do leads.routes.ts — ex.: `UPDATE leads SET stage = ? WHERE id = ?` sem filtro de tenant, linhas 74-129). Recomendado: remover ou marcar como referência até decisão do 00/01.

### ERRO-3 — P2: `promoteToCrm` descarta e-mail/telefone/LinkedIn do decisor ao criar o Contact

- **Evidência:** `src/features/prospecting/services/prospecting/promote.ts:104-124` — o `Contact` é criado só com `name`/`role` (+observação LGPD). `input.decisionMakers` (que carrega `email`, `phone`, `linkedinUrl` — `types.ts:45-52`) só é repassado a `enrichCompany` como `preFetchedDecisionMakers`; se o enriquecimento não rodar (`autoEnrich=false`, o default quando o cliente não autoriza pagas — `prospecting.routes.ts:254-266`), o lead promovido fica **sem nenhum canal de contato** apesar de a descoberta ter encontrado e-mail/telefone. O `PromoteInput.contact` também só aceita `{name, role}` (`types.ts:41`).
- **Impacto:** lead "promovido" da Descoberta pode nascer inutilizável para cadência (sem e-mail/WhatsApp), e a informação já paga (Apollo/Hunter) é jogada fora.
- **Correção:** mapear `decisionMakers[0]`/`contact` para `email`/`phone`/`whatsapp`/`linkedin` do Contact na criação (schema `contactSchema` já prevê esses campos).

### ERRO-4 — P2: dois sistemas de score coexistem com semântica ambígua em `Lead.score`

- **Evidência:** `enrichLead` grava `score: result.fit.score` (fit da EMPRESA) em `Lead.score` (`LeadUseCases.ts:324-328`); `promoteToCrm` idem (`promote.ts:151`). Já `calculateLeadScore` (BANT do vendedor, `crm/domain/leadScoreCalculator.ts`) só roda **no cliente** (`LeadDetailDrawer.tsx:336`) e nunca persiste. Resultado: `Lead.score` significa "fit firmográfico da empresa" no banco, mas a UI sugere score de qualificação do lead — e `findAllWithFilters` ordena o Kanban por `probability`, não por `score`, então o score persistido nem influencia a priorização exibida.
- **Adicional:** `fitScore.ts:133` soma "25 pontos base de participação no funil" a TODO score — uma empresa que não casa com nenhum critério ainda sai com 25/100, o que pode inflar percepção de qualidade; o bônus de playbook foi removido (ACH-05-07) mas o +25 fixo permanece sem justificativa documentada no cálculo.
- **Correção:** separar `Lead.scoreFit` (empresa) de score BANT persistido, ou documentar explicitamente que `Lead.score` = fit da empresa e ajustar a UI.

### ERRO-5 — P2: `companyEnrichment.service.ts` fabrica dados — serviço morto que retorna empresa inventada

- **Evidência:** `src/features/prospecting/services/companyEnrichment.service.ts:14-26` — `enrichByCnpj` não consulta provider nenhum: cria `CachedCompany` com `name: \`Empresa ${cnpj}\`` e `legalNature: 'Sociedade Empresária Limitada'` hardcoded. **Zero callers** no codebase (grep confirma só o próprio arquivo + export).
- **Risco:** viola o princípio "UNKNOWN é melhor que dado inventado" que o próprio outbound/scoring documenta; se for plugado em qualquer rota, grava empresa fantasma no cache como se fosse dado real da Receita.
- **Correção:** deletar o arquivo (propriedade do 05) ou implementar consulta real via `fetchCnpjData`.

### ERRO-6 — P2: `enrichLead`/`enrichBatch` podem desperdiçar chamadas pagas e não checam `isEnrichmentFresh` por empresa

- **Evidência:** `LeadUseCases.ts:609-665` (`enqueueBatchEnrichment`): quando `leadIds` é informado, o `where` é apenas `{id in leadIds, companyId not null}` — **ignora `company.enrichmentStatus`**, então leads de empresas já `'Enriquecido'`/`'Enriquecendo'` são reenfileirados e marcados `'Enriquecendo'` de novo. O caminho unitário `POST /:id/enrich` → `enrichLead` (`LeadUseCases.ts:307-344`) chama `enrichCompany` sem `force` — esse respeita o TTL internamente, mas o batch contorna a fila direto e pode gerar jobs duplicados concorrentes para a mesma `companyId` (sem dedupe no `addBulk`, linhas 642-655). Adicionalmente, se duas empresas compartilharem o mesmo CNPJ/domínio, não há lock.
- **Correção:** deduplicar `companyIds` antes do `addBulk` (hoje `companyIds` é derivado mas jobs são por lead — N leads da mesma empresa = N jobs pagos), filtrar `enrichmentStatus` também no ramo `leadIds`, e confiar no `isEnrichmentFresh` dentro do worker.

### ERRO-7 — P2: endpoints de enriquecimento de contacts/companies sem checagem de posse — CLOSER/SDR gasta crédito pago em empresa de outro

- **Evidência:** `contact.routes.ts:33-35` e `company.routes.ts:31-33` — `POST /:id/enrich` tem só `writeRoles`, sem equivalente a `requireLeadOwnership`. Qualquer CLOSER/SDR pode enriquecer (Apollo/Hunter/Receita) qualquer empresa do tenant, mesmo as capturadas por outro vendedor — inconsistência com a regra aplicada a leads (`lead.routes.ts:13-15`). Custo financeiro + LGPD (enriquecimento consulta dados de terceiros).
- **Correção:** estender `requireLeadOwnership`-like para company/contact (ex.: só enriquecer se houver lead próprio vinculado, ou restringir a GESTOR/ADMIN).

### ERRO-8 — P3: `saved-searches` CRUD sem `requireRole` — papel VISUALIZADOR cria/edita agenda de prospecção

- **Evidência:** `prospecting.routes.ts:438-506` — GET/POST/DELETE `/saved-searches` não têm `requireRole` (só o `/run` tem, linha 513). O próprio comentário ACH-05-01 reconhece que chamadas faturáveis são restritas, mas a escrita do agendamento ficou aberta — VISUALIZADOR (papel somente-leitura) pode criar, alterar schedule e deletar buscas salvas do tenant.
- **Correção:** `requireRole(['ADMIN','GESTOR'])` no POST/DELETE (GET pode ficar aberto).

### ERRO-9 — P3: busca de leads limitada a 500 matches do search index

- **Evidência:** `PrismaLeadRepository.ts:111` — `searchLeadIds(organizationId, query, 500)`: tenants com >500 leads que casam com o termo perdem resultados silenciosamente na listagem/busca (sem indicador de truncamento na resposta — `meta` só tem total/page/limit).
- **Correção:** paginar dentro do conjunto de IDs ou fazer fallback para `contains` quando `matchedIds.length === 500`.

### ERRO-10 — P3: export CSV de leads sem paginação e com colunas de índice frágil

- **Evidência:** `PrismaLeadRepository.ts:421-431` (`findAllForExport` — `findMany` sem `take`) + `LeadUseCases.ts:468-537` — preenche `cols[]` por **índice numérico** (cols[0], cols[44], cols[102]...) contra um array `headers` de ~103 posições mantido à mão; qualquer inserção/reordenação de header desalinha silenciosamente todos os dados (os comentários "CORREÇÃO" nas linhas 478-524 mostram que esse tipo de desalinhamento já aconteceu 3+ vezes). Sem paginação, tenants grandes fazem dump completo em memória (mitigado por `auditAccessMiddleware`, mas não por limite de tamanho).
- **Correção:** gerar linhas como `Record<headerKey, value>` e mapear header→valor explicitamente; considerar streaming/paginação para exports grandes.

### ERRO-11 — P3: `PromoteInput`/`/promote` sem validação zod — body arbitrário vai para `prisma.company.create` e enriquecimento pago

- **Evidência:** `prospecting.routes.ts:236-271` — `/promote` não usa `validateRequest`; `promoteToCrm` recebe `...req.body` direto (`promote.ts:51`). Os campos usados em `prisma.company.create` são explícitos (ok), mas `contact.name`/`role`, `decisionMakers[]`, `autoEnrich`, `savedSearchId` não têm schema — strings ilimitadas podem virar `Contact.observations`/tags, e `decisionMakers` malformado quebra `enrichCompany` em runtime. Outras rotas do mesmo arquivo usam zod (`rejectCandidateSchema`, `discoverCriteriaSchema`) — inconsistência.
- **Correção:** `promoteSchema` zod espelhando `PromoteInput`.

### ERRO-12 — P3: `openLead` do promote não exclui estágios de piloto cancelados

- **Evidência:** `promote.ts:84` — `status: { notIn: ['Negocios_Ganhos','Negocios_Perdidos','Lead_Desqualificado'] }`. Os status `Piloto_Birthub360_Profile_Cancelado`/`Piloto_Logistico_Cancelado` (fechados-perdidos, ver `analytics.service.ts:34-42`) **não** estão na lista → promover a mesma empresa com um lead em piloto cancelado retorna `alreadyExists: true` com um lead morto, bloqueando a criação de um novo lead ativo.
- **Correção:** reutilizar `isLeadClosingStatus`/`CLOSED_LOST_STATUSES` compartilhado.

### Observações menores (registradas, sem ação)

- `GET /api/leads` e `GET /api/contacts|companies|activities` não têm `requireRole` — qualquer papel autenticado (incl. VISUALIZADOR) lista dados; aparentemente intencional (papel é "somente-leitura"), mas vale confirmar se VISUALIZADOR deve ver PII completa de leads.
- `enrichLead` retorna `fit`/`enrichment` completos na resposta — payload grande; considerar summary.
- `LeadUseCases.updateLead`/`updateLeadStatus` duplicam a lógica de estágio qualificador + sync Bitrix (linhas 164-250) — candidata a extração, mas fora do escopo cirúrgico.
- `contact.routes.ts` e `company.routes.ts` GET `/:id` sem `requireRole` — idem.
- `escapeCsvValue` (`LeadUseCases.ts:459-466`) protege contra formula injection (`=`,`+`,`-`,`@`, tab, CR) — bom; mas não sanitiza espaços antes do primeiro teste de forma consistente (teste duplo redundante, linhas 461-462).

---

## 4. Cobertura ponta a ponta do fluxo principal

| Etapa | Estado |
|---|---|
| Descoberta (ICP → Apollo/Places/Hunter) | ✅ Real, com providers, rate limit, dedupe, provenance |
| Enriquecimento (CNPJ/Receita/Apollo/cascata) | ✅ Real, cache, proveniência, retenção LGPD |
| Promoção → CRM (Company+Contact+Lead) | ⚠️ Funciona, mas perde contatos do decisor (ERRO-3) e tem edge-case de piloto cancelado (ERRO-12) |
| Lead → estagnação → ganho/perda | ⚠️ Caminho unitário completo e gated; **batch quebrado** (ERRO-1) |
| Conversão Lead→Negócio (CRM360) | ✅ `convertLead`, `moveRecord`, `updateLeadStage` com gate CYC-007 |
| BI/Dashboard | ✅ Backend rico (funil, cohort, heatmap, forecast IA); ⚠️ confirmar consumo de `lostReasons`/`performanceReport` na UI |
| Prospecção outbound (segundo CRM) | ❌ Morto por decisão (503) — código não removido (ERRO-2) |

**Veredito:** o núcleo CRM+Prospecção (04/05) está maduro e honesto — destaque para gates de fechamento, proveniência e proteção de custo. Os débitos concentram-se em: (a) `batchUpdateLeads` quebrado e fora do pipeline de regras; (b) dois sistemas de lead paralelos, um morto; (c) perda de dados de contato na promoção; (d) ambiguidade de score; (e) um serviço que fabrica dados.

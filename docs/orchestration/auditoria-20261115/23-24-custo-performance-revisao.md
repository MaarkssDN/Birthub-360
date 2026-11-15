# Auditoria 23/24 — Custo, Performance e Limites de IA + Processo de Revisão Independente

**Demanda:** DEM-20261115-001 · **Data:** 2026-11-15 · **Auditores:** Agente 23 (Custo/Performance/Limites de IA) + Agente 24 (Revisão Independente)
**Escopo:** somente leitura; nenhuma alteração de código. Método: inspeção estática de `src/`, `prisma`, `vite.config.ts`, `.agents/reviews/`, `.agents/handoffs/`, `docs/` e workflows de CI.

---

## 1. ELOGIOS (com evidências)

### 1.1 Governança de custo de IA — caminho principal é exemplar
- **Orçamento global + por organização com cache e fail-open documentado:** `src/lib/ai/budget.ts:56-112` (aggregate mensal cacheado 60s em Redis com fallback em memória) e `:266-297` (`assertAiBudgetNotExceeded` checa teto por tenant via `Organization.monthlyAiBudgetUsd` e depois teto global `AI_MONTHLY_BUDGET_USD`). Decisão fail-open vs fail-closed explicitamente justificada em `:251-265`.
- **Quota de tokens por tier com OTel:** `src/lib/ai/finops/tokenQuota.service.ts:30-177` (`TIER_QUOTAS` free/starter/pro/enterprise, `enforceTokenQuota`, gauges/histogramas `ai.finops.*`).
- **Circuit breaker por provedor compartilhado entre instâncias via Redis** (com fallback local): `src/lib/ai/gateway/circuit-breaker.ts:14-80` — corrige o problema de N instâncias atrás do LB acumularem falhas independentemente.
- **Cache semântico de respostas** (`src/lib/ai/gateway/semanticCache.ts`, exportado em `gateway.ts:85-189`) e **retry com backoff** (`gateway/retry.ts`) — exatamente o que o prompt do 23 exige (cache de embeddings/respostas, circuit breaker).
- **Telemetria de uso persistida:** `logAiUsage` → `AILog` (`src/lib/ai/usage-log.ts:32`), chamado nos caminhos `chat-model.ts:264-284` e `AgentExecutor.ts:163-168`, com `promptId` catalogado em `gateway/prompt-registry.ts`.
- **Concorrência do enxame limitada por organização:** `src/features/intelligence/services/swarmConcurrency.service.ts:25-32,99-135` — `SWARM_MAX_CONCURRENT_MISSIONS` (default 4, teto 8), fila com timeout e `releaseMissionSlot` promovendo waiters. Previne rajada de chamadas LLM.

### 1.2 Performance de frontend e bundle
- **Code-splitting de rotas completo:** todas as telas de módulo em `src/components/layout/AppLayout.tsx:18-116+` via `React.lazy` + `Suspense`; landing pública também lazy em `src/App.tsx:17-55`.
- **`manualChunks` cirúrgico no Vite:** `vite.config.ts:155-215` isola vendor-react, motion, icons, dnd-kit, echarts (~750kB), exceljs, recharts/d3, auth, tiptap, pdf, carousel e **three.js (`vendor-3d`)**.
- **Gate de budget de bundle em CI:** `scripts/ci/check-bundle-budget.mjs` (total gzip + teto por chunk + exceções documentadas com justificativa escrita) + workflow `.github/workflows/frontend-bundle-budget.yml` + doc `docs/development/PERFORMANCE_BUDGETS.md` com baseline medido.
- **3D sob demanda real:** `Gamified3DOrb.tsx:156,196` e `RevenueSignalOrb.tsx:141,206` usam `frameloop={shouldAnimate ? 'always' : 'demand'}` com `IntersectionObserver` + `visibilitychange` + `prefers-reduced-motion`; `DeferredRevenueSignalOrb.tsx` é `React.lazy`; `HubBurstCanvas.tsx` é stub 2D (sem three).
- **Listas grandes virtualizadas:** `src/components/ui/VirtualTable.tsx` com `@tanstack/react-virtual` (presente em `CrmBoard`, `CompanyList`, `ContactList`).

### 1.3 Paginação e anti-N+1 já aplicados na maioria das rotas
- Paginação por `take`/cursor bem distribuída: `whatsapp.routes.ts:36-40` (take 50), `birthVoice.routes.ts:228-234` (cursor + take+1), `email.routes.ts:22-26` (take 50), `lgpd.routes.ts:97-107` (limit clamp ≤100), `cadence.routes.ts:290-294` (take 200), `intelligence.routes.ts:474-475` (clamp 1–20), `swarm-observability.routes.ts:42`.
- **N+1 corrigidos com comentário de evidência:** `dealRiskDetection.service.ts:215-225` ("Antes da correção de N+1, cada candidato pagava um notification.findFirst… até ~215 queries") — batch único de alertas; `birthVoice.routes.ts:241-251` resolve títulos de lead em lote (`in: leadIds`) em vez de query por chamada; `mesaTratamento.routes.ts:196-204` resolve nomes de owners em lote.
- **Paralelização correta:** `Promise.all` usado amplamente (`PrismaAnalyticsRepository.ts:94-527`, `PrismaCommercialIntelligenceRepository.ts:239-285`).

### 1.4 Processo de revisão independente (§40) — base sólida
- **246 pareceres** em `.agents/reviews/`; 235 contêm palavra de veredito; amostra recente mostra conformidade com o formato exigido (missão, autor, auditor, base, commit/revisão, escopo, achados, veredito) — ex.: `24-onda3-revisao.md` (REPROVADO com achado bloqueador concreto: mock sem `on`/`off` quebrando `attachSseKeepAlive`), `24-revisao-agente-08-e2e-regressao-20261114.md` (BLOQUEADO por rebase que reverteria Onda 3), `24-onda6-revisao-independente.md` (revisão com hash de commit e worktree).
- `docs/orchestration/PROTOCOLO_QUALIDADE_E_ACEITE.md` e `_MATRIX.csv` de handoffs existem e são mantidos.

---

## 2. PROPOSTAS DE MELHORIA

### Performance
1. **Lazy-load do `Gamified3DOrb`:** trocar o import estático em `GamificationWidget.tsx:9` por `React.lazy`/`import()` adiado (mesmo padrão de `DeferredRevenueSignalOrb`). Elimina o fetch do chunk three.js no dashboard/prospecção/gamificação quando `show3DCore={false}`.
2. **Paginação/limite no board de leads:** `getBoardLeads`/`getDeals` (`PrismaCrm360Repository.ts:404-449`) carregam todos os leads do funil com `include` completo. Avaliar `take` por estágio ou paginação por coluna do kanban + virtualização no front.
3. **Selects enxutos nos includes aninhados:** trocar `company: true, contact: true` por `select` explícito em `crmTools.ts:62` e `PrismaCrm360Repository.ts:410-413,447-448` — reduz payload e PII trafegada.
4. **Observabilidade de latência contínua:** formalizar o P95<200ms do prompt 23 com os dados de `docs/audits/prontidao-producao-20261017/07-relatorio-performance-observabilidade.md` + `endpoint-latency-budget.yml` como gate recorrente, não one-shot.

### Custo/limites de IA
5. **Roteamento do caminho `runWithTools` pelo gateway (ou replicação dos gates):** é o gap mais caro do sistema (ver P1-1). Mínimo: `assertAiBudgetNotExceeded` + `enforceTokenQuota` + `logAiUsage` por iteração do loop ReAct, e `recursionLimit` explícito.
6. **Cap de caracteres por mensagem/conversa antes de montar prompt** em `dealRiskDetection.service.ts:121-134` (hoje `body` entra integral no prompt — 15 leads × 6 msgs × corpo ilimitado).
7. **Criar `docs/performance/` e `scripts/benchmarks/`** (propriedade do 23, hoje inexistentes) com o primeiro benchmark de tokens/latência — hoje não há nenhum artefato executável do 23 no repo.
8. **Substituir `docs/reports/RELATORIO_PERFORMANCE.md`** (hoje placeholder literal: "PLACEHOLDER… Para testes de carga severos, ferramentas como Artillery ou k6 precisam ser introduzidas") por relatório real ou removê-lo.

### Processo de revisão
9. **Sanear `_MATRIX.csv`:** campos com vírgulas não escapadas corrompem o parsing (detectado: `uniq -c` do campo status retornou lixo como `" Onda A)"`, `" item MEL-03)"`). Re-exportar com quoting CSV correto ou migrar para JSON/YAML.
10. **Cobertura de parecer para handoffs RESOLVIDO:** 29 handoffs marcados RESOLVIDO com `aprov=NAO` e 13 `PARCIAL` na matriz — triagem do 00/24 para confirmar se a resolução foi homologada ou se o status é aspiracional (§40: "Status: resolvido não comprova implementação").
11. **Checklist mecânico de campos obrigatórios** do parecer (§40/prompt 24) em CI — 11 dos 246 arquivos não contêm palavra de veredito; hoje a conformidade é só por convenção.

---

## 3. ERROS, FALHAS E DÍVIDAS

### P1 — Críticos

**P1-1. Caminho `runWithTools` dos agentes de IA bypassa TODA a governança de custo do gateway.**
- Evidência: `src/features/intelligence/agents/execution/AgentExecutor.ts:219-276` chama `buildModelWithFallback` → `src/features/intelligence/agents/fallback.util.ts:1-58` instancia `ChatOpenAI` **direto** contra `api.groq.com` e `api.openai.com`, fora do gateway.
- Consequências concretas:
  - **Sem `logAiUsage` por iteração** — o loop ReAct pode fazer N chamadas LLM e nenhuma gera `AILog`. Como `budget.ts:56-64` agrega custo a partir de `AILog`, **o consumo desse caminho é invisível para os tetos global e por organização** → os circuit breakers de orçamento subcontam o gasto real.
  - **Sem `assertAiBudgetNotExceeded`/`enforceTokenQuota` por chamada** — o gate roda 1× antes do loop (`AgentExecutor.ts:228`); uma iteração descontrolada estoura tokens/custo dentro da execução.
  - **Sem circuit breaker, retry padronizado, semantic cache, redaction ou prompt-safety** do gateway.
  - **Sem `recursionLimit` explícito** em `createReactAgent` (`AgentExecutor.ts:237`) — o default do LangGraph (25) é implícito; apenas `supervisor.agent.ts:800,838` fixa 25 explicitamente.
- Alcance: ~15 agentes usam `runWithTools` (`bdr.agent.ts:110`, `closer.agent.ts:99`, `crm.agent.ts:89`, `forecast.agent.ts:44`, `proposal.agent.ts:80`, `research.agent.ts:72`, `universalSpecialist.agent.ts:98`, `upsell.agent.ts:49`, etc.) — ou seja, o caminho **mais caro** (tool-calling multi-iterativo) é justamente o não governado.
- Severidade: **P1** — viola diretamente as diretrizes 1 e 4 do prompt do 23 (teto rígido por iteração, observabilidade de tokens).
- Correção esperada: rotear o modelo do loop pelo gateway (com bindTools) ou replicar gates por iteração + `recursionLimit` explícito + `logAiUsage` por chamada. Owner: Agente 07 (dono de `src/features/intelligence/**` e `src/lib/ai/**`).

**P1-2. `executeWithoutTools` reenvia histórico completo do checkpointer a cada invoke.**
- Evidência: `AgentExecutor.ts:155-181` — `StateGraph` compilado com `checkpointer` (PostgresSaver) e `thread_id: sessionId`; `model.invoke([systemPrompt, ...state.messages])` envia todas as mensagens acumuladas da sessão. Sessões longas → prompt cresce linearmente → custo de tokens crescente por turno, sem truncamento/janela visível.
- Severidade: **P1/P2** (custo composto ao longo do tempo; também latência).

### P2 — Altos

**P2-1. N+1 residual em webhook de cadência.** `src/features/cadence/infra/cadenceWebhookResolver.ts:13-32` — `cadenceRun.findMany` + `cadenceSequence.findUnique` **sequencial por run** dentro do `for`. Volume tipicamente baixo (1 lead × poucos runs), mas o padrão é N+1; fix trivial com `include`/`in:`. Owner: 17.

**P2-2. N+1 + prompt potencialmente grande na detecção de risco de deal.** `dealRiskDetection.service.ts:138-146` — até `MAX_LEADS_SCANNED_FOR_CONVERSATION=15` queries `whatsAppMessage.findMany` (uma por lead) + montagem de prompt único com `body` integral das mensagens (`:121-134`), sem cap de caracteres. Custo de tokens por rodada proporcional a 15×6 mensagens de tamanho ilimitado. Owner: 04/07.

**P2-3. N+1 por vendedor na gamificação.** `src/features/gamification/application/GamificationUseCases.ts:42-53` — `performanceAggregator.compute()` por `sellerName` dentro de `Promise.all` → N chamadas de agregação (cada uma multi-query) para N vendedores. Owner: 04/gamificação.

**P2-4. `findMany` de leads sem `take` na Mesa de Tratamento.** `mesaTratamento.routes.ts:192` — `prisma.lead.findMany({ where, select: leadSelect })` sem limite: carrega **todos** os leads abertos do tenant para ranquear em memória a cada request. O `select` é bom, mas sem paginação/teto degrada com o crescimento da base. Owner: 17/04.

**P2-5. Listagem de conversas do Copiloto IA sem paginação.** `PrismaCopilotoIaRepository.ts:188-199` (`listConversations`) e `:326-333` (`listInsights`), `:397-404` (`listDealHealthSnapshots`) — `findMany` sem `take`, servidos por `copilotoIa.routes.ts:29` → resposta potencialmente ilimitada. Owner: 07.

**P2-6. Over-fetch de colunas completas em contexto de LLM.** `src/features/intelligence/tools/crmTools.ts:62` — `include: { company: true, contact: true }` (todas as colunas, incluindo campos pesados/PII) para até 20 leads serializados no prompt da ferramenta. Idem `PrismaCrm360Repository.ts:410-413` e `:447-448` (`company:true, contact:true, pipelineStage:true, dealItems:true` — `dealItems` sem limite aninhado). Owner: 07 (tools) / 04 (crm360).

**P2-7. Chunk three.js baixado fora do caminho crítico documentado.** `src/components/ui/GamificationWidget.tsx:9` importa `Gamified3DOrb` estaticamente; consumidores `SinglePageDashboard.tsx:29`, `ProspectingHub.tsx:4`, `GamificationView.tsx:16` carregam o módulo mesmo com `show3DCore={false}` (dashboard usa `false` em `SinglePageDashboard.tsx:824`). Isso contradiz a premissa de `docs/development/PERFORMANCE_BUDGETS.md`/`check-bundle-budget.mjs` de que three.js só entra via lazy+condicional (`DeferredRevenueSignalOrb`, `OnboardingTour`, `AtlasOrb`). Owner: 02/03.

**P2-8. Ausência dos artefatos de performance do Agente 23.** `docs/performance/**` e `scripts/benchmarks/**` (propriedade declarada no prompt 23) **não existem**; `docs/reports/RELATORIO_PERFORMANCE.md` é placeholder; não há benchmark executável de tokens/latência/P95 no repo — critério de sucesso do 23 nunca materializado. Owner: 23.

**P2-9. Polling de 5s sem gate de visibilidade da aba.** `useWhatsAppConversations.ts:13,55` e `useWhatsAppMessages.ts:11,57` — `setInterval(load, 5000)` roda mesmo com a aba oculta (não há `document.visibilityState`/`navigator.onLine` gate), gerando requests contínuos por aba aberta do WhatsApp Web. `BitrixExtractionPanel.tsx:214` (3s) é corretamente condicionado a run ativa. Owner: 06/02.

### P3 — Médios/Baixos

**P3-1. ~88 `findMany` sem `select`/`include`** na janela de análise (script ad-hoc, `src/**/*.ts` fora de testes). A maioria é tabela pequena de configuração/conexão (`omieConnection`, `stripeConnection`, `aiEngineSetting`, `savedView`) — risco baixo — mas inclui casos relevantes já cobertos em P2-5/P2-6. Recomendado: lint rule ou convenção "todo findMany de entidade de domínio declara select".

**P3-2. `findMany` sem `take` residuais em rotas:** `prospecting.routes.ts:443` (`savedSearch`), `intelligence.routes.ts:109` (`customAiTool`), `auth-extra.routes.ts:83` (`session` — limitada por usuário, ok), `cadence.routes.ts:205` — todos de cardinalidade baixa hoje; registrar como débito de convenção.

**P3-3. Caminhos legados de IA fora do gateway (desabilitados, mas armados):** `src/features/prospecting/outbound/server/ai.ts:223,291,496` chama Groq/Gemini/Ollama via `fetch` direto sem budget/quota/log (módulo bloqueado por `unavailableLegacyModule` em `bootstrap/routes.ts:211`); `src/lib/voice-runtime/providers/LLMGateway.ts`/`OpenAIProvider.ts` e `whisperTranscription.service.ts` (este último ao menos documenta `assertAiBudgetNotExceeded`+`AILog` manual no worker). Se o módulo outbound for reativado, o bypass vira P1. Owner: 05/12.

**P3-4. Dívida no processo de handoffs/revisão:**
- `_MATRIX.csv` com parsing quebrado (vírgulas em campos não escapadas → colunas desalinhadas; evidência: `awk -F,` retornou status corrompidos).
- 402 RESOLVIDO / 33 ABERTO / 3 ADIADO / 1 BLOQUEADO na matriz; **29 RESOLVIDO com `aprov=NAO`, 13 `PARCIAL`** — handoffs "resolvidos" sem parecer do 24 registrado.
- 246 pareceres, mas só 167 mencionam commit/hash de revisão — ~79 podem não identificar a "revisão exata" exigida pelo prompt 24.
- 11 arquivos em `.agents/reviews/` sem palavra de veredito explícita.

**P3-5. Monolitos de frontend:** `Landing360.tsx` (3.165 linhas, 8+ `useEffect`, múltiplos listeners de scroll — todos com cleanup/passive, mas alto custo de manutenção e parse), `NewLoginScreen.tsx` (1.628), `PillarRegistry.tsx` (1.402). Lazy-loaded, então impacto é de manutenibilidade, não de load inicial.

**P3-6. `historicalTrendsReport.ts:27-40`** — 6 períodos × 2 relatórios aninhados de queries (≈12+ queries por request de trends). Limitado e paralelo, mas candidato a materialização/snapshot se a rota for quente. Owner: 04.

---

## 4. Síntese para o Agente 00

| # | Achado | Severidade | Owner sugerido |
|---|--------|-----------|----------------|
| P1-1 | `runWithTools` bypassa budget/quota/log/circuit-breaker por iteração | **P1** | 07 |
| P1-2 | Histórico completo do checkpointer reenviado por invoke | P1/P2 | 07 |
| P2-1..P2-9 | N+1 residual, queries sem take, over-fetch p/ LLM, chunk 3D eager, ausência de benchmarks do 23, polling sem visibility gate | P2 | 04/07/17/06/02/23 |
| P3-* | Débitos de convenção, legado outbound, matriz CSV, monolitos | P3 | vários |

**Veredito deste laudo:** o sistema tem governança de custo de IA **madura no caminho feliz** (gateway) e **incompleta no caminho caro** (agentes com tools). A revisão independente é real e majoritariamente conforme §40, com dívidas de rastreabilidade na matriz de handoffs. Nenhuma ação corretiva foi executada — somente leitura, conforme escopo.

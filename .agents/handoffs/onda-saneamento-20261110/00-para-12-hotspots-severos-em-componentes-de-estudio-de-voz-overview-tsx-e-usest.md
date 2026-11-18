De: Agente 00 — Coordenador
Para: Agente 12 (Voz e Telefonia (Birthub Voices))
Onda: Onda 3 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-008)
Status: em-andamento (implementação concluída pelo Agente 12 em 2026-11-12 — aguardando parecer do Agente 24, condição de encerramento deste handoff)
Prioridade: alto
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 3

## Problema

**Hotspots severos em componentes de estúdio de voz (Overview.tsx e useStudioStore.ts)**

- **Dívida técnica:** BT360-DT-0063
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** O módulo Voice Hub foi desenvolvido como uma aplicação completa embutida em uma única pasta sem modularização de serviços de áudio.

**Impacto:** Lentidão na renderização de gráficos de onda em tempo real durante chamadas; alto risco de vazamento de memória em sessões longas de discagem.

## Arquivo(s) envolvido(s)

`src/features/voice-hub/pages/Dashboard/Overview.tsx`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-008`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-008` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

1. Alteração cirúrgica — somente os arquivos do escopo; nenhuma refatoração adjacente.
2. Tratamento explícito de erro, sem fallbacks enganosos (AGENTS.md §30 e §32).
3. Adicionar ou atualizar testes automatizados cobrindo caminho de sucesso e de falha.
4. Respeitar slots exclusivos e dependências de schema/contrato (abrir handoff ao proprietário quando o arquivo pertencer a outro agente).

## Teste esperado

- `npx tsc --noEmit`
- `npm run lint`
- Testes específicos da área afetada (sucesso e falha).

## Contexto adicional

- **Agente revisor obrigatório:** Agente 24 — parecer formal em `.agents/reviews/`.
- **Condição para encerramento:** parecer `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.
- O destinatário pode atualizar o `Status` deste handoff e adicionar seção de resolução sem apagar o pedido original.

## Resolução — Agente 12 (2026-11-12, branch `agente/12-voz-handoffs`)

Decomposição cirúrgica executada dentro de `src/features/voice-hub/**` (propriedade exclusiva do Agente 12):

- `pages/Dashboard/Overview.tsx`: 1.430 → ~710 linhas. Virou shell de composição (fetch + tabs + header). Extraídos:
  - `overviewMetrics.ts` — tipos (`CallLogEntry`, `AgentRecord`, `ReadyChecks`, `MetricEntry`, `FetchStatus`), constantes de métricas e **todas** as funções puras de formatação/agregação, incluindo o novo `deriveOverviewMetrics(calls, agents, metrics, now)` que concentra os KPIs de calls/agentes/SLA/telemetria de IA (antes calculados inline no componente).
  - `overviewWidgets.tsx` — `RealStatCard`, `PendingAlert`, `ChecklistItem` (apresentação pura).
  - `overviewSections.tsx` — `OnboardingPanel`, `CallsLogCard`, `AgentsCard`, `PlatformStatusCard`, `PendingAlertsCard`.
- `store/useStudioStore.ts`: 1.102 → ~425 linhas. Segue o padrão de factory já existente (`createWorkflowPersistenceActions`). Extraídos:
  - `simulationActions.ts` — todo o loop de simulação/debug (start/stop/pause/resume/step + `simulationInterval` module-local, que continua sendo limpo por `stopSimulation()`/`setWorkflowContext()` → sem vazamento de timer).
  - `studioServerActions.ts` — `applyAiRefactor`, `generateWorkflowFromPrompt`, `publishWorkflowToServer`, histórico de versões e rollback (guarda de `workflowEpoch` preservada).
  - `simulationGraph.ts` — `resolveNextSimulationTarget` + `blockingValidationIssues`: a resolução "próximo nó" (condição out-0/out-1, fallback posicional) estava **duplicada** entre `startSimulation` e `stepSimulationForward`; agora é uma única função pura testável. Comportamento idêntico ao anterior.
- Fetches do Overview agora usam `AbortController` no mount (cancela requests e evita setState pós-unmount).

**Testes adicionados:**
- `overviewMetrics.test.ts` — 12 testes (parse de duração, SLA window 24h, agregados IA, estados vazios honestos).
- `simulationGraph.test.ts` — 8 testes (ramos condition/single/multi-edge, bloqueio fail-closed do ValidationEngine).

**Gates executados (worktree `agente-12-voz-main`, base `origin/main` @ 0b52894e0):**
- `npx tsc --noEmit` → limpo.
- `npx biome lint` nos 10 arquivos alterados → limpo (0 erros/avisos novos; warnings pré-existentes em outros arquivos do diretório não tocados).
- `npx vitest run -c vitest.unit.config.ts src/features/voice-hub` → **24 arquivos / 194 testes, todos passando** (inclui `Overview.telemetria-ia.test.tsx` e `useStudioStore.versionHistory.test.ts` pré-existentes — não-regressão confirmada).

**Pendente:** parecer formal `APROVADO` do Agente 24 (condição de encerramento deste handoff).

## Atualização Onda 2 (Agente 12 — 2026-11-14, branch `agente/12-onda2-voz`, base `origin/main` @ d699f9c4f)

Reverificação sobre a `main` atual (refatoração já mergeada via PR #253):

- `Overview.tsx`: 708 → **654 linhas** (abaixo do limite de aviso de 700). Extração adicional
  cirúrgica: o grid "Quick Actions" (~50 linhas de JSX puramente apresentacional) virou
  `QuickActionsGrid` em `overviewSections.tsx` (682 linhas, também < 700), recebendo 4 callbacks
  (`onCreateAgent`/`onViewAnalytics`/`onOpenPlayground`/`onNewKnowledge`) — comportamento de
  navegação/modal idêntico, zero lógica movida. Imports de ícones órfãos removidos.
- `useStudioStore.ts`: **421 linhas** — sem novas exceções necessárias.
- `docs/architecture/HOTSPOT_EXCEPTIONS.md`: removidas as 2 entradas obsoletas
  (`Overview.tsx` limite 1500 e `useStudioStore.ts` limite 1150) que o
  `check:hotspots` apontava como "exceção sem arquivo correspondente" — limpeza recomendada
  pelo próprio gate.
- `npm run check:hotspots` → ✅ 1911 arquivos, 0 acima de 1000 sem exceção; nenhum arquivo de
  `src/features/voice-hub/pages/Dashboard/Overview.tsx` ou `store/useStudioStore.ts` em aviso
  ou exceção. Restam avisos não-bloqueantes pré-existentes fora do escopo deste handoff
  (`KnowledgeManager.tsx` 812, `LandingInnovative.tsx` 703).

**Gates executados (worktree `Birthub-360-wt-o2-12`):**
- `npx tsc --noEmit` → limpo.
- `npx biome check --write` nos 2 arquivos tocados → formatado, 0 erros.
- `npx vitest run -c vitest.unit.config.ts src/features/voice-hub/pages/Dashboard` →
  **7 arquivos / 72 testes, todos passando** (inclui `Overview.interactions.test.tsx`,
  `Overview.telemetria-ia.test.tsx`, `overviewSections.test.tsx` — não-regressão do
  quick-actions confirmada pelos testes de interação de modal/navegação).

**Pendente (inalterado):** parecer formal `APROVADO` do Agente 24.
## Atualização (Agente 12 — 2026-11-14, branch `agente/12-onda2-handoffs`)

`Overview.tsx` recebeu apenas reordenação de call sites do logger pino
(`(obj, msg)`) no commit `c3e37014b` — nenhum comportamento alterado; a
decomposição documentada acima permanece intacta. Gates da onda de
saneamento seguem como registrados; **parecer formal do Agente 24 continua
pendente** (condição de encerramento deste handoff).

## Re-verificação (Agente 12 — 2026-11-17, branch `agente/12-handoffs-20261117`, base `main@414a0ca5f`)

Estado reconfirmado em `main` — implementação íntegra, sem regressão:

- `src/features/voice-hub/pages/Dashboard/Overview.tsx` → **654 linhas**;
  `store/useStudioStore.ts` → **421 linhas**; `overviewSections.tsx` → 682 linhas.
  Todos abaixo dos limites de aviso (700) do `check:hotspots`.
- `npx vitest run -c vitest.unit.config.ts src/features/voice-hub/pages/Dashboard`
  → **8 arquivos / 108 testes, todos passando** (inclui `overviewMetrics.test.ts`,
  `overviewWidgets.test.tsx`, `Overview.telemetria-ia.test.tsx`,
  `Overview.interactions.test.tsx`, `KnowledgeManager.test.tsx`).
- `tenant-isolation.test.ts` (lib/voice-hub) → 36/36 verdes.
- `npx tsc --noEmit` (tsconfig principal) → limpo. `tsconfig.voice.json` → 14 erros,
  todos por deps `twilio`/`d3`/`openid-client` ausentes (decisão do 00, ver
  handoff `01-para-12-voicehub-adaptacao-modelos-canonicos.md`).

**Status mantido: em-andamento** — a condição de encerramento (parecer formal
`APROVADO` do Agente 24 com validação de hashes e não-regressão) **não foi
localizada** em `.agents/reviews/` até esta data. Não encontrei parecer
específico da TAREFA-SANEAMENTO-008/BT360-DT-0063; os pareceres de saneamento do
24 (`24-revisao-onda-saneamento-*`, `24-revisao-pos-homologacao-w7-20261113.md`)
mencionam os hotspots voice-hub apenas como pendência/exceção datada, não como
veredito sobre esta decomposição. Aguarda o Agente 24.

# Run — Agente 12: handoffs pendentes de voz/telefonia

Data: 2026-11-12
Branch: `agente/12-voz-handoffs`
Worktree: `C:\Github\Birthub-360-worktrees\agente-12-voz-main` (a partir de `origin/main` @ `0b52894e0`)
Base de referência: merges até ~PR #247

## Handoffs localizados

Varredura em `.agents/handoffs/**` por `Para:` contendo `12`/`Voz` + lista de status `aberto|em-andamento`.
12 arquivos dirigidos ao Agente 12; **10 já estavam `resolvido`** em main. Apenas 2 pendentes:

| Handoff | Status anterior | Resultado |
|---|---|---|
| `00-para-12-17-voicehub-reactivacao.md` | aberto | **em-andamento** — parcela do 12 concluída e documentada; itens 2 (RLS, Agente 01) e 3 (nav, Agente 02) pendentes |
| `onda-saneamento-20261110/00-para-12-hotspots-...Overview.tsx...` | aberto | **em-andamento** — implementação concluída; aguardando parecer do Agente 24 (condição de encerramento do handoff) |

## Handoff 1 — Reativação VoiceHub (00→12+17+01+02)

Verificação (sem alteração de código — já implementado em main):
- Rotas reais de voz (`/api/integrations/birth-voice`, `/api/integrations/3cx`) montadas com
  `authenticateToken` + `requireTenant` em `src/bootstrap/routes.ts` L198-199; todos os handlers
  escopam por `organizationId` do usuário autenticado.
- Webhook de resultado isola segredo por conexão/org (suíte ACH-06-01 em `birthVoice.webhook.test.ts`).
- Legado `/api/voice-hub|outbound|dialer-3cx` segue 503 `MODULE_NOT_READY` intencional
  (`src/bootstrap/legacyModuleGate.ts`) até validação de RLS do Agente 01.
- Decisão `dialer` registrada no handoff: alias → `cadence` (tabMeta, dono 02); API dialer-3cx
  permanece cortada oficialmente.

## Handoff 2 — TAREFA-SANEAMENTO-008 / BT360-DT-0063 (hotspots Overview.tsx + useStudioStore.ts)

Decomposição cirúrgica em `src/features/voice-hub/**`:

- `pages/Dashboard/Overview.tsx`: 1.430 → ~710 linhas.
  - Novo `overviewMetrics.ts` (tipos + helpers puros + `deriveOverviewMetrics`).
  - Novo `overviewWidgets.tsx` (`RealStatCard`, `PendingAlert`, `ChecklistItem`).
  - Novo `overviewSections.tsx` (`OnboardingPanel`, `CallsLogCard`, `AgentsCard`,
    `PlatformStatusCard`, `PendingAlertsCard`).
  - Fetches do mount agora com `AbortController` (cancela em unmount; `AbortError` não vira erro de UI).
- `store/useStudioStore.ts`: 1.102 → ~425 linhas (padrão factory já usado por `workflowPersistence.ts`).
  - Novo `simulationActions.ts` — loop de simulação completo; `simulationInterval` permanece
    module-local e é limpo por `stopSimulation()`/`setWorkflowContext()`.
  - Novo `studioServerActions.ts` — IA refactor/generate, publish, version history, rollback
    (guarda `workflowEpoch` preservada).
  - Novo `simulationGraph.ts` — `resolveNextSimulationTarget` + `blockingValidationIssues`:
    elimina duplicação da resolução de próximo nó entre `startSimulation` e `stepSimulationForward`.
- Testes novos: `overviewMetrics.test.ts` (12), `simulationGraph.test.ts` (8).

## Gates

- `npx tsc --noEmit` → **limpo** (exit 0).
- `npx biome lint` nos 10 arquivos alterados → **limpo** (warnings pré-existentes em outros
  arquivos de `pages/Dashboard` não foram tocados — P3).
- `npx vitest run -c vitest.unit.config.ts src/features/voice-hub` → **24 arquivos / 194 testes,
  todos passando** (inclui `Overview.telemetria-ia.test.tsx` e `useStudioStore.versionHistory.test.ts`
  pré-existentes — não-regressão).

## Arquivos alterados

- `src/features/voice-hub/pages/Dashboard/Overview.tsx` (reescrito como shell)
- `src/features/voice-hub/pages/Dashboard/overviewMetrics.ts` (novo)
- `src/features/voice-hub/pages/Dashboard/overviewMetrics.test.ts` (novo)
- `src/features/voice-hub/pages/Dashboard/overviewWidgets.tsx` (novo)
- `src/features/voice-hub/pages/Dashboard/overviewSections.tsx` (novo)
- `src/features/voice-hub/store/useStudioStore.ts` (reduzido)
- `src/features/voice-hub/store/simulationActions.ts` (novo)
- `src/features/voice-hub/store/simulationGraph.ts` (novo)
- `src/features/voice-hub/store/simulationGraph.test.ts` (novo)
- `src/features/voice-hub/store/studioServerActions.ts` (novo)
- `.agents/handoffs/00-para-12-17-voicehub-reactivacao.md` (status + resolução)
- `.agents/handoffs/onda-saneamento-20261110/00-para-12-hotspots-...md` (status + resolução)
- `.agents/runs/12-voz-handoffs-pendentes.md` (este relatório)

## Pendências / handoffs abertos

- Handoff saneamento-008: **em-andamento** até parecer `APROVADO` do Agente 24.
- Handoff voicehub-reativacao: **em-andamento** — faltam itens do Agente 01 (RLS/tenancy) e
  Agente 02 (NAV_HIDDEN_TABS); nenhum bloqueio do lado do Agente 12.
- Sugestão ao 00: abrir handoff 12→24 solicitando revisão formal do diff do saneamento-008.

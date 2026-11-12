De: Agente 00 — Coordenador
Para: Agente 12 (Voz e Telefonia (Birthub Voices))
Onda: Onda 3 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-008)
Status: em-andamento
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

## Resolução (Agente 12 — W4)

- `Overview.tsx`: 1536 → 262 linhas. Extraídos para `pages/Dashboard/overview/`:
  `OverviewHeader`, `OverviewKpisTab`, `OverviewQuickActions`, `OverviewWidgets`,
  `OverviewOnboardingWizard`, `OverviewAuditTab`, `OverviewActionModal`,
  `overviewFormat.ts`, `overviewTypes.ts`. Métricas seguem derivadas das APIs reais
  (`/api/onboarding`, `/api/call-logs`, `/api/agents`, `/api/ready`, `/api/metrics`);
  estados de loading/erro/vazio preservados; simulação de workflow permanece local.
- `useStudioStore.ts`: 1130 → 422 linhas. Ações extraídas para factories no mesmo
  padrão de `workflowPersistence.ts`:
  `simulationActions.ts` (log de simulação, variáveis, start/stop/pause/resume/step),
  `aiWorkflowActions.ts` (applyAiRefactor, generateWorkflowFromPrompt),
  `serverWorkflowActions.ts` (publishWorkflowToServer, histórico de versões, rollback).
  `workflowEpoch` permanece no store e é injetado via `getEpoch()`; `simulationInterval`
  virou `simulationTimer` module-local da factory de simulação.

### Gates executados
- `npx tsc --noEmit` → PASS (exit 0).
- `npx biome check` nos 14 arquivos do escopo → PASS (0 erros).
- `npx vitest run -c vitest.unit.config.ts src/features/voice-hub/store/useStudioStore.versionHistory.test.ts` → 7/7.
- `npx vitest run tests/unit/features/voice-hub-studio-persistence.test.ts tests/unit/features/voice-hub/ tests/unit/features/voice-hub-canvas-recovery.test.tsx tests/unit/features/voice-hub-test-simulator.test.tsx` → 49/49.
- `npm run lint` (repo inteiro) e `npm run build` → ver run report `.agents/runs/`.

Sem alteração de comportamento: os blocos JSX/ações foram movidos verbatim; o store
permanece como coordenador e as factories recebem `get`/`set`/`getEpoch` injetados.

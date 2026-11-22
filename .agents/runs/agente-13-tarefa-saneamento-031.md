# Run Report — Agente 13 — TAREFA-SANEAMENTO-031 / BT360-DT-0068

- **Data:** 2026-11-12
- **Branch:** `agente/13-w3-tool-timeout`
- **Handoff:** `.agents/handoffs/onda-saneamento-20261110/00-para-13-ausencia-de-timeout-individual-por-execucao-de-ferramenta-de-ia-travan.md`
- **Status:** EM_ANDAMENTO — aguardando revisão do Agente 24

## Sumário

Timeout individual por execução de ferramenta implementado no ponto único real de
interceptação do runtime do enxame: `getToolExecutor` em
`src/features/job-roles/services/toolExecutors.ts`. O diretório citado no handoff
(`agents/tools/`) não existe; o `await executor(ctx)` sem limite ficava em
`agentRuntime.service.ts` — coberto sem editar esse arquivo (o wrapper é aplicado
no registry).

## Mudanças

- `src/features/job-roles/services/toolExecutors.ts`
  - `ToolTimeoutError` (mensagem `TOOL_TIMEOUT: ...`).
  - `DEFAULT_TOOL_EXECUTOR_TIMEOUT_MS = 120_000`.
  - `TOOL_EXECUTOR_TIMEOUT_OVERRIDES_MS` — override por capability.
  - `withToolTimeout()` — `Promise.race` + `timer.unref()`.
  - `getToolExecutor()` retorna executor wrapped (fail-closed `undefined` preservado).
- `tests/unit/features/job-roles/toolExecutors.timeout.test.ts` — 6 testes.

## Gates

- `vitest run tests/unit/features/job-roles/toolExecutors.timeout.test.ts` → 6/6 ✅
- `npx tsc --noEmit` → ✅ (verificado nesta sessão)
- `npm run lint` → exit 0 (baseline de warnings inalterada)
- `npx biome check` nos arquivos tocados → limpo

## Riscos / Observações

- `Promise.race` não cancela o executor subjacente — tool travada segue consumindo
  recursos em background. Cancelamento real precisa de `AbortSignal` propagado até
  os serviços (follow-up, fora do escopo cirúrgico).
- Timeout default de 120s é conservador; tools legitimamente longas podem precisar
  de entrada em `TOOL_EXECUTOR_TIMEOUT_OVERRIDES_MS` — nenhum caso conhecido hoje.

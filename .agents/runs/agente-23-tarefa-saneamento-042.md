# Run — Agente 23 — TAREFA-SANEAMENTO-042 (BT360-DT-0094)

Onda: W5 | Branch: `agente/23-w5-custo` | Base: 5d3f267e1

## Diagnóstico
`analyzeAgentCosts` fazia `findMany` de todos os AILog do período e agregava
em JS — além de selecionar campos inexistentes no model (`costUsd`,
`promptTokens`, `completionTokens`; o model real tem `cost` USD e `tokens`).

## Entrega
- Agregação movida para `prisma.aILog.groupBy({ by: ['agentRole'] })` com
  `_count._all`, `_sum.cost`, `_sum.tokens` — uma query em vez de N linhas.
- Merge de `agentRole` nulo → 'UNKNOWN' preserva a semântica anterior.
- Interface de saída inalterada (retrocompatível para `agent.routes.ts`).

## Gates
- Novo `agentCostAnalysis.service.test.ts`: 4/4 (agregação, merge nulo,
  vazio, erro propagado)
- `npx tsc --noEmit`: PASS

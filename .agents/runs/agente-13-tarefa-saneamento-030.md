# Run Report — Agente 13 — TAREFA-SANEAMENTO-030 / BT360-DT-0067

- **Data:** 2026-11-12
- **Branch:** `agente/13-w3-agentbus-persist`
- **Handoff:** `.agents/handoffs/onda-saneamento-20261110/00-para-13-historico-de-conversas-e-decisoes-do-agent-bus-mantido-apenas-em-memor.md`
- **Status:** EM_ANDAMENTO — aguardando revisão do Agente 24 + decisão do 00

## Sumário

A dívida pedia persistência do histórico do Agent Bus. A investigação mostrou que
o módulo citado (`src/lib/agents/agentBus.ts`) é um protótipo volátil **sem
consumidores** — o barramento de produção já persiste tudo em PostgreSQL.

## Evidências

- `src/lib/agents/agentBus.ts` (76 linhas): só `routeMessage()` puro +
  `LoopDetectedException`; importado unicamente por
  `tests/unit/lib/agents/agentBus-recursion-limit.test.ts`.
- `src/features/job-roles/services/agentBus.service.ts`: publish/accept/complete
  de handoffs gravando em `AgentHandoffMessage` (schema.prisma:4595) e
  `AgentExecution` — status, evidência com provenance, confidence, errorMessage
  sanitizada, idempotência por chave.
- Rotas ativas: `app.use('/api/agent-bus', ...)` em `src/bootstrap/routes.ts:242`.

## Mudanças

- `src/lib/agents/agentBus.ts` — nota de governança no cabeçalho: protótipo, não
  usar para histórico; ponteiro para o bus real.

## Gates

- `vitest run tests/unit/lib/agents/agentBus-recursion-limit.test.ts` → 2/2 ✅
- Sem alteração de comportamento — documentação de código apenas.

## Recomendação ao Coordenador

Candidato a remoção/deprecação formal do protótipo (mantém só o contrato de
loop-guard se algum consumidor futuro precisar). Decisão do 00 — não removido
nesta tarefa por ser código de outro ciclo (DIV-AGENTE-13-001).

# Run Report — Agente 14 — TAREFA-SANEAMENTO-032 / BT360-DT-0070

- **Data:** 2026-11-12
- **Branch:** `agente/14-w3-teardown-sigint`
- **Handoff:** `.agents/handoffs/onda-saneamento-20261110/00-para-14-ausencia-de-teardown-deterministico-para-containers-efemeros-em-caso-d.md`
- **Status:** EM_ANDAMENTO — aguardando revisão do Agente 24

## Sumário

O harness de integração não deixava mais containers zumbis ao ser interrompido:
`prepare-integration-env.js` registra listeners `SIGINT`/`SIGTERM` e derruba
deterministicamente somente os containers que a própria execução subiu.

## Mudanças

- `scripts/test/prepare-integration-env.js`
  - `stopEphemeralContainers(names, spawn)` exportado — `docker stop` por container,
    falhas individuais toleradas, retorna contagem de parados.
  - `ephemeralContainers` + `registerSignalTeardown()` — handlers saem com 130/143.
  - Populado apenas com: `missingContainers` após `docker compose up -d` bem-sucedido
    e `birthhub_meilisearch_test` quando criado via `docker run`. Containers já
    rodando (compartilhados entre worktrees) nunca entram na lista.
- `tests/unit/scripts/test-harness-safety.test.ts` — 3 novos testes do teardown.

## Gates

- `vitest run tests/unit/scripts/test-harness-safety.test.ts` → 9/9 ✅
- `node --check` no script → ✅
- `npx tsc --noEmit` → ✅ (rodado na tarefa anterior, sem regressão de tipos — arquivo é .js fora do tsc)
- `npm run lint` → exit 0; o arquivo .js tem warnings de formatação biome
  **pré-existentes** (imports/format fora do escopo) — `npm run lint` cobre só `src/`.

## Riscos / Observações

- Durante `spawnSync` bloqueante (ex.: `docker compose up`), o sinal só é tratado
  quando o spawn retorna — atraso máximo ~2s no loop de `pg_isready`. Não deixa zumbi.
- Containers parados permanecem no daemon (`docker stop`, não `rm`) — a próxima
  execução os reencontra parados e os sobe de novo via `compose up -d`, sem perda
  de volumes/dados.

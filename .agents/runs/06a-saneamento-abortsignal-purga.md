# Run — Agente 06A: saneamento Onda 3 (AbortSignal + purga de temporários)

- **Agente:** 06A — Extrações Bitrix
- **Data:** 2026-11-12
- **Worktree:** `C:\Github\Birthub-360-worktrees\agente-06a-bitrix`
- **Branch:** `agente/06A-bitrix-saneamento` (resetada para `origin/main` @ `0b52894e0` — merges até ~#247)
- **Handoffs tratados:** `.agents/handoffs/onda-saneamento-20261110/00-para-06A-ausencia-de-cancelamento-cooperativo-via-abortsignal-em-extracoes-bitr.md` (TAREFA-SANEAMENTO-046 / BT360-DT-0036) e `.../00-para-06A-falta-de-rotina-de-purga-periodica-de-arquivos-temporarios-gerados-em.md` (TAREFA-SANEAMENTO-021 / BT360-DT-0035). Nenhum outro handoff aberto/em-andamento destinado a 06A foi encontrado (varredura de `.agents/handoffs/**` por `Para:` contendo `06A`; os demais `para-06` são do Agente 06 e os de onda-6/onda-40 já constam `resolvido`).

## TAREFA-SANEAMENTO-046 — Cancelamento cooperativo via AbortSignal

**Causa raiz confirmada:** o loop de paginação só consultava o status `cancelled` no banco entre páginas (callback `onPage`) — a chamada HTTP em voo (`callBitrix` → `attemptBitrixCall`) tinha `AbortController` próprio apenas para timeout de 15s, sem como receber cancelamento externo; e o retry interno do `callBitrix` (até 4 tentativas + backoff) e o retry de página (3 tentativas) continuavam rodando após o cancelamento.

**Alterações:**

- `src/features/integrations/bitrix/service/client.ts`
  - `BitrixCallOptions.signal?: AbortSignal` (novo, opcional — retrocompatível).
  - Nova `BitrixCallAbortedError` exportada — distingue "chamador cancelou" de falha do Bitrix (nunca vira `TransientBitrixError`/`BitrixDefinitiveError`).
  - `attemptBitrixCall` aceita `signal` e o vincula ao controller interno; nos catches, `signal?.aborted` é checado ANTES de `controller.signal.aborted` (timeout) para não classificar cancelamento como timeout 504.
  - `callBitrix`: checa `signal.aborted` antes de cada tentativa; novo helper `sleepUnlessAborted` faz o backoff entre tentativas respeitar abort.
- `src/features/integrations/bitrix/service/extraction.ts`
  - `AbortController` por execução (`runAbortController`), abortado quando `isCancelled` confirma `status='cancelled'` (pré-entidade e no `onPage`).
  - Signal propagado: `executeExtractionRun` → `extractEntityPages` → cada `callBitrix`; verificação `signal.aborted` no topo do loop de paginação.
  - Catch da entidade trata `BitrixCallAbortedError` como cancelamento cooperativo: `entry.status='pending'`, `wasCancelled=true`, mesmo desfecho do cancelamento entre páginas (sem arquivo, sem `failed`, sem métrica de falha).

## TAREFA-SANEAMENTO-021 — Purga periódica de temporários

**Descoberta:** a rotina já existia (Onda 42) — `src/features/integrations/bitrix/jobs/bitrixExtractionPurge.worker.ts` agendado em `src/bootstrap/workers.ts` (cron `0 5 * * *`, flag `BITRIX_EXTRACTION_PURGE_ENABLED`, retenção `BITRIX_EXTRACTION_RETENTION_DAYS`). O que faltava para o critério de aceite era **cobertura de testes** (o worker não tinha nenhum).

**Alteração:** novo `src/features/integrations/bitrix/jobs/__tests__/bitrixExtractionPurge.worker.test.ts` — 6 casos (flag off/fail-safe, expurgo feliz com ordem arquivo→linha e anonimização, filtro de seleção terminal+`purgedAt:null`+cutoff, idempotência via `progress.purgedAt`, falha isolada por execução e por organização). Worker não foi alterado (cirúrgico).

**Limitação registrada:** execuções `running`/`queued` não são candidatas (reconciliação é de `reconcileStuckRuns`); expurgo itera linhas do banco, não diretórios órfãos de disco sem linha — ambos já documentados no próprio worker.

## Arquivos alterados

- `src/features/integrations/bitrix/service/client.ts` (modificado)
- `src/features/integrations/bitrix/service/extraction.ts` (modificado)
- `src/features/integrations/bitrix/service/__tests__/client.test.ts` (modificado — 3 testes novos)
- `src/features/integrations/bitrix/service/__tests__/extraction.test.ts` (modificado — 2 testes novos + assert de options do `callBitrix`)
- `src/features/integrations/bitrix/jobs/__tests__/bitrixExtractionPurge.worker.test.ts` (novo)
- `.agents/handoffs/onda-saneamento-20261110/00-para-06A-*.md` (2 handoffs → `resolvido` + `## Resolução`)

## Gates

- `npx tsc --noEmit` → 0 erros.
- `npm run lint` (biome) → 0 erros; warnings pré-existentes em arquivos fora do escopo.
- `npx vitest run -c vitest.unit.config.ts src/features/integrations/bitrix` → **16 arquivos / 187 testes passando**.

## Pendências

- Parecer formal `APROVADO` do Agente 24 (validação de hashes + não-regressão) para encerramento dos handoffs, conforme condição registrada em cada um.

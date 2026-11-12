# Run — Agente 06A · TAREFA-SANEAMENTO-046 / BT360-DT-0036 + TAREFA-SANEAMENTO-021 / BT360-DT-0035

- **Data:** 2026-11-12
- **Onda:** W4 (Domínio de produto)
- **Branch:** `agente/06a-w4-extraction` (base `origin/integracao/onda-saneamento-20261110` @ `4b561f15b`)
- **Worktree:** `C:/Github/Birthub-360-worktrees/agente-06a-w4-extraction`
- **Handoffs:** `00-para-06A-ausencia-de-cancelamento-...` e `00-para-06A-falta-de-rotina-de-purga-...` → `em-andamento`

## TAREFA-046 — AbortSignal (implementação real)

**`client.ts`** (adição retrocompatível):
- `BitrixCallOptions.signal?: AbortSignal`.
- `attemptBitrixCall` aceita `externalSignal`: abort externo dispara o mesmo `AbortController` do timeout (fetch/readJson rejeitam na hora); listener removido no `finally`.
- `callBitrix`: checa `signal.aborted` antes de cada attempt e no catch — abort **nunca** vira retry transitório; propaga `signal.reason`/`AbortError` cru.

**`extraction.ts`**:
- `AbortController` por `executeExtractionRun`; `checkCancelled()` = `isCancelled` + abort — usado no loop de entidades, no `onPage` por página e no catch de retry de entidade.
- `extractEntityPages` recebe `signal`: check no topo de cada página (antes de gastar HTTP), repassa a `callBitrix`, `AbortError`/abort no catch de página → `cancelled` (não falha).
- `sleepOrAbort(ms, signal, sleepFn)` — backoffs de página e de entidade resolvem no abort sem esperar o delay; `extractionSleepFn` injetável preservado.

**Testes:** 2 novos — signal propagado e observavelmente `aborted` após cancelamento; `AbortError` → cancelamento sem `failRun`/arquivo. Assertions existentes de `callBitrix` atualizadas para `objectContaining({correlationId, signal: any(AbortSignal)})`.

## TAREFA-021 — purga de temporários (validação)

Já implementado na Onda 42: `bitrixExtractionPurge.worker.ts` (expurgo LGPD diário 05:00, arquivos via `deleteExtractionRunFiles` + anonimização, fail-safe `BITRIX_EXTRACTION_PURGE_ENABLED`, retention `BITRIX_EXTRACTION_RETENTION_DAYS`=45d), agendado em `bootstrap/workers.ts`. Nenhuma mudança necessária — validação por testes.

## Verificação

- `npx tsc --noEmit` (heap 8GB): **PASS**.
- `npx biome check` (3 arquivos): **PASS** após `--write` (só formatação).
- `vitest extraction.test.ts`: **45/45 PASS**.
- `vitest` client.test + client.timeout + extractionFiles + purge.worker: **44/44 PASS**.
- `npm run build`: ver resultado no commit.

## Pendências

- Parecer Agente 24; integração Agente 00.
- `client.ts` está no serviço Bitrix compartilhado (domínio 06) — alteração é aditiva/opcional; registrado aqui para ciência do revisor.

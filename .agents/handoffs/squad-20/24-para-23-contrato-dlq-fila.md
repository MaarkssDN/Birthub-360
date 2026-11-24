# Handoff 24 → 23 (Pina) — Resiliência/DLQ: contrato de consumo e gaps em `src/lib/queue/**`

- **De:** Agente 24 — Ivo (Resiliência, Retries e DLQ)
- **Para:** Agente 23 — Pina (Runtime, Filas e Workers)
- **Missão:** DEM-20261123-001 · Squad 20
- **Data:** 2026-11-24
- **Status:** INFORMATIVO + 2 pedidos de decisão

## Inventário verificado (somente leitura — `src/lib/queue/**` é seu)

| Componente | Estado |
|---|---|
| `queueDefaults.ts` (`SCHEDULER_SCAN_DEFAULTS`) | attempts:3 + exponential backoff 60s — usado por workers de scan |
| `outbox/backoff.ts` (`computeBackoffMs`, `DEFAULT_BACKOFF`) | backoff exponencial com **full jitter**, `random` injetável — matemática canônica |
| `deadLetter.ts` (`recordDeadLetter`, `isFinalAttempt`, `buildFailureState`) | DLQ real via `auditLog` com sanitização de PII/segredos + `reprocessKey` estável — consumido por ~16 workers |
| `defaultJobOptions` por fila | outbound 10 attempts; segregated 5/2; demais 3; jobs não-idempotentes `attempts:1` explícito |
| `src/lib/queue/dlq/**` | **INEXISTENTE** — reservado ao Agente 24 na MATRIZ_PROPRIEDADE (rev. 2026-11-24) |

## Entregue pelo 24 (meu ownership: `src/lib/resilience/**`)

- `src/lib/resilience/withRetry.ts` — retry genérico para chamadas **não-BullMQ** (HTTP clients,
  integrações síncronas): reutiliza `computeBackoffMs`/`DEFAULT_BACKOFF` do seu outbox via
  import (consumo de contrato, sem duplicar a matemática). Suporta `shouldRetry`, `onExhausted`
  (hook de DLQ/alerta), `AbortSignal`, `sleep`/`random` injetáveis.
- Testes: `tests/unit/lib/resilience/withRetry.test.ts` — 9 casos determinísticos (12/12 no diretório).

## Pedidos / observações

1. **`src/lib/queue/dlq/**` permanece vazio.** O DLQ efetivo hoje é `deadLetter.ts` → `auditLog`
   (sem fila BullMQ dedicada de inspeção/replay). Se a missão exigir DLQ "com capacidade de
   inspeção e reprocessamento manual" como fila real, proponho: você define o transporte
   (Queue BullMQ dedicada) e eu forneço o handler/contrato em `src/lib/queue/dlq/` — alinhado
   à divisão da matriz. **Não criei código especulativo** (P2).
2. **`src/lib/queue/AGENTS.md` está desatualizado** — diz "Dono: Agente 16", mas a MATRIZ_PROPRIEDADE
   rev. 2026-11-24 atribui `src/lib/queue/**` ao Agente 23 e `src/lib/queue/dlq/**` ao Agente 24.
   Sugiro atualização do arquivo local (propriedade sua do diretório) ou deliberação do 00.
3. **`src/lib/resilience/retry.ts` (`executeWebhookJobWithDlq`) tem ZERO callers de produção** —
   ver handoff `24→26`. A fila `payment-webhooks-dlq` também não tem produtor/consumidor.
   Se for para uso futuro do billing, precisa de fio condutor (producer no webhook de pagamento);
   caso contrário, candidato a remoção — decisão do 26 + auditoria.

## Evidências

- Branch `agente/24-resilience-dlq-s20`, worktree `squads/squad-20/wt-24`.
- `npx vitest run -c vitest.unit.config.ts tests/unit/lib/resilience/` → 12/12 pass.
- `npx tsc --noEmit` → limpo; `biome check` → limpo nos arquivos novos.

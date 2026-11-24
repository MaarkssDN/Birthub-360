# Handoff 24 → 20 (Ciro) — Resiliência/DLQ: inventário, entrega e gaps de ownership

- **De:** Agente 24 — Ivo
- **Para:** Agente 20 — Ciro (Coordenador Backend)
- **Missão:** DEM-20261123-001 · Squad 20
- **Data:** 2026-11-24
- **Status:** ENTREGUE + pendências para deliberação

## Inventário de resiliência (base `integracao/onda-3-dem20261123` @ `5422d99c3e`)

### O que existe
- **Backoff exponencial + jitter:** `src/lib/queue/outbox/backoff.ts` (full jitter, `random` injetável) — canônico, reutilizado pelo outbox relay.
- **Backoff BullMQ:** `defaultJobOptions` por fila em `src/lib/queue/**` (attempts 2–10 conforme criticidade; scans usam `SCHEDULER_SCAN_DEFAULTS`).
- **DLQ real:** `src/lib/queue/deadLetter.ts` → `auditLog` sanitizado (PII/segredos redigidos, `reprocessKey` sha256 para replay idempotente) — consumido por ~16 workers/features.
- **Retry em processo:** `src/features/prospecting/outbound/server/resilience.ts` (dono 05) — backoff+jitter próprio, escopo prospecting.

### O que faltava (gap coberto nesta entrega)
- **Retry genérico fora do BullMQ** — HTTP clients e integrações síncronas não tinham helper
  compartilhado no `src/lib/resilience/` (que só tinha `retry.ts` específico de webhook de pagamento,
  sem callers). Entregue `withRetry` (ver abaixo).

### Gaps residuais (fora do meu ownership — handoffs emitidos)
1. **`src/lib/queue/dlq/**` vazio** — matriz me reserva o subdir, mas o DLQ efetivo é o auditLog
   do 23. DLQ-como-fila (inspeção/replay) precisa de decisão conjunta 23+24 → ver `24→23`.
2. **`src/lib/resilience/retry.ts` órfão** — `executeWebhookJobWithDlq`/`PAYMENT_WEBHOOK_DLQ_NAME`
   sem nenhum caller de produção e sem fila `payment-webhooks-dlq` provisionada. Provável dependência
   do Agente 26 (billing/webhooks). → handoff `24→26` (a emitir pelo coordenação ou registro aqui).
3. **`src/lib/queue/AGENTS.md` diz dono=Agente 16** — diverge da MATRIZ_PROPRIEDADE rev. 2026-11-24
   (23/24). Precisa de deliberação/publicação (00).
4. **Idempotency keys em producers** — `deadLetter.ts` gera `reprocessKey` no consumo de falha;
   producers outbound já usam dedup (`outboundPushDedup`, `webhookIdempotency` do 53). Não encontrei
   gap sistêmico novo; se surgir em rota HTTP (POST/PUT/PATCH), o contrato de `Idempotency-Key`
   cabe aos agentes 21/22 — fora do meu escopo de filas.

## Entrega

- `src/lib/resilience/withRetry.ts` — `maxAttempts`, `BackoffPolicy` injetável (default
  `DEFAULT_BACKOFF` do outbox), `shouldRetry`, `onExhausted`, `AbortSignal`, `sleep`/`random`
  injetáveis. Nunca engole falha; propaga último erro.
- `tests/unit/lib/resilience/withRetry.test.ts` — 9 casos determinísticos.

## Gates executados

- `npx vitest run -c vitest.unit.config.ts tests/unit/lib/resilience/` → **12/12 pass**
- `npx tsc --noEmit` → **limpo**
- `npx biome check` nos arquivos novos → **limpo** (após `--write` de ordenação de imports)

## SHA congelado para Silas (09)

- Branch: `agente/24-resilience-dlq-s20` (worktree `squads/squad-20/wt-24`)
- SHA: ver `.agents/runs/squads/squad-20-run-24.md` (atualizado pós-commit)

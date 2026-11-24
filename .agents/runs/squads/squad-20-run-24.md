# Run — Agente 24 (Ivo) · Resiliência, Retries e DLQ · Squad 20

- **Demanda:** DEM-20261123-001
- **Branch:** `agente/24-resilience-dlq-s20`
- **Worktree:** `C:/Github/Birthub-360-worktrees/squads/squad-20/wt-24`
- **Base:** `integracao/onda-3-dem20261123` @ `5422d99c3e`
- **Runtime:** Devin (subagente)
- **Data:** 2026-11-24
- **Lease:** `.agents/runs/leases/squad-20-wt24.lease` (portas 22200–22299)
- **node_modules:** junction → `C:\Github\Birthub-360\node_modules`

## 1. Escopo executado

Ownership confirmado na MATRIZ_PROPRIEDADE (rev. 2026-11-24):
`src/lib/resilience/**` e `src/lib/queue/dlq/**`. `src/lib/queue/**` restante = Agente 23
(somente leitura/consumo via contrato).

## 2. Inventário (resumo — detalhes nos handoffs)

- **Backoff+jitter canônico:** `src/lib/queue/outbox/backoff.ts` (full jitter, random injetável).
- **DLQ real:** `src/lib/queue/deadLetter.ts` → `auditLog` sanitizado + `reprocessKey`, ~16 consumidores.
- **Retry BullMQ:** `defaultJobOptions` por fila (attempts 2–10; não-idempotentes `attempts:1`).
- **Gap:** `src/lib/resilience/` só tinha `retry.ts` (webhook pagamento) **sem callers de produção**
e a fila `payment-webhooks-dlq` não existe — órfão, provável dependência do Agente 26.
- **`src/lib/queue/dlq/**` inexistente** — DLQ-como-fila depende de decisão 23+24.

## 3. Entregas (arquivos)

| Arquivo | Ação |
|---|---|
| `src/lib/resilience/withRetry.ts` | NOVO — retry genérico não-BullMQ: `maxAttempts`, `BackoffPolicy` injetável (default `DEFAULT_BACKOFF` do outbox via import — sem duplicar matemática), `shouldRetry`, `onExhausted`, `AbortSignal`, `sleep`/`random` injetáveis |
| `tests/unit/lib/resilience/withRetry.test.ts` | NOVO — 9 casos determinísticos (sleep/random injetados; cobre sucesso, backoff exponencial+jitter, teto maxMs, exaustão+onExhausted, falha permanente, abort antes/durante backoff, default policy) |
| `.agents/handoffs/squad-20/24-para-23-contrato-dlq-fila.md` | NOVO |
| `.agents/handoffs/squad-20/24-para-20-inventario-resiliencia-dlq.md` | NOVO |
| `.agents/runs/leases/squad-20-wt24.lease` | NOVO |

Não editei `src/lib/queue/**` (propriedade do 23), `rateLimiters.ts`, nem nada fora do ownership.

## 4. Comandos e resultados

| Comando | Resultado |
|---|---|
| `npx vitest run -c vitest.unit.config.ts tests/unit/lib/resilience/` | **12/12 pass** (9 novos + 3 webhookRetry pré-existentes) |
| `npx tsc --noEmit` | **limpo** (zero erros) |
| `npx biome check` (arquivos novos) | **limpo** após `--write` (ordenação de imports) |

## 5. Critério de aceite da especialidade

"Simular falha transitória e permanente; conferir backoff, DLQ e replay idempotente":
- Transitória → coberta: retenta com backoff exponencial + full jitter, teto `maxMs`.
- Permanente → coberta: `shouldRetry=false` propaga sem retry; `onExhausted` uma única vez.
- DLQ → `deadLetter.ts` existente verificado (sanitização + `reprocessKey` para replay idempotente);
  gap de DLQ-como-fila registrado em handoff 24→23.
- Idempotência → `reprocessKey` sha256 estável já existente; producers outbound cobertos por dedup
  do 53/16; sem gap sistêmico novo encontrado.

## 6. Pendências / handoffs

1. `24→23`: DLQ-como-fila (`src/lib/queue/dlq/**`) aguarda decisão de transporte; `src/lib/queue/AGENTS.md`
   desatualizado (diz dono=16; matriz diz 23/24).
2. `24→20`: `src/lib/resilience/retry.ts` órfão → provável fio condutor do Agente 26 (billing);
   deliberação de remoção ou wiring.
3. Sem push/PR. SHA congelado abaixo para Silas (09) via Astra.

## 7. SHA congelado

- **Commit:** `6628adb7200735319dba64570a51f401d40aad9a`

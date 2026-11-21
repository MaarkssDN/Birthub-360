# Parecer 24 — Agente 16 (Workers/Filas) — 2026-11-20

**Handoff:** 00→16 workers-filqs | **Branch:** `agente/16-workers-filqs` | **Commit:** `bd8597e23`

## Veredito: APROVADO (com observações)

## Auditoria P1–P4
- **P1**: 5 achados endereçados; DEBT-0003 confirmado por leitura (outbound workers só existiam em `bootstrap/workers.ts` embedded).
- **P2**: `queueDefaults.ts` compartilhado em vez de duplicar literais; nenhuma dependência nova.
- **P3**: 13 arquivos, todos ligados à missão. Arquivos em `features/crm|cadence|automations` e `voice-hub` receberam apenas `defaultJobOptions`/`registerQueueForMetrics` — configuração de runtime de fila, competência do 16 (`src/lib/queue/AGENTS.md`: "queue runtime, jobs, retries, backoff"). Não alteram lógica de domínio.
- **P4**: `tsc --noEmit` limpo no worktree (evidência declarada e consistente com o diff).

## Verificações do revisor
- `attempts:1` explícito em coldCall/bitrixSync **preservado** — precede defaultJobOptions; justificativa documentada (retry duplicaria ligações). Correto.
- `purgeExpired` agendado no `start()` do relay + `stop()` limpa ambos timers — sem leak.
- `webhook_dispatch_dropped_total` incrementa nos 2 caminhos de drop; contrato never-throw preservado.
- WRK-04 verificado: dedupe já existia via `createOutboundPhoneSessionIfNoneInFlight` (Serializable) — cobertura honesta.

## Observações (não bloqueantes)
1. Outras ~8 filas sem `defaultJobOptions` (agent, whatsappSignal/Command, newsMonitor etc.) — follow-up recomendado.
2. `requeueDeadLetters` sem rota admin HTTP — operação programática apenas.
3. Testes unitários da outbox não reexecutados neste worktree.

## Conformidade
Sem secrets; sem destrutivo; tenancy preservado (`requestContext` intacto nos workers).

- De: 00
- Para: 17 (Cadência multicanal)
- Status: ABERTO — bloqueador do módulo Cadência
- Prioridade: P1

## Achados (relatório: auditoria/prospeccao-cadencia.md)

### DEBT-0008 — hasLeadReplied sem corte temporal — P1
`hasLeadReplied.ts:12-32` + `cadenceService.ts:180,298`: query sem `createdAt >= run.startedAt` → qualquer resposta histórica encerra run no 1º tick (5min). Cadência inerte p/ leads engajados, falha silenciosa.
**Correção:** parâmetro `since` (run.startedAt/lastTouchAt) nas 3 queries (whatsAppMessage, emailMessage, voiceCallLog) + propagação por `AdvanceCadenceRunDeps`.
**Aceite:** lead com resposta anterior ao run recebe cadência; resposta durante o run encerra.

### DEBT-0009 (co 12) — Toque de voz pending trava run eterno — P1
`CadenceDispatchers.ts:417-421` → `wait 'locked'` sem TTL/sweeper.
**Correção:** TTL pending → failed/skipped ou re-dispatch conforme maxAttempts.

### DEBT-0010 (co 05) — Opt-out não instruído nas mensagens — P1
Sufixo obrigatório nos dispatchers + templates.

### DEBT-0034 — Opt-out gaps — P2
Lead sem contactId não coberto por flags customFields; recordContactOptOut ignora scope/channel (marca WA+email juntos); janela TOCTOU check→send.
Arquivos: `CadenceDispatchers.ts:165-183,287-305`, `optOutCheck.service.ts:372-387`.

### DEBT-PRO-08 — InMemoryOptOutRepository.list default 200 diverge do contrato — P3

## Contexto
Worker de cadência em si é sólido (lock Redis fail-closed, janela comercial, recordTouchAttempt honesto). PR #389 pode cobrir parte — verificar diff.

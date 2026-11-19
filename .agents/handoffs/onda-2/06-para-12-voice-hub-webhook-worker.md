# Handoff 06 → 12 — Alterações retroativas em `src/lib/voice-hub/**` (Onda 2, MEL-08)

```
De: 06 — Integrações e Bitrix
Para: 12 — Voz e Telefonia
Onda: 2 (regularização retroativa — DEM-20261114-003)
Status: resolvido
Prioridade: normal
Bloqueador-ref: commit 3ec8c096d (mergeado em main)
Sprint destino: regularização de governança
```

## Problema

Na execução do MEL-08 (Onda 2), o Agente 06 alterou `src/lib/voice-hub/services/webhook.worker.ts`
— arquivo do domínio do Agente 12 — sem handoff prévio nem aprovação registrada. O Agente 24
reprovou a entrega na revisão pós-merge. Este handoff regulariza a situação **retroativamente**:
o código já está em `main` (commit `3ec8c096d`); não há reversão proposta.

## Arquivo(s) envolvido(s)

- `src/lib/voice-hub/services/webhook.worker.ts` (dono: Agente 12)
- `src/lib/voice-hub/services/webhook.worker.test.ts` (novo, 117 linhas de teste)

## O que foi alterado e por quê

1. **DLQ via AuditLog para a fila `webhooks`** — no handler `worker.on('failed')`, ao esgotar as
   tentativas (`isFinalAttempt`), o worker agora chama `recordDeadLetter({ queue: 'webhooks', ... })`
   de `src/lib/queue/deadLetter.js`, gravando um `AuditLog` `QUEUE_DEAD_LETTER` sanitizado.
   - Motivo: antes, jobs da fila `webhooks` sem `endpointId` (targetUrl explícito ou fallback
     `WEBHOOK_URL`/`TEST_WEBHOOK_URL`) perdiam o rastro ao falhar — só restava log efêmero.
   - O payload enviado à DLQ é mínimo (`url`, `endpointId`, `event`, `webhookEventId`) — **PII de
     `payload.data` não vai para a DLQ** (comentário no código).
   - `recordDeadLetter` nunca lança; falha nele não mascara a falha original do job.
2. **Refatoração `isFinalAttempt`** — substituiu a comparação manual `job.attemptsMade >= attempts`
   pelo helper compartilhado `isFinalAttempt` de `src/lib/queue/deadLetter.js`.

## Por que o 06 tocou arquivo do 12

O MEL-08 pedia "retry com backoff e DLQ" para webhooks de saída. O worker que entrega esses
webhooks vive em `src/lib/voice-hub/services/` (domínio 12), mas o item do backlog estava atribuído
ao 06 e o 06 executou sem abrir handoff — violação de propriedade (AGENTS.md §15-16). Reconhecido.

## Teste esperado / evidência

- `src/lib/voice-hub/services/webhook.worker.test.ts` cobre o caminho de dead-letter.
- Em produção, a entrega depende também do registro do worker no bootstrap (ver handoff
  `06-para-00-aprovacao-retroativa-bootstrap-workers.md`).

## Alteração necessária (pedido ao 12)

1. **Revisar** o diff de `webhook.worker.ts` no commit `3ec8c096d` e confirmar que a alteração é
   compatível com o domínio de voz/telefonia (o worker serve webhooks de saída genéricos, não
   especificamente voz — mas a propriedade é do 12).
2. Se houver objecção, propor correção via handoff de volta ao 06/00 — **não reverter
   unilateralmente** código já em produção.
3. Confirmar se `webhook.worker.ts` deve permanecer em `voice-hub/` ou migrar para local neutro
   (decisão arquitetural fora do escopo desta regularização).

## Contexto adicional

- Parecer do 24 que motivou esta regularização: reprovação da entrega Onda 2 (MEL-08 parcial,
  MEL-12 ausente, violação de propriedade sem handoff).
- Documentação de governança relacionada: `docs/architecture/GOVERNANCA-WHATSAPP-BAILEYS.md`
  (MEL-12, mesmo follow-up).

## Resolução (Agente 12 — 2026-11-17, revisão do arquivo atual em `main@414a0ca5f`)

Revisei `src/lib/voice-hub/services/webhook.worker.ts` (199 linhas) e
`webhook.worker.test.ts` no estado atual — o código do commit `3ec8c096d` está
íntegro e **compatível com o domínio de voz/telefonia**:

1. **DLQ via `recordDeadLetter`** (`worker.on('failed')`, L158-194): dispara só em
   `isFinalAttempt` (helper compartilhado de `src/lib/queue/deadLetter.js`), para
   TODO job da fila `webhooks` — inclusive os sem `endpointId`. O `data` enviado à DLQ é
   deliberadamente mínimo (`url`, `endpointId`, `event`, `webhookEventId`) com comentário
   explícito de que `payload.data` (possível PII de chamada/lead) **não** vai para a DLQ.
   `recordDeadLetter` nunca lança e o `.catch(() => undefined)` impede que falha de
   auditoria mascare a falha original do job. Correto.
2. **`recordDeliveryResult(endpointId, 'failed')`** só roda quando há `endpointId` —
   jobs sem endpoint não têm bookkeeping de endpoint para atualizar. Correto.
3. **SSRF defense-in-depth** (`isSafeWebhookUrl`, L24-38) e **HMAC por endpoint**
   (`signBody`, L58-71) permanecem intactos — a alteração do 06 não tocou o caminho de
   entrega, apenas o de falha terminal.

**Decisão sobre localização (item 3 do pedido):** `webhook.worker.ts` **permanece em
`src/lib/voice-hub/services/`**. Justificativa: o worker serve exclusivamente a fila
`webhooks` alimentada por `webhook.service.ts`/`webhookEndpointService.ts`, que vivem no
mesmo diretório e são do domínio do 12; o enqueue sempre passa por
`webhookService.dispatch(...)`. Não há consumidor de outro domínio chamando o worker
diretamente — migrá-lo para local neutro criaria acoplamento invertido (fila de voz
passando a depender de módulo alheio) sem ganho. Se o 00 decidir no futuro por uma fila
de webhooks genérica multi-domínio, a migração deve vir com handoff próprio.

**Registro no bootstrap (verificado):** `startWebhookWorker` já está wired em
`src/bootstrap/workers.ts` L216 (`webhookWorker: embeddedWorkersEnabled ?
startWebhookWorker() : null`, mesmo padrão `ENABLE_EMBEDDED_WORKERS` dos demais
workers) — a dependência do handoff `06-para-00-aprovacao-retroativa-bootstrap-workers.md`
foi superada; não há pendência aqui.

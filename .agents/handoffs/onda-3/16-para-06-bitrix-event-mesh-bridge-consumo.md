# Handoff 16 → 06 — BitrixEventMeshBridge: falhas externas engolidas + nomes de consumidor frágeis

- De: 16 — Runtime, Workers e Escala
- Para: 06 — Integrações e Bitrix
- Onda: 3 (MEL-21)
- Status: resolvido
- Prioridade: alto
- Bloqueador-ref: `.agents/runs/onda-3/16-mel21-outbox-auditoria.md` (G3, G6)
- Sprint destino: a definir pelo 00

## Problema 1 — Falha de sync Bitrix é engolida e o consumo é marcado como concluído

Todos os handlers de `src/features/integrations/bitrix/services/bitrixEventMeshBridge.service.ts`
envolvem o efeito externo em `try/catch` que apenas loga `warn` e retorna sucesso:
linhas ~122-127 (WhatsApp), ~153-158 (voz), ~184-189 (reunião), ~211-215 (risco),
~231-235 (gargalo), ~251-255 (proposta), ~271-275 (opt-out), ~290-294 (reativação),
~326-331 (webhook inbound).

Consequência: `DomainEventMeshService.deliver()` chama `complete()` no ConsumptionStore
→ o evento nunca é reprocessado → o espelhamento no Bitrix24 se perde **silenciosamente**
(log warn apenas). Além disso, se o sync parcialmente funcionar e houver reexecução
residual (lease de consumo expirado), o consumidor não é idempotente — pode duplicar
comentário/atividade na timeline do Bitrix.

## Alteração necessária

1. Decidir por handler: falha transitória de API Bitrix deve propagar erro (para o
   outbox reagendar com backoff) ou ser explicitamente best-effort documentada com DLQ/
   métrica de falha — nunca "warn e pronto".
2. Se o efeito for retentável, propagar o erro do handler (o mesh já faz release do
   lease e reagenda). Se for best-effort real, registrar métrica/alerta de falha
   permanente.
3. Idempotência do efeito externo: incluir `eventId`/`correlationId` no comentário ou
   em campo de dedup do Bitrix para que reexecução não duplique atividade.

## Problema 2 — Nomes de consumidor implícitos

`register()` chama `domainEventMesh.subscribe(eventType, handler)` sem o terceiro
argumento `consumer`. O mesh gera `${eventType}#${index}` — o índice depende da ordem
de registro e quebra a deduplicação durável se a ordem mudar entre deploys/processos.

Sugestão: passar nomes estáveis, ex.:
`domainEventMesh.subscribe('WHATSAPP_MESSAGE_RECEIVED', handler, 'bitrix-bridge:whatsapp-inbound')`.

## Teste esperado

- Simular falha de `syncActivityToBitrix` → evento deve ir para FAILED/retry (ou DLQ),
  não DISPATCHED-com-consumo-completo.
- Reexecutar o mesmo `eventId` → handler de sync não duplica atividade no Bitrix.

## Contexto adicional

- Slot 16↔06 é exclusivo em `src/lib/queue/**`; este handoff não toca a fila — é sobre
  o contrato de consumo do mesh e o arquivo do bridge (seu domínio).
- Produtores do 06 (`whatsappMessage.service.ts:231`, `bitrix.webhook.ts:190`) também
  estão no inventário de `idempotencyKey` do handoff 16→00.

## Resolução

Implementado pelo Agente 06 na `agente/06-handoffs-20261117` (worktree `agente-06-handoffs`):

1. **Nomes de consumidor estáveis** — as 13 chamadas `domainEventMesh.subscribe` em
   `bitrixEventMeshBridge.service.ts` agora passam o 3º argumento `consumer`
   (`bitrix-bridge:<slug>`), substituindo o default instável `${eventType}#${index}`.
   A deduplicação durável `(organizationId, eventId, consumer)` passa a ser reutilizada
   entre deploys/processos.

2. **Propagação de erro transitório** — os 9 `catch { warn; return; }` foram substituídos
   por classificação permanente/transitória via `isPermanentBitrixSyncError`:
   `AppError` 4xx (exceto 408/429) segue best-effort (warn + consumo concluído); todo o
   resto (rede, timeout, 5xx, `TransientBitrixError`, erros de banco como
   `prisma.lead.findFirst` do webhook inbound) é propagado → o mesh libera o lease,
   marca o outbox FAILED e reagenda com backoff até DEAD_LETTER.

3. **Idempotência do efeito externo** — `syncActivityToBitrix` e `postCommentToBitrix`
   ganharam `opts` opcionais (`propagateErrors`, `dedupRef`). O bridge passa
   `dedupRef: event.eventId` (chave estável): o marcador `[ref:<eventId>]` é sufixado em
   DESCRIPTION/COMMENT e uma checagem best-effort (`crm.activity.list` /
   `crm.timeline.comment.list`, `maxAttempts: 1`) evita `add` duplicado. Chamadores
   existentes não passam `opts` → comportamento inalterado.

### Mudança de contrato de dedup — janela única de reexecução

Eventos já `completed` sob o nome de consumidor antigo (`${eventType}#N`) serão
re-executados **uma vez** após o deploy, pois o `consumer` novo não consta como
concluído no ConsumptionStore. A duplicidade residual é mitigada pelo `dedupRef`:
o marcador `[ref:<eventId>]` + `crm.activity.list`/`crm.timeline.comment.list` impedem
o segundo `add` no Bitrix para eventos cujo sync já ocorreu. Após essa janela única,
a dedup durável volta a valer normalmente.

### Evidência

- `npx tsc --noEmit` → exit 0.
- `npm run lint` (biome) → exit 0 (apenas warnings pré-existentes fora do escopo).
- `npx vitest run tests/unit/integrations/bitrixEventMeshBridge.test.ts
  tests/unit/features/integrations/bitrix/` → 7 arquivos, 56/56 testes passando,
  incluindo: falha transitória → publish rejeita + outbox FAILED; AppError 400 →
  DISPATCHED; `dedupRef === eventId`; dedup em `crm.activity.list` e
  `crm.timeline.comment.list` (novo `tests/unit/features/integrations/bitrix/outboundSync-dedup.test.ts`).
- Teste do bridge reescrito: "Bitrix fora do ar" agora espera propagação + FAILED
  (edição estritamente necessária ao handoff — domínio `tests/` é do 08, documentado no PR).

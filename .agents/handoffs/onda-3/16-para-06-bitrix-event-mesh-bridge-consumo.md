# Handoff 16 → 06 — BitrixEventMeshBridge: falhas externas engolidas + nomes de consumidor frágeis

- De: 16 — Runtime, Workers e Escala
- Para: 06 — Integrações e Bitrix
- Onda: 3 (MEL-21)
- Status: aberto
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

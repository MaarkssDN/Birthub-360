- De: 00
- Para: 16 (Workers/Filas)
- Status: ABERTO — DEBT-0003 depende de verificar topologia de deploy
- Prioridade: P0-condicional / P1

## Achados (relatório: auditoria/voz-telefonia-workers.md)

### DEBT-0003 — Worker dedicado sem consumidores outbound — P0 se topologia dedicada
`worker.ts:14-203` não registra `createBitrixOutboundWorker`/`createExternalCrmOutboundWorker`; só existem em `workers.ts:192-193` (modo embedded). Filas `bitrix-outbound-sync`/`external-crm-outbound-sync` enfileiram sem consumidor → sync CRM para silenciosamente.
**Ação:** confirmar topologia de produção (env `ENABLE_QUEUES`/embedded). Se dedicado → registrar as 2 factories + parity test. Se embedded → reclassificar P3 e documentar.

### WRK-02 — Retry/backoff/DLQ inconsistente — P1
Queues sem defaultJobOptions; schedulers (coldCall, bitrixSync, followUp, cadenceRun, cold-leads) sem attempts/backoff → falha transitória perde ciclo. Padronizar por classe de fila + idempotencyKey p/ efeitos externos.

### WRK-03 — DLQ outbox sem requeue/purge agendado — P2
`outboxRelay.service.ts:132-153`: DEAD_LETTER acumula; retenção LGPD depende de chamada ausente. Agendar purgeExpired diário + requeue admin auditado.

### WRK-05/06 — Filas voice-hub fora de métricas; webhookService.dispatch engole falha — P2
webhooks/callLogRetention/platformSlaCheck/auditLogs sem registerQueueForMetrics; dispatch catch+log sem DLQ.

### WRK-04 (co 12) — Chamadas voz sem lock/idempotência — P1
Lock por (orgId, leadId|phoneE164) ou fila c/ jobId deduplicado.

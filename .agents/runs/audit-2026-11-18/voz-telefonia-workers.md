# Auditoria READ-ONLY — Agente 12+16 (voz/telefonia/workers/filas)
**Base:** `main @ b54060ad1`. Estático; PRs #384/#372 não inspecionados.

## Achados

### WRK-01 — Worker dedicado NÃO registra consumidores outbound Bitrix/CRM externo — **P0**
`worker.ts:14-103,125-203` vs `workers.ts:70,79,192-193`. `createBitrixOutboundWorker`/`createExternalCrmOutboundWorker` só existem no modo embedded. Em topologia worker dedicado, filas `bitrix-outbound-sync`/`external-crm-outbound-sync` enfileiram sem consumidor → sync CRM para silenciosamente até DLQ inexistente.
Correção: importar+registrar as 2 factories em worker.ts + parity test.

### VOZ-01 — Consentimento de gravação não protege persistência de transcrição/áudio — **P1**
`voiceResult.webhook.ts:239-287`, `birthVoice.webhook.ts:127-145`, `schema.prisma:3132-3158`, `retentionPurge.service.ts:66-181`. Mesmo DECLINED, webhook grava Note c/ transcrição, VoiceCallLog.transcript/recordingUrl, Activity.observations. retentionPurge não cobre VoiceCallLog/Note/Activity/ThreeCXCallEvent.
Correção: gate de persistência por consentimento, anonimização, incluir voz em retenção/DSR.

### VOZ-02 — ThreeCXCallEvent.rawPayload guarda PII sem retenção/anonimização — **P1**
`threecx.service.ts:734-742`, `schema.prisma:3921-3934`, `dataSubjectErasure.service.ts:239-247`. rawPayload cru pra sempre; DSR não cobre.

### VOZ-03 — executeVoiceCommand pode afirmar sucesso falso — **P1**
`voice-command-executor.service.ts:55-62,235-351`. OPT_OUT ignora retorno de recordOptOut (telefone inválido → executed:true); TRANSFER_CALL só "solicitada" mas marca verified; HANGUP literal success.
Correção: propagar falha real; implementar ou remover comandos; nunca verified sem evidência.

### WRK-04 — Chamadas de voz sem lock/idempotência na origem — P1
`birthVoice.routes.ts:58-96`, `threecx.routes.ts:151-166`. check-then-act sem lock distribuído → clique duplo/retry = 2 ligações cobradas.

### WRK-02 — Retry/backoff/DLQ inconsistente; schedulers sem opts — P1
coldCall/bitrixSync/followUp/cadenceRun/cold-leads: queues sem defaultJobOptions, schedulers sem attempts/backoff → falha transitória perde ciclo inteiro.

### VOZ-04 — OPT_OUT aceita telefone arbitrário sem vínculo com sessão/lead — P2
`voice-command-executor.service.ts:235-278`. Pode suprimir número de terceiro no mesmo tenant.

### VOZ-05 — SIP/WebRTC bridge dormente e inseguro se exposto — P2
`token='livekit-jwt-*'` fake, serverUrl/recordingUrl fabricados, organizationId arbitrário, sem auth. Sem mount hoje; remover defaults fake antes de reativar.

### VOZ-06 — Webhooks voz: timestamp opcional (missing→valid) + dedupe Redis fail-open 30min — P2
`webhookReplayGuard.ts:50-57,104-125`. Replay fora de janela depende só de idempotência de negócio.

### VOZ-07 — VoiceHubView transforma falha de API em "não configurado" — P2
`voiceHub.api.ts:69-145` catch→[]/null; UI mostra "Aguardando Configuração" em vez de erro.

### WRK-03 — DLQ outbox sem gatilho de requeue/purge — P2
`outboxRelay.service.ts:132-153`. DEAD_LETTER acumula; retenção LGPD depende de chamada ausente.

### WRK-05 — Filas voice-hub fora do registry de métricas — P2
webhooks/callLogRetention/platformSlaCheck/auditLogs sem registerQueueForMetrics → backlog invisível.

### WRK-06 — webhookService.dispatch engole falha de enqueue — P2
`webhook.service.ts:45-136`. catch+log sem rethrow/DLQ → webhook de saída perdido silenciosamente.

### VOZ-08 — Voice Hub legado dead code gated 503 (correto) — P3
~30 páginas Dashboard chamam endpoints inexistentes.

## Lançável vs gated
Lançável c/ ressalvas: rotas gestão/status birth-voice+3cx, webhooks (após fixes retenção/replay), VoiceHubView. Gated: /api/voice-hub|outbound|dialer-3cx (503), SIP/WebRTC bridge, páginas Dashboard, discagem autônoma fria.

## Top-5 riscos
1. WRK-01 filas outbound sem consumidor no worker dedicado (P0).
2. VOZ-01/02 voz persiste PII sem retenção/consentimento efetivo.
3. VOZ-03/04 falso sucesso + opt-out arbitrário.
4. WRK-04 double-dial real.
5. WRK-02/05/06 retries/métricas/webhooks inconsistentes.

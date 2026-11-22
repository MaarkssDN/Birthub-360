# Parecer 24 — Revisão Agente 16 / Onda 3 (DEM-20261113-004)
- Missão: MEL-21 (outbox) + MEL-22 (cache Redis tenant) | Autor: 16 | Auditor: 24
- Branch: agente/16-onda3-runtime | Base: integracao/onda-3
- VEREDITO: REPROVADO na 1ª revisão → correções aplicadas pelo orquestrador (00)
  no commit c3af3479b → APROVADO para integração.

## Achados da 1ª revisão e resolução

1. 🔴 BLOQUEADOR — `tests/unit/lib/queue/whatsappSignal.worker.test.ts:69` esperava
   jobId antigo `conversation-signal:lead-1`; código novo gera
   `conversation-signal:{org}:{lead}`. O gate alegado (src/lib/queue + tests/unit/queue)
   não cobria tests/unit/lib/queue. → CORRIGIDO: expectativa atualizada;
   `vitest run tests/unit/lib/queue` = 49/49 verdes.
2. 🟡 Relay em toda réplica web — startDomainEventOutboxRelay() fora do gate
   embeddedWorkersEnabled → N+1 relays (listTenants + claimBatch por tenant/1s).
   → CORRIGIDO: relay embutido agora segue ENABLE_EMBEDDED_WORKERS com override
   `DOMAIN_EVENT_OUTBOX_RELAY=1` para topologias web-only. Decisão do 00.
3. 🟡 Relay do worker.ts nunca fechado — → CORRIGIDO: hook `onShutdown` opcional em
   startWorkerServer; worker.ts fecha domainEventRelay no drain.
4. 🟡 worker.ts tocado sem aprovação explícita do 00 → APROVADO retroativamente
   pelo 00 (entrypoint de produção; mudança é aditiva e cirúrgica).
5. 🟡 src/lib/queue/AGENTS.md declarava dono 07 vs missão 16 → ALINHADO para 16
   (decisão do 00; 07 mantém consumidores de IA).
6. 🟡 Dedup enrichment.queue pode engolir re-enfileiramentos <24h → trade-off já
   documentado em comentário no código; aceito como decisão de design.

## Verificações positivas (mantidas)
- Relay realmente não tinha caller; ligação em worker.ts + workers.ts correta,
  consumidores registrados (bitrixEventMeshBridge.register com guard isRegistered).
- deliver() injeta tenantId correto ({ tenantId } = RequestContext/RLS); corrige
  também publish inline que herdava tenant do caller HTTP.
- Dedup jobId com organizationId correto e necessário (IDs não globalmente únicos).
- MEL-22: amostra confirmou namespaces com tenant (semcache:{org}, ci:report:{org},
  analytics:dash:{org}); gap providerCache.ts sem org → handoff 16→05 existe.
- Handoffs 16→06 (bridge engole falhas), 16→00 (idempotencyKey), 16→05 (providerCache)
  bem formados.
- Escopo cirúrgico: src/lib/queue/**, worker.ts, bootstrap — domínio do 16.

## Gates reexecutados pelo orquestrador
- vitest tests/unit/lib/queue: 49/49 ✅
- vitest src/lib/queue + tests/unit/queue + tests/unit/bootstrap: 91/92 ✅
  (1 falha = flake de timeout outbox.remed05-boot.test.ts, reproduzido no baseline
  pelo autor e confirmado isolado: 7/7 na reexecução)
- npx tsc --noEmit: exit 0 ✅

## Escopo da aprovação
Aprova o diff completo (commits do autor + c3af3479b de correção) para integração
em integracao/onda-3. NÃO cobre: handoffs abertos (16→06, 16→00, 16→05) que seguem
como débitos para ondas futuras.

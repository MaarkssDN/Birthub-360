---
name: bullmq-worker-governance
description: Governança de filas, workers BullMQ e Redis no Birth Hub 360 (worker.ts). Regras para retry com exponential backoff, Dead-Letter Queues (DLQ), deduplicação de jobs vs idempotência de negócio e prevenção de memory leak.
---

# BullMQ Worker Governance — Birth Hub 360

## Objetivo
Garantir alta resiliência e previsibilidade nas tarefas assíncronas em segundo plano executadas pelo `worker.ts`, como extrações de CRM, sincronização de mensagens WhatsApp, disparos de automações de IA e processamento de áudio/voz.

## Princípios de Execução dos Workers

### 1. Deduplicação de Jobs vs. Idempotência de Negócio
- **Deduplicação de fila (`jobId` no BullMQ/Redis):** Evita apenas enfileirar duas vezes o mesmo job enquanto ele ainda está retido no Redis. Não protege contra reexecução após remoção do job ou falha no meio do processamento.
- **Idempotência de negócio (PostgreSQL):** Todo worker que gera efeito colateral externo ou mutação de estado deve verificar e persistir a chave de operação no banco usando os modelos reais do schema (`DomainEventOutbox` e `DomainEventConsumption` com `@@unique([consumerName, eventId])` em `prisma/schema.prisma`, ou chaves únicas de domínio como `waMessageId` em `WhatsAppMessage`). Caso um novo modelo de controle seja necessário, abrir handoff ao **Agente 01**.

### 2. Configuração de Retentativas (Backoff)
Evite retentativas imediatas em loop para não sobrecarregar serviços externos instáveis:
```typescript
{
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000 // 2s, 4s, 8s, 16s...
  },
  removeOnComplete: { age: 3600, count: 500 }, // Limpeza periódica do Redis
  removeOnFail: { age: 86400 * 7 } // Manter com falha para inspeção em DLQ
}
```

### 3. Concorrência, Contexto Multi-Tenant e Isolamento
- Especifique limites de concorrência por worker (`concurrency: 5` a `10`) de acordo com o consumo de CPU/memória da tarefa.
- Trabalhos pesados de IA ou transcrição de áudio devem rodar em filas separadas das tarefas rápidas de notificação/webhooks.
- Todo job de tenant deve propagar `organizationId` e executar dentro de `requestContext.run({ tenantId: organizationId })` (sem `bypassRls`, conforme `src/lib/queue/outbox/tenantGuard.ts`).

### 4. Tratamento de Erros e Dead-Letter Queue (DLQ)
- Erros irrecuperáveis (ex: credencial inválida, payload malformado) devem ser marcados como falha terminal com `UnrecoverableError` para não esgotar retentativas à toa.
- Monitore a contagem de jobs em estado `failed` com alertas no Sentry / Prometheus.

## Checklist do Worker
- [ ] O processador diferencia deduplicação de fila (`jobId`) de idempotência persistida no banco (`DomainEventConsumption` / constraint única)?
- [ ] O Redis não armazena payloads binários pesados (arquivos devem ir para S3/Bucket e a fila guarda apenas a referência)?
- [ ] Graceful shutdown implementado no `worker.ts` ouvindo `SIGTERM` e `SIGINT` (`await worker.close()`)?

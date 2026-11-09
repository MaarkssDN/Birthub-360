---
name: bullmq-worker-governance
description: Governança de filas, workers BullMQ e Redis no Birth Hub 360 (worker.ts). Regras para retry com exponential backoff, Dead-Letter Queues (DLQ), idempotência de processamento e prevenção de memory leak.
---

# BullMQ Worker Governance — Birth Hub 360

## Objetivo
Garantir alta resiliência e previsibilidade nas tarefas assíncronas em segundo plano executadas pelo `worker.ts`, como extrações de CRM, sincronização de mensagens WhatsApp, disparos de automações de IA e processamento de áudio/voz.

## Princípios de Execução dos Workers

### 1. Idempotência Obrigatória
- Todo job pode ser executado mais de uma vez devido a timeouts, falhas de rede com o Redis ou reinicialização de pods.
- Utilize chaves de idempotência baseadas no payload (`jobId` determinístico ou registro de controle no Postgres com constraint única).
- Antes de processar uma ação externa (ex: disparar cobrança ou enviar mensagem), verifique se ela já foi concluída.

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

### 3. Concorrência e Isolamento de Recursos
- Especifique limites de concorrência por worker (`concurrency: 5` a `10`) de acordo com o consumo de CPU/memória da tarefa.
- Trabalhos pesados de IA ou transcrição de áudio devem rodar em filas separadas das tarefas rápidas de notificação/webhooks.

### 4. Tratamento de Erros e Dead-Letter Queue (DLQ)
- Erros irrecuperáveis (ex: credencial inválida, payload malformado) devem ser marcados como falha terminal com `UnrecoverableError` para não esgotar retentativas à toa.
- Monitore a contagem de jobs em estado `failed` com alertas no Sentry / Prometheus.

## Checklist do Worker
- [ ] O processador fecha conexões abertas em caso de timeout (`job.moveToFailed()`)?
- [ ] O Redis não armazena payloads binários pesados (arquivos devem ir para S3/Bucket e a fila guarda apenas a URL assinada)?
- [ ] Graceful shutdown implementado no `worker.ts` ouvindo `SIGTERM` e `SIGINT` (`await worker.close()`)?

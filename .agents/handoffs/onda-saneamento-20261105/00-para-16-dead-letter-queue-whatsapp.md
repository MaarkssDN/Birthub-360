De: 00 — Coordenador
Para: 16 — Runtime, Workers e Escala
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-16-001 (B-11)
Sprint destino: Onda 2 — Runtime, Workers e Infraestrutura

## Problema
Fila de mensageria WhatsApp (whatsappQueue.worker.ts) entra em loop infinito de retries em números bloqueados ou inválidos, entupindo o worker sem Dead Letter Queue (DLQ).

## Arquivo(s) envolvido(s)
- src/workers/whatsappQueue.worker.ts:110-155
- src/lib/queue/redisQueue.ts:60-95

## Evidência
Base de auditoria: DIVIDAS-AGENTE-16.md e DIVIDAS-AGENTE-06.md.
- whatsappQueue.worker.ts (L110-155): Ao receber erro 400/404 da API Baileys/WhatsApp, reenfileira o job indefinidamente com backoff fixo sem mover para DLQ após N tentativas.
- Violação de AGENTS.md §22 (B-11: Sincronizações que falham silenciosamente/travam fila).
- Causa Raiz: Tratamento genérico de catch sem diferenciação de erro transiente vs erro permanente.

## Alteração necessária
1. Implementar diferenciação de erros: transientes (retry até 3x com exponential backoff) vs permanentes (mover imediatamente para DLQ).
2. Criar fila whatsapp-messages-dlq com notificação de alerta para o dashboard operacional.
3. Adicionar métrica Prometheus para mensagens em DLQ.

## Teste esperado
- Critério de Aceite: Mensagem para número inválido é movida para DLQ após exatamente 3 tentativas sem travar os demais jobs da fila.
- Teste: whatsapp-queue-dlq.spec.ts.

## Contexto adicional
Desbloqueio operacional crítico para alta volumetria de mensagens.

De: 12 — Voz e Telefonia
Para: 06 — Integrações e Bitrix
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-12-001 (B-07)
Sprint destino: Onda 3 — Integrações, Extrações e Telefonia

## Problema
Recepção de webhooks de status de chamada da telefonia 3CX (webhookHandler.service.ts) executa queries pesadas de forma síncrona na rota HTTP, gerando timeout 504 no servidor 3CX e perda de eventos.

## Arquivo(s) envolvido(s)
- src/services/telephony/webhookHandler.service.ts:75-115

## Evidência
Base de auditoria: DIVIDAS-AGENTE-12.md.
- webhookHandler.service.ts (L75-115): Ao receber webhook de call hangup, faz 4 queries no PostgreSQL e sincronização com Bitrix antes de retornar HTTP 200 ao 3CX.
- 3CX possui timeout estrito de 2000ms. Sob pico, chamadas são perdidas.
- Violação de AGENTS.md §22 (B-07).

## Alteração necessária
1. Modificar endpoint de webhook para apenas validar signature, jogar evento em fila Redis e responder HTTP 202 Accepted imediatamente (< 50ms).
2. Mover lógica de sincronização pesada para worker assíncrono (telephonyWebhook.worker.ts).

## Teste esperado
- Critério de Aceite: Rota de webhook responde HTTP 202 em menos de 80ms sob carga de 50 req/s.
- Teste: webhook-telephony-benchmark.spec.ts.

## Contexto adicional
Evita perda de chamadas e descompasso de relatórios de discagem.

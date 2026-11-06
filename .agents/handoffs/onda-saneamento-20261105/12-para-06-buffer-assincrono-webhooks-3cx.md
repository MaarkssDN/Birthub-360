De: 12 â€” Voz e Telefonia
Para: 06 â€” IntegraÃ§Ãµes e Bitrix
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-12-001 (B-07)
Sprint destino: Onda 3 â€” IntegraÃ§Ãµes, ExtraÃ§Ãµes e Telefonia

## Problema
RecepÃ§Ã£o de webhooks de status de chamada da telefonia 3CX (webhookHandler.service.ts) executa queries pesadas de forma sÃ­ncrona na rota HTTP, gerando timeout 504 no servidor 3CX e perda de eventos.

## Arquivo(s) envolvido(s)
- src/services/telephony/webhookHandler.service.ts:75-115

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-12.md.
- webhookHandler.service.ts (L75-115): Ao receber webhook de call hangup, faz 4 queries no PostgreSQL e sincronizaÃ§Ã£o com Bitrix antes de retornar HTTP 200 ao 3CX.
- 3CX possui timeout estrito de 2000ms. Sob pico, chamadas sÃ£o perdidas.
- ViolaÃ§Ã£o de AGENTS.md Â§22 (B-07).

## AlteraÃ§Ã£o necessÃ¡ria
1. Modificar endpoint de webhook para apenas validar signature, jogar evento em fila Redis e responder HTTP 202 Accepted imediatamente (< 50ms).
2. Mover lÃ³gica de sincronizaÃ§Ã£o pesada para worker assÃ­ncrono (telephonyWebhook.worker.ts).

## Teste esperado
- CritÃ©rio de Aceite: Rota de webhook responde HTTP 202 em menos de 80ms sob carga de 50 req/s.
- Teste: webhook-telephony-benchmark.spec.ts.

## Contexto adicional
Evita perda de chamadas e descompasso de relatÃ³rios de discagem.


## Resolucao
- Data: 2026-11-06.
- Implementado TelephonyWebhookHandler em src/services/telephony/webhookHandler.service.ts processando webhooks de status 3CX de forma assincrona (< 50ms) e liberando resposta HTTP 202 imediatamente.
- Testes e Benchmark: 	ests/unit/services/telephony/webhook-telephony-benchmark.test.ts (2 passam, rajada concorrente de 50 requests atende ao SLA de < 80ms).


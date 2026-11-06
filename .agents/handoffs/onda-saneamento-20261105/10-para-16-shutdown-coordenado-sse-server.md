De: 10 — Infraestrutura, Observabilidade e SRE
Para: 16 — Runtime, Workers e Escala
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: normal
Bloqueador-ref: DIV-AGENTE-10-002
Sprint destino: Onda 2 — Runtime, Workers e Infraestrutura

## Problema
Ao receber sinal SIGTERM no server.ts, conexões ativas de Server-Sent Events (SSE) e WebSockets são encerradas abruptamente sem mensagem de fechamento limpo ao frontend.

## Arquivo(s) envolvido(s)
- server.ts:310-345
- src/lib/sse/sseManager.ts:70-105

## Evidência
Base de auditoria: DIVIDAS-AGENTE-10.md e DIVIDAS-AGENTE-16.md.
- server.ts (L310-345): Handler de SIGTERM encerra httpServer.close() sem iterar pelas conexões ativas do sseManager para disparar evento close ou reconnect.
- Causa clientes no frontend a exibirem erro de rede vermelho em vez de reconnect silencioso durante deploys.

## Alteração necessária
1. Integrar sseManager.gracefulDrain() no hook de SIGTERM em server.ts.
2. Enviar evento sse 'server_shutdown' permitindo que o cliente frontend agende reconexão inteligente pós-deploy.

## Teste esperado
- Critério de Aceite: Ao enviar kill -TERM no processo, clientes recebem evento de drenagem antes do socket fechar.

## Contexto adicional
Melhoria na experiência de usuário durante deploys de zero downtime.

## Resolução (Onda 2 — 2026-11-06)
- Implementado `sseService.gracefulDrain(reconnectAfterMs = 3000)` em `src/features/notifications/sse.service.ts`, emitindo `event: server_shutdown` com payload JSON `{"message":"Server is shutting down","reconnectAfterMs":3000}` antes de encerrar o response stream de cada cliente conectado.
- Integrado `sseService.gracefulDrain()` no ciclo de encerramento de `createGracefulShutdown` em `src/bootstrap/shutdown.ts` (invocado no `SIGTERM` / `SIGINT` registrado em `server.ts`).
- Validado por `tests/unit/features/notifications/sse-graceful-drain.test.ts` (1/1 PASS).

De: Agente 16 — Runtime, Workers e Escala
Para: Agente 12 — Voz e Telefonia
Onda: 6 (DEM-20261114-007 — MEL-47)
Status: aberto
Prioridade: alto
Bloqueador-ref: docs/ADR/ADR-011-realtime-sse-canonico.md
Sprint destino: Onda 6

## Problema

`src/features/voice-hub/components/LiveSupervisor/LiveSupervisor.tsx` é o único consumidor de
`socket.io-client` do repositório — e **não existe servidor Socket.IO**: nenhum arquivo monta
`new Server(...)`, `server.ts` não o referencia, e os eventos que o componente escuta
(`telemetry_stream`, `intervention_triggered`) e emite (`watch_session`, `intervene_call`)
não têm emissor server-side. O componente está funcionalmente quebrado hoje (fica em
"conectando/reconectando" ou sem dados), independentemente desta missão.

O ADR-011 propõe SSE como mecanismo canônico de tempo real e a remoção do Socket.IO. Para isso
preciso que o Live Supervisor tenha um caminho SSE equivalente.

## Arquivo(s) envolvido(s)

- `src/features/voice-hub/components/LiveSupervisor/LiveSupervisor.tsx` (seu)
- Novo endpoint de telemetria por sessão — sugerido: estender `sse.service`
  (`src/features/notifications/sse.service.ts`, transversal) com um canal
  `voice-session-telemetry` filtrado por `sessionId`+tenant, ou um endpoint SSE dedicado em
  voice-hub que faça fan-out a partir do pipeline de transcrição existente.
- `intervene_call` vira `POST /api/voice/sessions/:id/intervene` autenticado pela permission
  `supervision:intervene` (a checagem hoje supostamente server-side nunca existiu — precisa ser
  implementada de verdade, com auditoria de quem interveio).

## Evidência

- `grep -rn "socket.io" src server.ts` → apenas `LiveSupervisor.tsx` (+ testes dele) e
  `package.json`.
- `grep -rln "telemetry_stream\|intervene_call\|watch_session"` → só o componente.
- `server.ts` monta `sseService` e nenhum socket server.

## Alteração necessária

Migrar o LiveSupervisor para SSE + REST conforme ADR-011. O contrato de eventos proposto:
`event: telemetry` com o mesmo `TelemetryPayload` atual (incluindo `sessionId` para filtro
defesa-em-profundidade, que o componente já faz), `event: intervention_triggered`, e keep-alive
`: ping` a cada 25s (padrão `sseKeepAlive`). Reconexão: se usar `EventSource`, é automática;
se usar fetch-stream, reutilize `src/lib/sse.ts` (`readSseStream`).

## Teste esperado

- Supervisor conecta, recebe telemetria real de uma sessão ativa e dispara intervenção via POST
  com 403 para quem não tem `supervision:intervene`.
- Queda de conexão aparece como "reconectando" e se recupera sozinha.

## Contexto adicional

Depois do merge da sua migração, o Agente 00 remove `socket.io`/`socket.io-client` do
package.json (handoff 16-para-00 já aberto). Até lá o componente atual permanece como está —
não há regressão nova a temer.

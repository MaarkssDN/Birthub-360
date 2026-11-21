# ADR 011: Tempo real unificado em SSE — Socket.IO sem servidor não é mecanismo, é cliente órfão

## Status

Proposto (Onda 6, MEL-47; Agente 16). A remoção do pacote `socket.io`/`socket.io-client` e a
migração do `LiveSupervisor` dependem de decisão do Agente 00 (package.json/lockfile são dele) e
do Agente 12 (dono de `src/features/voice-hub/**`). Este ADR registra o inventário, a decisão
proposta e o que já foi implementado sem depender dessa decisão.

## Contexto — inventário real do que existe hoje

**SSE (server → cliente), o mecanismo que de fato funciona:**

- `src/features/notifications/sse.service.ts` — hub SSE persistente por organização
  (`/api/notifications/stream`), com keep-alive (`src/lib/sseKeepAlive.ts`, `: ping` a cada 25s),
  fan-out via Redis Pub/Sub (`voice-notifications`) com fallback local, e `gracefulDrain` no
  shutdown que envia `server_shutdown` para o cliente agendar reconexão.
- `src/lib/sse.ts` — helper client-side `readSseStream`/`sseRequestInit` para SSE por-requisição
  (fetch + POST, usado por swarm stream, Chatbook, Relatórios IA).
- Consumidores `EventSource` nativos (reconexão automática do browser): `RealtimeFeed.tsx`,
  `CrmBoard.tsx`, `ModuleAgentWidget.tsx`, `useAssistantChat.ts`, `useDatabase.ts`,
  `useCharacterExecution.ts`, `ReportsHub.tsx`.

**Socket.IO, o mecanismo que NÃO existe no servidor:**

- `package.json` declara `socket.io` + `socket.io-client`, mas **nenhum arquivo do repositório
  monta um servidor Socket.IO** — `server.ts` não o referencia e não há `new Server(...)` em
  `src/`.
- O único cliente é `src/features/voice-hub/components/LiveSupervisor/LiveSupervisor.tsx`
  (`io(window.location.origin)`), que escuta `telemetry_stream`, `intervention_triggered` e
  emite `watch_session`/`intervene_call`. Nenhum desses eventos tem emissor server-side — o
  socket conecta (ou falha) contra uma rota que não existe, e a UI mostra "conectando/
  reconectando" para sempre ou fica sem dados. Os comentários do componente citam um "server.ts"
  com enforcement de `supervision:intervene`, mas esse servidor não está neste código — é
  referência a uma implementação que nunca foi portada ou foi removida.

Ou seja: a "coexistência" SSE + Socket.IO é, na prática, **um mecanismo real (SSE) e um cliente
apontando para um servidor inexistente**. Não há broadcast duplicado nem dupla fonte de verdade
— há uma feature de Live Supervisor quebrada por ausência de backend.

## Decisão proposta

1. **SSE é o mecanismo canônico de tempo real** para todo tráfego server → cliente:
   unidirecional, funciona sobre HTTP/2 e proxies, já tem keep-alive, graceful drain e
   reconexão (`EventSource` automático; fetch-stream com retry explícito onde já existe).
   Nenhum caso de uso atual exige bidirecionalidade real — o único "cliente → servidor" do
   Socket.IO (`intervene_call`) é uma ação discreta que cabe num `POST /api/voice/sessions/:id/
   intervene` autenticado por `supervision:intervene`.
2. **Socket.IO é removido do caminho crítico**, em duas etapas que não podem ser feitas pelo
   Agente 16 sozinho:
   - Agente 12: reescrever `LiveSupervisor` para consumir SSE (endpoint de telemetria por
     sessão a ser criado por ele ou via `sse.service`) + `POST` para intervenção — handoff
     `.agents/handoffs/onda-6/16-para-12-livesupervisor-sse.md`.
   - Agente 00: remover `socket.io`/`socket.io-client` de `package.json` após o merge do item
     anterior (dependência órfã).
3. **Backpressure no fan-out SSE** (implementado neste ADR, parte consensual):
   `sse.service.deliverLocally` agora respeita `res.writableLength` — cliente lento é
   desconectado em vez de acumular buffer no heap do processo (memory leak sob cliente lento +
   tráfego alto). Threshold: 1 MiB.
4. **Reconexão:** nenhum mecanismo novo foi criado — `EventSource` já reconecta sozinho e o
   `server_shutdown` já instrui o cliente a reagendar. Para streams fetch-based, o contrato é:
   o consumidor deve tratar queda como fim de stream e permitir novo `POST` (retry com backoff
   fica a cargo de cada feature; não há fila de replay — SSE é best-effort por design).

## Alternativas consideradas

- **Manter Socket.IO e implementar o servidor que falta**: exigiria auth/RBAC por socket,
  rooms por tenant/sessão, sticky sessions em deploy multi-instância e um segundo canal de
  tempo real para manter — custo alto para um único consumidor (LiveSupervisor), que hoje está
  quebrado de qualquer forma. Adiado; se um caso de uso bidirecional de baixa latência surgir
  (ex.: voz em tempo real), reabrir como ADR novo.
- **WebSocket puro**: mesmo custo de Socket.IO sem o ecossistema; SSE já cobre o tráfego real.

## Consequências

- Uma única stack de tempo real, com um único ponto de observabilidade (métricas/log do
  `sse.service`) e um único caminho de graceful shutdown.
- Live Supervisor continua sem dados até o Agente 12 migrar o componente — status quo não
  regride, mas também não melhora sozinho.
- `socket.io` permanece em `package.json` até decisão do 00; código novo não deve importar
  `socket.io-client`.

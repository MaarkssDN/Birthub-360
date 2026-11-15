# Handoff — War Room SSE: heartbeat e reconexão

De: 00 — Coordenador
Para: 16 — Runtime, Workers e Escala (com 02 — Produto/UX)
Onda: W7
Status: em-andamento
Prioridade: normal
Sprint destino: próxima onda

## Problema

Auditoria: "heartbeat SSE e reconexão precisam estabilizar" e "War Room é
simulação client-side sem backend". Procurar implementação SSE em
src/features/gamification ou war-room (EventSource, text/event-stream).

## Arquivo(s) envolvido(s)

- Endpoint SSE do War Room (server)
- Cliente que consome (frontend)

## Evidência

- Worktree `agente-16-warroom-sse` preservada para retomada.

## Alteração necessária

1. Heartbeat periódico no stream SSE (comentários `: ping`).
2. Reconexão exponencial no cliente + Last-Event-ID se aplicável.
3. Cleanup de listeners/conexões no server (anti memory leak).
4. Avaliar se simulação client-side deve ser identificada honestamente na UI.

## Teste esperado

- Testes de reconexão/heartbeat/cleanup; npx tsc --noEmit.

## Resolução

**Achado central:** o War Room (`src/features/gamification/**`) NÃO possui endpoint
SSE — é simulação 100% client-side (`WarRoomArenaView.tsx` usa estado local +
`setInterval` para o timer; `warRoomArena.service.ts` é in-memory e não é chamado
pela UI). Portanto não havia stream SSE de War Room para receber heartbeat.

**O que foi implementado (Agente 16, worktree `Birthub-360-wt-o3-16`, branch
`agente/16-onda3-warroom`):**

1. **Heartbeat SSE reutilizável** — novo helper `src/lib/sseKeepAlive.ts`
   (`attachSseKeepAlive`): escreve comentário `: ping\n\n` a cada 25s
   (`SSE_HEARTBEAT_INTERVAL_MS`), abaixo do timeout típico de proxies
   (30–60s). Timer com `unref()`; cleanup automático em `close`/`error` do
   socket e quando `write` lança exceção (anti memory leak). Comentários SSE
   são ignorados pelo parser do cliente — zero impacto no protocolo.
2. **Aplicado ao único stream SSE de longa duração consumido por EventSource:**
   `sseService.addClient` em `src/features/notifications/sse.service.ts`
   (`/api/notifications/stream`, usado por `CrmBoard.tsx`). Antes disso o
   cliente ficava ocioso e proxies podiam derrubar a conexão.
3. **Reconexão:** o cliente usa `EventSource` nativo (`CrmBoard.tsx:192`), que já
   reconecta automaticamente com backoff do navegador; o servidor não emite
   campos `id:`, logo Last-Event-ID não se aplica. Nenhuma mudança de cliente
   necessária.
4. **UI honesta:** avaliado — `WarRoomArenaView.tsx` já rotula a simulação de
   forma explícita ("modo treino local", "sem persistência de XP", "Cenário de
   Treino", cards "Em breve" para modos não implementados). Sem alteração.

**Não tocado:** `src/lib/queue/**` (slot exclusivo 06/07) — não foi necessário.

**Testes:** `src/lib/__tests__/sseKeepAlive.test.ts` — 5 testes (intervalo
default/custom, cleanup em close/error, stop idempotente, write que lança).
`npx tsc --noEmit` limpo; `npx biome check` limpo; vitest dos arquivos afetados
verde.

**Pendência para o 00:** se a auditoria pretendia um stream SSE real para o War
Room (ex.: eventos de sala multiplayer), isso é feature nova de backend — abrir
demanda separada; este handoff cobria estabilização de SSE existente.

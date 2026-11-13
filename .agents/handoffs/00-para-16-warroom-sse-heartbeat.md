# Handoff — War Room SSE: heartbeat e reconexão

De: 00 — Coordenador
Para: 16 — Runtime, Workers e Escala (com 02 — Produto/UX)
Onda: W7
Status: aberto
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

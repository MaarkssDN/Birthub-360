# Run — Integração funcional dos 29 personagens à arquitetura multiagente

- **Data:** 2026-11-10
- **Executor:** Devin / Antigravity (Agente 00)
- **Base:** continuação de `.agents/runs/2026-11-10-expansao-personagens-9-29.md` (fase visual homologada)
- **Branch:** `integracao/onda-saneamento-20261110`
- **Status:** EM_REVISAO (aguardando parecer do Agente 24)

## A. Inventário funcional

Fonte canônica: `src/features/characters/characterCatalog.ts` (29 IDs estáveis, fallback `core`).
Vínculo runtime derivado (nunca declarado à mão): `src/features/characters/characterRuntime.ts`.

| Camada | Qtd | Dispatch | Status típico |
|---|---|---|---|
| Pilares (Orbit…Sudo) | 9 | `swarm-stream` → `/api/agent/swarm/stream` (Supervisor 00) | available |
| Agentes comerciais com `httpRoute` real | ~13 | `module-surface` → `/api/agent/commercial-cell/<id>/run` | available |
| Comerciais sem rota (`billing-revenue` etc.) | ~2 | `none` | unavailable (motivo explícito) |
| Canais/voz | 4 | `module-surface`/`none` conforme superfície real | mixed (vox=unavailable: voice-hub 503) |
| Orquestração (Aegis/Supervisor) | 1 | `swarm-stream` | available |

Regra aplicada: `httpRoute` só é preenchido onde existe rota HTTP real no registry/rotas — nenhum vínculo alegado sem comprovação em código.

## B. Arquitetura de integração

```
Usuário → /app/characters (Central) → CharacterDetailPanel
        → useCharacterExecution → POST /api/agent/swarm/stream (SSE, fetch+readSseStream)
        → acquireMissionSlot(orgId, sessionId)  [gate concorrência/idempotência]
        → SwarmOrchestrator (Supervisor 00) → especialistas → AgentExecutor
        → swarmAudit.service (persistência por organizationId)
        → eventos SSE → estados operacionais → estado visual do SVG
```

- Rotas novas: `GET /api/agent/characters`, `/activity`, `/concurrency`, `/:id` — montadas dentro de `agent.routes.ts`, herdando `authenticateToken` + `requireTenant` + `aiLimiter`.
- Gate: `src/features/intelligence/services/swarmConcurrency.service.ts` — slots por `organizationId`, fila FIFO, timeout configurável (`SWARM_MISSION_QUEUE_TIMEOUT_MS`), teto configurável (`SWARM_MAX_CONCURRENT_MISSIONS`, clamp 8), rejeição de `sessionId` duplicado, cleanup garantido via try/finally nas rotas.
- Estados operacionais (8) mapeados para os 6 estados visuais do SVG; circuit breaker OPEN degrada honestamente dispatches `swarm-stream`.

## C. Matriz de compatibilidade

- Central `/app/characters`: catálogo completo, busca por nome/id/papel/agente, filtros por camada e status de runtime, feed de atividade real (`swarmAuditLog` escopo tenant), painel de detalhe com execução.
- Widgets de módulo: inalterados — continuam usando apenas os 9 pilares via catálogo (personagens de runtime não vazam para o widget).
- Execução: apenas personagens com `dispatch=swarm-stream` e `status=available` podem disparar missão; `module-surface` direciona para a superfície real do módulo; `none` exibe indisponibilidade honesta.

## D. Relatório de implementação

| Arquivo | Mudança |
|---|---|
| `src/features/characters/characterRuntime.ts` | NOVO — vínculo personagem→runtime, 8 estados operacionais, mapeamentos SSE→visual |
| `src/features/characters/characterRuntime.routes.ts` | NOVO — sub-router `/api/agent/characters*` |
| `src/features/intelligence/services/swarmConcurrency.service.ts` | NOVO — gate de concorrência/idempotência por tenant |
| `src/features/intelligence/routes/agent.routes.ts` | monta sub-router; gate em `/swarm/stream` e `/swarm/mission` |
| `src/features/characters/useCharacterExecution.ts` | NOVO — hook SSE tipado com executionId/correlationId, abort, dedup |
| `src/features/characters/CharacterDetailPanel.tsx` | NOVO — painel de detalhe + execução contextual |
| `src/features/characters/characterApiTypes.ts` | NOVO — contratos API |
| `src/features/characters/CharacterGalleryView.tsx` | REESCRITA — galeria → Central operacional |
| Testes (3 novos arquivos) | vínculo runtime, gate de concorrência, rotas |

Sem migrações de schema, sem novos agentes, sem alteração de contratos SSE existentes.

## E. Relatório de testes

| Gate | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ limpo |
| `npx biome check` (arquivos alterados) | ✅ 0 diagnósticos |
| `npx vitest run` (characters + swarmConcurrency + routes.characters) | ✅ 36/36 |
| `npm run build` | ✅ Vite + esbuild server + PWA precache 221 entradas verificado |
| `npm run lint:architecture` (depcruise) | ✅ 0 violações novas (69 conhecidas ignoradas) |

Cobertura nova: 29 vínculos runtime, honestidade de `unavailable`, isolamento tenant no gate, FIFO/timeout/duplicata/cancel do gate, rotas autenticadas com escopo `organizationId`, mapeamento SSE→estado visual.

**Limitações registradas (não ocultar):**
- Execução real fim-a-fim via UI autenticada depende de credenciais/sessão — não demonstrada nesta sessão; SSE e endpoints são os mesmos já homologados do widget.
- Evidência visual da Central reescrita (dark/light) pendente de sessão autenticada; a evidência anterior cobre a versão galeria.
- Atualização do Documento Mestre (entregável G) delegada ao Agente 11 via handoff.

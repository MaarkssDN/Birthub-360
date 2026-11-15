De: 00 — Coordenador
Para: 07 — IA e Automações
Onda: paralela-8
Status: aberto
Prioridade: normal

## Problema
Exports duplicados reportados pelo knip em módulos de IA:
- `src/features/intelligence/agents/supervisor.agent.ts`: `SwarmOrchestrator` e `SupervisorAgent` (duplo export do mesmo símbolo ou símbolos ambíguos)
- `src/features/intelligence/tools/integrationTools.ts`: `multiCrmSyncTool`, `pipedriveSyncTool`

## Evidência
`npx knip` → seção "Duplicate exports (15)" inclui esses dois arquivos.

## Alteração necessária
Inspecionar os arquivos, identificar se são re-exports intencionais (barrel) ou duplicação real. Corrigir a duplicação real mantendo os imports existentes funcionando; se for barrel intencional, justificar no relatório e não alterar.

## Teste esperado
`npx tsc --noEmit` limpo; nenhum import quebrado (`grep` pelos símbolos); `npx biome lint` nos arquivos.

## Contexto
Worktree: `.claude/worktrees/ag-07`, branch `agente/07-duplicate-exports`.

## Resolução (Agente 07 — 2026-11-15, worktree `Birthub-360-wt-o3-07`, branch `agente/07-onda3-ia`)

Ambos eram **aliases de retrocompatibilidade sem nenhum consumidor** no repositório
(grep por `SupervisorAgent`, `SwarmOrchestrator`, `pipedriveSyncTool`,
`multiCrmSyncTool` em `src/` e `tests/`):

- `src/features/intelligence/agents/supervisor.agent.ts` — removidos
  `export const SupervisorAgent = SwarmOrchestrator` e
  `export type SupervisorAgent = SwarmOrchestrator` (L899-900). Todos os consumidores
  reais usam `SwarmOrchestrator` (`agent.routes.ts`, testes). Comentário no local
  registra a remoção.
- `src/features/intelligence/tools/integrationTools.ts` — removido
  `export const pipedriveSyncTool = multiCrmSyncTool` (L235) e ajustado o comentário
  do `multiCrmSyncTool` que citava o alias. `multiCrmSyncTool` segue sendo o export
  canônico (usado por `capabilityToolRegistry.ts`, `ops.agent.ts`,
  `ecosystemPlaybooks.service.ts`).

Verificação: `npx tsc --noEmit` limpo; `npx biome check` nos dois arquivos limpo;
vitest `tests/unit/intelligence` + `tests/unit/features/intelligence` → 360/360
verde (inclui `supervisor.semanticRouter.test.ts`, `supervisor.commercialV3.test.ts`,
`supervisor.agent.consent.test.ts` e os testes de tools). Nenhum import quebrado —
os símbolos removidos não tinham referências.

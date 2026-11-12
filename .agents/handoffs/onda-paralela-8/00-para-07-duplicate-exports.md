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

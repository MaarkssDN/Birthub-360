# Handoff — Agente 72 (Ada) → Agente 00 (Coordenador)

- **De:** Agente 72 — Ada (Tool Calling e Ferramentas de IA)
- **Para:** Agente 00 — Coordenador
- **Onda:** Onda 4 — missão ONDA4-72-TOOL-ENGINE
- **Status:** resolvido (escopo próprio) / achados fora de propriedade registrados abaixo
- **Prioridade:** alto (bloqueador histórico B-08)
- **Branch/worktree:** `agente/72-tool-engine-onda4` em `wt-72-tool-engine` (base `32d07c375`)

## Problema

B-08: "tools registradas mas indisponíveis / execução falha silenciosa".
Auditoria encontrou a causa raiz estrutural:

1. **Split-brain de registry (corrigido):** `src/lib/ai/tools/registry.ts` criava
   `export const toolRegistry = new ToolExecutionEngine()` — uma SEGUNDA instância do
   engine, vazia e desconectada do singleton `toolEngine` exportado por
   `src/lib/voice-runtime/ToolEngine.ts:165` (e re-exportado por
   `src/lib/voice-runtime/index.ts`). Qualquer tool registrada via `toolRegistry`
   ficava invisível para `toolEngine.executeTool` → `Tool X not found`.
   Hoje não há consumidor de produção de nenhum dos dois (engine de tools nomeadas
   ainda é infraestrutura dormente — o caminho real de function-calling dos agentes
   de swarm usa LangChain em `src/features/intelligence/agents/execution/AgentExecutor.ts`,
   fora do meu ownership), mas o defeito latente é exatamente o padrão B-08.

2. **Sem camada de disponibilidade/schema do lado da IA (implementado):** o engine
   não valida argumentos contra schema nem verifica conectividade antes de expor a
   tool. B-08 exige "certificar conectividade antes de expor a Tool à LLM".

## Alterações (ownership `src/lib/ai/tools/**`)

- `src/lib/ai/tools/registry.ts` — `toolRegistry` agora É `toolEngine` (mesma
  instância); `toolEngine` também re-exportado. Fim do split-brain.
- `src/lib/ai/tools/executor.ts` (novo) — `AiToolRegistry` + `aiToolRegistry` +
  `registerAiTool`:
  - `AiToolDefinition extends ToolDefinition` com `argsSchema?: z.ZodType` e
    `isAvailable?: (ctx) => boolean | Promise<boolean>`.
  - `listToolsForModel(ctx)` — catálogo consciente de permissão: filtra
    `allowedTools` + `requiredPermission`/`grantedPermissions` + `isAvailable`
    (fail-closed). É o que deve ser entregue ao provider como tools.
  - `execute(...)` — pre-flight `isAvailable` (falha/erro no health-check →
    `ToolUnavailableError`, fail-closed) → validação `argsSchema` (inválido →
    `ToolInputValidationError`, tool NÃO executa) → delega ao engine compartilhado
    (allowedTools/permissão/timeout 15s/observabilidade preservados).
  - Erros novos: `ToolUnavailableError`, `ToolInputValidationError`. Nenhum sucesso
    falso: erros da tool propagam.
- `src/lib/ai/tools/__tests__/aiToolRegistry.test.ts` (novo) — 12 testes.

## Evidências / verificação

- Reprodução B-08: teste `toolRegistry is the shared toolEngine singleton` falharia
  no baseline (instâncias distintas → `toBe` falha; execução cruzada → "not found").
- `npx vitest run -c vitest.unit.config.ts src/lib/ai/tools/__tests__/aiToolRegistry.test.ts`
  → **12/12 passou**.
- Regressão: `toolEngineTimeout.test.ts` + `HttpToolExecutor.test.ts` → **16/16 passou**.
- `npx tsc --noEmit` → limpo (exit 0). `npx biome lint src/lib/ai/tools/` → limpo.
- SHAs: commit `a6807f9f6` (branch `agente/72-tool-engine-onda4`, base `32d07c375`)

## Achados fora do ownership → handoffs

- `src/lib/voice-runtime/ToolEngine.ts` (dono: Agente 12 — Voz): `getAvailableTools(ctx)`
  filtra `allowedTools` mas NÃO `requiredPermission`/`grantedPermissions` → anuncia
  tool que `executeTool` recusará (viola B-08 na listagem do engine). Também não há
  validação de `args` no engine. Não editei — ver
  `.agents/handoffs/onda4/72-para-12-toolengine-permission-listing.md`.
- `src/lib/ai/gateway/toolPermissionPolicy.ts`: classe sem nenhum consumidor
  (dead code) — registrado para o dono do gateway (Agente 78/07 conforme matriz).
- Nenhum ponto de produção ainda conecta o catálogo de tools ao function-calling do
  gateway de IA (`src/lib/ai/gateway/*` não expõe `tools` nos providers). A camada
  `AiToolRegistry.listToolsForModel` está pronta para ser consumida quando o runtime
  de IA ligar tool-calling — handoff de integração fica a cargo do 00/07.

## Suposições

- `parameters` permanece `Record<string, unknown>` (JSON-schema para o provider);
  validação runtime de entrada é opt-in via `argsSchema` zod (sem quebrar tools
  existentes que não declaram schema).
- Tools registradas direto no engine (fora de `AiToolRegistry`) seguem o contrato
  atual do engine — a camada AI só gerencia o que passa por `register`/`registerAiTool`.

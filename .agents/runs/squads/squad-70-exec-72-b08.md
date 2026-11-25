# EXECUÇÃO — Missão 1 do Squad 70: B-08 Tool Calling (Agente 72 — Ada)

Data: 2026-11-24 · Runtime: Devin · Coordenador: Agente 70 Orion (execução direta, sem run_subagent)
Branch executor: `agente/72-tool-calling-b08-s70` · Worktree: `squads/squad-70/wt-72`
Base: `93e82c220` · SHA entrega: `8c78e5523`

## Escopo executado

- `src/lib/ai/tools/registry.ts`: `toolRegistry` deixou de ser `new ToolExecutionEngine()`
  (segunda instância órfã) e passou a ser alias do engine canônico `toolEngine`
  (`src/lib/voice-runtime/ToolEngine.ts`). Elimina split-brain registro↔execução.
  Re-exports de tipos/classe mantidos (API pública preservada).
- `src/lib/ai/tools/__tests__/registry.test.ts` (novo): 6 testes de regressão B-08
  via entrypoint público do squad.

## Evidências

- `npx vitest run -c vitest.unit.config.ts src/lib/ai/tools/__tests__/registry.test.ts tests/unit/lib/voice-runtime/toolEngineTimeout.test.ts`
  → **9/9 testes verdes** (6 novos + 3 preexistentes).
- `npx tsc --noEmit` → exit 0, sem erros.
- `npx biome lint src/lib/ai/tools/` → limpo.
- Cobertura provada: execução real com ctx válido; negação sem `allowedTools`
  (`ToolPermissionError`); `requiredPermission` ('tools:admin') negado e concedido;
  `ToolTimeoutError` com teto `MAX_RUNTIME_TOOL_TIMEOUT_MS = 15000`; tool inexistente
  → erro explícito; identidade `toolRegistry === toolEngine`.

## Pendências B-08 (próximas missões)

1. **Wiring real**: nenhum consumidor de produção chama `executeTool` — o gateway
   (`src/lib/ai/gateway/*`) não emite/consome `tool_calls`. Missão seguinte do 72:
   expor tools via `getAvailableTools(ctx)` no chat-model e executar calls
   autorizadas (handoff com 71 Clara para ciclo de vida do agente).
2. `src/features/intelligence/**` usa `capabilityToolRegistry` próprio — fora do
   ownership Squad 70; se houver convergência desejada, abrir handoff ao dono
   (domínio intelligence / Agente 07 legado).
3. `toolPermissionPolicy.ts` (gateway) está órfão — decidir em missão futura do 72
   se vira a policy das tools expostas ao LLM ou é removido (P3, não agora).

## Gates

- Gate local: PASS (testes direcionados + tsc + biome no escopo).
- Gate de integração/aceite: PENDENTE — SHA `8c78e5523` aguarda merge do coordenador
  em `integracao/squad-70` e parecer do Agente 09 (Silas) via Astra.
- Guardrails (77): intocados; nenhuma mudança em prompts/outputs de IA.

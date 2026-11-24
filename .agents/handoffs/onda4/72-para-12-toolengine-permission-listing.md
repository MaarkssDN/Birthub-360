# Handoff — Agente 72 (Ada) → Agente 12 (Voz e Telefonia)

- **De:** Agente 72 — Ada (Tool Calling e Ferramentas de IA)
- **Para:** Agente 12 — Voz e Telefonia (proprietário de `src/lib/voice-runtime/**`)
- **Onda:** Onda 4 — auditoria B-08 tool engine
- **Status:** aberto
- **Prioridade:** normal
- **Arquivo(s) envolvido(s):** `src/lib/voice-runtime/ToolEngine.ts`

## Problema

Dois defeitos no `ToolExecutionEngine` que violam o espírito de B-08 ("nunca anunciar
como disponível o que a execução recusaria" / validar entrada), fora do meu ownership
(`src/lib/ai/tools/**`):

1. **`getAvailableTools(ctx)` (linhas ~148-162)** filtra apenas por
   `ctx.allowedTools`, ignorando `tool.requiredPermission` +
   `ctx.grantedPermissions`. Uma tool administrativa habilitada por nome mas sem a
   permissão exigida é anunciada ao consumidor e `executeTool` depois lança
   `ToolPermissionError` — exatamente o padrão "registrada/visível mas falha".
   Sugestão: aceitar `Pick<ToolExecutionContext,'allowedTools'|'grantedPermissions'>`
   e aplicar o mesmo check das linhas ~91-101.

2. **Sem validação de argumentos:** `ToolDefinition.parameters` é
   `Record<string, unknown>` meramente declarativo; `executeTool` repassa `args`
   crus ao `execute`. Não é defeito novo meu (não editei), mas vale registrar:
   consumidores devem validar schema antes (a camada `src/lib/ai/tools/executor.ts`
   do Agente 72 já oferece `argsSchema` zod como padrão).

## Evidência

- Leitura de `ToolEngine.ts` no worktree `wt-72-tool-engine` (SHA base `32d07c375`).
- Camada complementar entregue em `src/lib/ai/tools/executor.ts`
  (`listToolsForModel` já filtra permissão corretamente para tools da camada AI).

## Alteração necessária

No `getAvailableTools`, filtrar também por `requiredPermission` quando `ctx`
traz `grantedPermissions` (manter compat: `ctx` opcional sem permissions → comportamento
atual ou exigir o campo — decisão do proprietário).

## Teste esperado

Teste unitário: tool com `requiredPermission` não aparece em `getAvailableTools(ctx)`
quando a permissão não está em `grantedPermissions`, e aparece quando está.

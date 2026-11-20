# Handoff — DEBT-0012: loop ReAct (`executeWithTools`) fora do gateway de IA

De: 07/13 (IA e Automações / Enxame)
Para: 00 (Coordenador)
Onda: techdebt / Trilha D (2026-11-19)
Status: resolvido
Prioridade: alto
Bloqueador-ref: DEBT-0012 (🟡, release readiness)
Sprint destino: próxima onda de governança de runtime de IA

## Problema

`AgentExecutor.executeWithTools` executa o loop ReAct via `buildModelWithFallback`
(`src/features/intelligence/agents/fallback.util.ts`), que instancia `ChatOpenAI` cru
(Groq + OpenAI). Cada iteração do loop **não passa** por `src/lib/ai/gateway.ts`:

- sem `tokenQuotaService.enforceTokenQuota` por chamada (só o Gate 2 de budget roda 1× antes
  de `agent.invoke`, AgentExecutor.ts:90);
- sem `logAiUsage`/AILog por chamada de LLM;
- sem `recordAiUsageCost` (métrica `ai_usage_cost_usd_total`);
- sem circuit breaker por provedor (`gateway/circuit-breaker.ts`);
- sem guardrails de PII/toxicidade na saída (`chat-model.ts:261-299`);
- sem roteamento dinâmico/telemetria Langfuse.

`executeWithoutTools` está correto (usa `getAiModel().invoke()`).

Risco: um ReAct loop de N iterações consome ~N× tokens de quota do tenant sem enforcement
incremental — estoura cota e custo sem registro por iteração.

## Arquivo(s) envolvido(s)

- `src/features/intelligence/agents/execution/AgentExecutor.ts` (executeWithTools, ~linha 219)
- `src/features/intelligence/agents/fallback.util.ts` (buildModelWithFallback)
- `src/features/intelligence/agents/base.agent.ts` (runWithTools)
- Referência correta: `src/lib/ai/gateway/chat-model.ts` (invoke path)

## Evidência

- Auditoria completa em `.agents/runs/07-debt-0015-0012-0014-auditoria-20261119.md`.
- `fallback.util.ts:4-22` — `new ChatOpenAI` direto, sem gateway.
- `chat-model.ts:217-233` — quota/budget só existem dentro de `getAiModel().invoke()`.

## Alteração necessária

Decisão de arquitetura necessária (não é fix cirúrgico):

1. **Opção A (preferida):** adapter `BaseChatModel` que delega `invoke`/`stream` ao gateway
   (`getAiModel`) preservando `bindTools` — exige que o gateway/`AiChatModel` suporte tool
   calling (hoje retorna só `{ text }`; LangGraph `createReactAgent` precisa de
   `AIMessage.tool_calls`). Provavelmente exige mudança em `gateway/types.ts` + providers.
2. **Opção B:** middleware/callback LangGraph no `createReactAgent` que, por nó de chamada ao
   LLM, execute `enforceTokenQuota` + `assertAiBudgetNotExceeded` + `logAiUsage`. Mais simples,
   mas não elimina o bypass de circuit breaker/guardrails de saída.
3. Manter `fallback.util.ts` apenas como último recurso documentado, ou deprecá-lo.

Atenção a slots: `src/features/intelligence/agents/**` é propriedade do 13;
`src/lib/ai/**` é do 07; `src/lib/queue/**` é do 16 (não tocar nesta frente).

## Teste esperado

- Teste que executa `executeWithTools` com model mockado e verifica que
  `enforceTokenQuota`/`logAiUsage` são chamados **por iteração** do loop (ou ao menos por
  chamada ao LLM).
- Teste de bloqueio: quota estourada no meio do loop → iteração seguinte aborta com erro
  honesto (não `{ error }` silencioso com conteúdo parcial persistido).

## Contexto adicional

- DEBT-0014 (fail-open do TokenQuota + producers sem `requestContext.run`) foi auditado na
  mesma run: fail-open agora é observável via `ai_token_quota_fail_open_total`
  (`src/lib/ai/metrics.ts`, `tokenQuota.service.ts`); todos os producers de IA atuais rodam
  dentro de `requestContext.run({ tenantId })` — ver run report para a lista.
- `src/config/env.ts:345` já documenta gap correlato: agentes BDR/Closer/CRM do enxame
  (autonomyRoleRunner) não passam pela trava `AI_PII_EXTERNAL_CONSENT_ORGANIZATIONS` —
  bloqueado por DEBT-0013/decisão humana, fora desta entrega.

## Resolução (Onda 4 — Squad 70: Agentes 70 Orion, 71 Clara e 78 Oz)

- **Implementação (`src/features/intelligence/agents/execution/AgentExecutor.ts`):**
  - Criado `ReactLoopGovernanceCallbackHandler` (estendendo `BaseCallbackHandler` com `raiseError: true` e `awaitHandlers: true`) injetado em `agent.invoke(..., { callbacks: [governanceCallback] })` dentro de `AgentExecutor.executeWithTools`.
  - **Pré-inferência por iteração (`handleChatModelStart` / `handleLLMStart`):** estima os tokens do prompt da iteração atual e executa `tokenQuotaService.enforceTokenQuota({ organizationId, requestedModel: toolsModelName, estimatedTokens })` (quando `organizationId` está presente) e `assertAiBudgetNotExceeded()`. Caso a quota ou o orçamento estourem no meio do loop ReAct, registra a falha via `recordAgentFailure` e lança imediatamente a exceção para abortar a chamada antes da inferência no provedor e sem persistir memória parcial como `'Completed'`.
  - **Pós-inferência por iteração (`handleLLMEnd`):** extrai o consumo real de tokens (ou estimativa de fallback), contabiliza custo na métrica Prometheus `recordAiUsageCost`, incrementa o consumo da organização via `tokenQuotaService.recordUsage` e persiste o registro individual em `AILog` via `logAiUsage`.
- **Evidência de Testes (`tests/unit/ai/agentExecutor.reactQuota.test.ts`):**
  - `cmd /c npx vitest run -c vitest.unit.config.ts tests/unit/ai/agentExecutor.reactQuota.test.ts src/features/intelligence/agents/execution/__tests__/AgentExecutor.test.ts src/features/intelligence/agents/__tests__/base.agent.budget.test.ts` — **18/18 testes passando (100%)**.
  - Coberto loop ReAct multi-iteração (tool call -> resposta final) comprovando chamadas por iteração de `enforceTokenQuota`, `assertAiBudgetNotExceeded`, `logAiUsage`, `recordUsage` e `recordAiUsageCost`, além do cenário de bloqueio na 2ª iteração por `AiTokenQuotaExceededError` abortando antes da 2ª geração e sem persistir resposta parcial.

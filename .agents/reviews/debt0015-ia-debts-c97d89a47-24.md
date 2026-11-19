# Parecer 24 — PR #431 (DEBT-0015 + DEBT-0014 + auditoria DEBT-0012)

- Missão: revisão independente de débitos P1 do release-readiness audit (Trilha D, Agente 07/13)
- Autor: Agente 07 — IA e Automações
- Auditor: Agente 24 — Revisão Independente
- Base: `main` | Branch: `agente/07-ia-debts-0015-0012-0014` | Commit revisado: `c97d89a47578297c069f184263a7272283d01085`
- Data: 2026-11-19

## Arquivos da entrega

- `src/features/intelligence/tools/scriptAndPromptTool.ts` (modificado)
- `src/features/intelligence/tools/__tests__/scriptAndPromptTool.test.ts` (novo)
- `src/lib/ai/finops/tokenQuota.service.ts` (modificado)
- `src/lib/ai/metrics.ts` (modificado)
- `.agents/handoffs/onda-techdebt/07-para-00-debt-0012-react-loop-fora-do-gateway.md` (novo)
- `.agents/runs/07-debt-0015-0012-0014-auditoria-20261119.md` (novo)

Propriedade: `src/lib/ai/**` e `src/features/intelligence/tools/**` são do domínio 07 — OK. `src/lib/queue/**` não tocado (slot 16 respeitado). `schema.prisma` não tocado (dono 01). Sem conflito de propriedade.

## Verificações executadas (evidência própria do auditor)

- `gh pr diff 431` — diff integral lido; confere com o escopo declarado no body.
- `npx tsc --noEmit` no worktree `agente-07-ia-debts` (HEAD = c97d89a47) → exit 0.
- `npx vitest run -c vitest.unit.config.ts`:
  - `scriptAndPromptTool.test.ts` → 2/2 passaram.
  - `src/lib/ai/finops` (tokenQuota.test.ts) → 15/15 passaram.

## Confronto promessa × evidência

### DEBT-0015 — fallback fabricado removido: CONFIRMADO

- O `fallback: () => '# [ARTIFACT] ... Abertura Quebra-Gelo ...'` foi removido de `generateTextOutput` em `scriptAndPromptTool.ts` (~linha 103-113).
- Verificado em `src/lib/ai/gateway.ts:148-150` (branch): sem `options.fallback`, o `catch` faz `throw err` — a exceção propaga, o `catch` externo da tool retorna `{ error, details }` e `prisma.prompt.create` nunca é alcançado. Fail-loud real.
- `approved: true` permanece apenas no caminho de sucesso com `generatedContent` vindo do gateway — semântica pré-existente preservada (não é introduzida por este PR). Ver observação P3 abaixo.
- Demais branches da tool (`sales_pitch`, `objection_rebuttal`, `email_sequence`) delegam a `src/lib/ai/features.ts`, que usa `getAiModel().invoke()` sem fallback fabricado (verificado — `features.ts` não tem fallback inline) — alegação do run report confirmada.
- Teste de regressão cobre exatamente o débito: falha → `prompt.create` não chamado; sucesso → `create` 1× com conteúdo idêntico ao gateway e sem o template fabricado. Rodei: verde.

### DEBT-0014 — métrica fail-open TokenQuota: CONFIRMADO

- `src/lib/ai/metrics.ts`: novo `aiTokenQuotaFailOpenTotal = new client.Counter({ name: 'ai_token_quota_fail_open_total', labelNames: ['reason'] })` + `recordTokenQuotaFailOpen(reason)` com fallback `'unknown'`. Padrão idêntico aos demais contadores do arquivo (prom-client, snake_case, labelNames `as const`). Nome de métrica novo — sem colisão com alertas existentes (verificado: nenhum alerta referencia esse nome; é aditivo).
- `tokenQuota.service.ts`: `recordTokenQuotaFailOpen('usage_db_unavailable')` no catch de `getMonthlyTokenUsage` (Postgres down → uso=0) e `recordTokenQuotaFailOpen('tier_resolution_db_unavailable')` no catch de `resolveOrganizationTier` (→ tier 'starter'). Ambos os caminhos fail-open agora observáveis.
- Decisão de NÃO converter fail-open em fail-closed está documentada e é correta para este escopo: mudar comportamento de produção em outage de DB é decisão de risco do 00/10. Parcialmente corrigido + observável é entrega honesta.
- Alegação "producers auditados rodam em `requestContext.run({ tenantId })`": spot-check confirmado — `src/lib/queue/agent.worker.ts:63` (`requestContext.run({ tenantId })` envolvendo SDR outbound) e `swarmScheduler.service.ts` (~linha 435, `requestContext.run({ tenantId: organizationId })` cobrindo runAutonomyRole/draftNegotiatorReply/queueOutboundIfEligible). Residual documentado (quota pulada sem tenantId é by-design em `chat-model.ts`) é preciso.

### DEBT-0012 — gap ReAct→handoff: CONFIRMADO como gap real, handoff adequado

- Verificado `src/features/intelligence/agents/fallback.util.ts`: `buildModelWithFallback` instancia `ChatOpenAI` cru (Groq `openai/gpt-oss-20b` + fallback `gpt-4o-mini`), com `bindTools` — bypassa `src/lib/ai/gateway.ts`/`chat-model.ts`.
- Verificado `AgentExecutor.executeWithTools` (~linha 219-260): `createReactAgent({ llm: model, tools })` sobre esse modelo cru; único gate é `assertAiBudgetNotExceeded` 1× antes do invoke. Sem quota por iteração, sem AILog/custo por chamada, sem circuit breaker, sem guardrails de saída. O débito é real e estrutural.
- `executeWithoutTools` usa `getAiModel().invoke()` — correto, conforme declarado.
- Handoff `.agents/handoffs/onda-techdebt/07-para-00-debt-0012-react-loop-fora-do-gateway.md` segue o formato §18 (De/Para/Onda/Status/Prioridade/Bloqueador-ref), prioridade `alto`, status `aberto`, com evidência, 3 opções de correção (adapter BaseChatModel preferido), testes esperados e nota correta de propriedade (`agents/**` → 13, `lib/ai/**` → 07, `queue/**` → 16). Não é correção disfarçada de handoff — o gap exige decisão de arquitetura, escopo correto.

## Achados

- **P3 (informativo, sem ação bloqueante):** `Prompt.approved: true` continua sendo gravado para conteúdo gerado pelo gateway. Não é regressão (semântica pré-existente), mas vale registrar ao 00 que "approved" hoje significa "gerado por IA", não "revisado por humano" — se a biblioteca de Prompts for consumida como curada, isso é um risco de produto separado.
- **P3 (informativo):** run report declara `organizeImports` pré-existente em `tokenQuota.service.ts` (biome check) — não introduzido pelo diff; correto não corrigir fora de escopo (P3).
- Nenhum achado P0/P1/P2.

## Riscos residuais

- DEBT-0012 permanece aberto por decisão (handoff correto) — o release-readiness audit deve continuar marcando o gap ReAct como débito ativo até o 00 escalar a decisão de arquitetura.
- Fail-open do TokenQuota segue existindo (agora observável); alerta Prometheus sobre `ai_token_quota_fail_open_total` ainda não existe — sugestão de follow-up para o 10.

## Veredito

**APROVADO** — escopo exato do diff (commit c97d89a47): DEBT-0015 corrigido com teste de regressão executado e verde; DEBT-0014 parcialmente corrigido de forma honesta e observável; DEBT-0012 auditado com evidência e handoff bem formado. Gates declarados confirmados pelo auditor (tsc exit 0; vitest 2/2 + 15/15 nos arquivos do escopo). Nenhuma pendência bloqueadora neste PR.

- De: 00
- Para: 07 (IA) + 13 (Enxame)
- Status: ABERTO — Trilha 3, executa SE IA/enxame for escopo Day-1
- Prioridade: P1

## Achados (relatório: auditoria/ia-autonomo-custos.md)

### DEBT-0012 — Loop ReAct fora do gateway — P1
`AgentExecutor.ts:219-276`, `fallback.util.ts:4-52`: executeWithTools → ChatOpenAI direto; sem quota/budget/AILog/circuit breaker por iteração; recursionLimit default (~25); gates rodam 1x. Quota mensal subconta os agentes mais caros.
**Correção:** rotear pelo gateway ou logAiUsage+tokenQuota+recordAiUsageCost por iteração + recursionLimit explícito + assertAiBudget no nó.
**Aceite:** iteração ReAct gera AILog + debita quota; budget estourado aborta loop.

### DEBT-0014 — TokenQuota fail-open + bypass sem tenantId — P1
`tokenQuota.service.ts:182-227,456-469`, `chat-model.ts:224-233`: DB down→0; jobs sem requestContext.tenantId pulam quota.
**Correção:** fail-closed ou fallback modelo econômico; requestContext.run em todos producers.

### DEBT-0015 — Fallback fabrica prompt aprovado — P1
`scriptAndPromptTool.ts:103-131` + `gateway.ts:95-208`: template hardcoded persistido `approved:true`. Falso sucesso visível.
**Correção:** remover fallback ou flag generatedByFallback+approved:false; endurecer API de fallback.

### DEBT-0013 (co 21) — Consentimento LGPD é env allowlist — P1→P2 se decisão aceitar env
`aiPiiConsent.service.ts:40-57`: fail-closed (bom) mas não é consentimento auditável por titular. Decisão jurídica pendente.

### DEBT-0036 — Automações e-mail sem aprovação por disparo — P2
`automation.engine.ts:41-56,430-455`: erro de `to` renderizado = envio errado em massa.

### DEBT-IA-07 — AIPendingAction sem retry visível — P2 (c/ 13)

## Contexto
Núcleo maduro: gateway multi-provedor, RAG c/ tenant, ledger AIPendingAction, consent gate ~15 chokepoints, enxame BullMQ real. Dívida concentra-se no caminho executeWithTools.
Verificar PR #382/#388 antes de codar.

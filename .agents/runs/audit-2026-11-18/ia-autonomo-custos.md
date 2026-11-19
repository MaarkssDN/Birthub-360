# Auditoria READ-ONLY — Agentes 07+13+23 (IA/automações/enxame/custos)
**Base:** `main @ b54060ad1`. Sem execução.

## Achados

### IA-01 — Caminho tool-calling do enxame CONTORNA o gateway de IA — **P1**
`AgentExecutor.ts:219-276`, `fallback.util.ts:4-52`, `base.agent.ts:99-134`. `executeWithTools` usa `buildModelWithFallback`→`ChatOpenAI` direto. Loop ReAct não passa por budget, quota, AILog, circuit breaker, dynamic routing. Quota mensal subconta os agentes mais caros.
Correção: rotear pelo gateway ou adicionar logAiUsage+tokenQuota+recordAiUsageCost por iteração + recursionLimit explícito + assertAiBudget.

### IA-02 — "Consentimento LGPD" é allowlist de env var, não consentimento registrado — **P1**
`aiPiiConsent.service.ts:40-57`, `env.ts:349`. `AI_PII_EXTERNAL_CONSENT_ORGANIZATIONS` (env, aceita '*') — fail-closed mas é kill-switch operacional, não consentimento auditável por org/titular. IA externa 100% OFF até ops editar env.
Correção: persistir consentimento por org (tabela+audit) e migrar consulta, mantendo env como override.

### IA-03 — TokenQuota fail-open e só com tenantId setado — **P1**
`tokenQuota.service.ts:182-227,456-469`, `chat-model.ts:224-233`. Falha de Postgres → retorna 0 (quota ignorada); cache 60s permite burst; chamadas sem requestContext.tenantId (jobs) pulam quota inteira.
Correção: fail-closed ou fallback p/ modelo econômico; garantir requestContext.run em todos producers.

### IA-04 — scriptAndPromptTool fabrica conteúdo quando provider falha e salva como prompt APROVADO — **P1**
`scriptAndPromptTool.ts:103-131`. Fallback de generateTextOutput retorna template hardcoded persistido em prisma.prompt com `approved:true`, indistinguível de IA real → falso sucesso clássico.
Correção: remover fallback/propagar erro ou flag generatedByFallback+approved:false.

### IA-05 — generateTextOutput/StructuredOutput aceita `fallback` arbitrário — P2
`gateway.ts:95-208`. API permite texto fabricado como se fosse do modelo. Callers: scriptAndPromptTool (ruim) e commercialAgentV3Orchestrator (honesto, execution.performed=false).

### IA-06 — executeWithTools sem gates por iteração nem budget no loop — P2
Gates rodam 1x antes do invoke; cada iteração ReAct chama Groq/OpenAI direto com maxRetries:3, sem recursionLimit explícito (~25 default) → dezenas de chamadas pagas sem controle incremental.

### IA-07 — AIPendingAction falhas sem retry visível — P2
`aiPendingAction.service.ts:288-320`. approved+!executed ficam paradas; verificar UI de retry.

### IA-08 — Automação "Notificar equipe" envia e-mail sem aprovação por disparo — P2
`automation.engine.ts:41-56,430-455`. Envio externo automático por trigger; sem ledger por execução; erro de `to` renderizado = e-mail errado em massa.

### IA-09 — Embeddings/paths sem tenantId fora do FinOps — P3

### IA-10 — Consent gate fail-closed até p/ agentes sem PII — P3 (comportamento seguro, documentar runbook)

## Verificado REAL (não mockado)
Gateway multi-provedor real (vLLM→Groq→OpenAI→OpenRouter→LiteLLM), sem key→erro explícito. Retry/timeout/circuit breaker/budget/quota/AILog/métricas Prometheus/OTel/Langfuse. RAG híbrido com tenant+proveniência. Prompt injection guard em ~6 pontos. Ledger AIPendingAction com ações reais (email/whatsapp/sms/cadence) + AuditLog. Enxame 24/7 BullMQ real com dedupe/cooldown/MAX_STEPS/dead-letter/SLO. Automações com idempotência+retry+histórico. Consent gate em ~15 chokepoints.

## Limitações
Não auditados: ingestion.service, vector.service, search.service internos, universalMeetingsTool, studio/generators, voicebox, PredictiveScoringNbaService, ~40 agentes V3.

## Top-5 riscos IA
1. IA-01+IA-06 loop ReAct fora do gateway → custo descontrolado + invisível.
2. IA-02 consentimento LGPD é env, não registro.
3. IA-03 quota fail-open + bypass sem tenantId.
4. IA-04/05 fallback fabricado salvo como aprovado.
5. IA-08 e-mail automático sem aprovação por disparo.

# Auditoria Geral — Agentes 07/13/16 (IA, Enxame e Runtime/Workers)

**Demanda:** DEM-20261115-001 · **Data:** 2026-11-15 · **Escopo:** somente leitura (fila BullMQ/Redis, workers, serviços de IA, litellm-config.yaml, governança do enxame).
**Método:** amostragem de arquivos centrais (todos os `worker-*.ts` de bootstrap, `src/lib/queue/**`, `src/lib/ai/**`, `litellm-config.yaml`, `swarmScheduler.service.ts`, `ai.service.ts`, `chat-model.ts`, `tokenQuota.service.ts`, `budget.ts`, `deadLetter.ts`, `metrics.ts`, `distributedLock.ts`, `domainEventMesh.service.ts`, `whatsappCommand.*`).

---

## 1. ELOGIOS (evidências)

- **Bootstrap modular e consistente.** Os 7 entrypoints (`worker.ts`, `worker-core.ts`, `worker-ia.ts`, `worker-crm.ts`, `worker-extracoes.ts`, `worker-mercado.ts`, `worker-prospecting.ts`) seguem o mesmo padrão: `initTracing()` → `registerProcessGuards()` → `startWorkerServer(workers, schedulers, role)` → `setWorkerProcessUp(false)` + `process.exit(1)` no catch fatal. Ex.: `worker.ts:213-217`, `worker-ia.ts:314-318`.
- **Guard de banco least-privilege no boot do worker monolítico.** `worker.ts:103` chama `assertDbRoleIsLeastPrivilege` — fatal em produção se o papel do banco tiver superuser/BYPASSRLS.
- **Proteção contra log-spam de Redis NOAUTH/WRONGPASS.** `src/lib/queue/redis.ts` (`makeAuthGuard`/`isAuthError`, ~linhas 40-60): detecta erro de credencial, para de reconectar e loga uma única vez — com comentário citando o incidente real de 2026-08-29 (dezenas de GB de log). Três conexões separadas (bullmq / rate-limit / cache) com políticas distintas e bem justificadas em comentário.
- **Bloqueio de workers embutidos em produção.** `redis.ts`: `ENABLE_EMBEDDED_WORKERS=true` em produção é fatal (`process.exit(1)`).
- **RLS resolvido nos workers.** Todos os workers relevantes executam dentro de `requestContext.run({ tenantId })` — padrão documentado com a causa raiz do bug P2025 em `index.ts:71-85` (leads) e `enrichment.queue.ts:453-455`. `swarmScheduler.service.ts:433` idem.
- **DLQ real + auditável no caminho crítico.** `whatsappCommand.worker.ts:80-118`: `handleWhatsAppJobFailure` distingue erro permanente (`UnrecoverableError` → DLQ imediato) de esgotamento de retries, grava `recordDeadLetter` (auditLog sanitizado) **e** enfileira em `whatsapp-messages-dlq` com `jobId` determinístico `dlq:{org}:{originalJobId}` — idempotente por construção (`whatsappCommand.queue.ts:82-96`). É o único caminho com DLQ reprocessável de verdade.
- **`recordDeadLetter` nunca lança e sanitiza PII/segredos.** `deadLetter.ts`: `sanitize()` trunca strings (500 chars), redige chaves sensíveis por regex de nome, limita profundidade/itens; `sanitizeError` remove Bearer tokens, chaves `gsk_`/`sk_`, pares `api_key=...`. Falha ao gravar vira `logger.error`, não segunda exceção.
- **Circuit breaker de IA distribuído via Redis com fallback local.** `circuit-breaker.ts:205-319`: estado compartilhado entre instâncias (INCR+EXPIRE+SET PX via `cacheConnection`), `recordCircuitSuccess` limpa falhas, rate-limit (429) **não** abre circuito (correto — 429 é transitório), e há `__resetCircuitBreakerForTests`.
- **Retry com respeito ao `Retry-After` do provedor.** `retry.ts:136-142`: `extractSuggestedRetryDelayMs` parseia "try again in Xms/Xs" do Groq/OpenAI; `MAX_ATTEMPTS_PER_LEG=3` justificado em comentário (TPM do tier gratuito do Groq). Timeout/abort e 4xx não são reexecutados — correto.
- **Timeouts em toda chamada HTTP de IA.** `http-client.ts:11-12,93`: `AbortSignal.timeout(timeoutMs)` com defaults 30s (gateway) / 60s (fallback) / configurável por env com clamp (`readBoundedInteger`, min/max).
- **Sanitização de erro de provedor.** `redaction.ts`: `readProviderError`/`sanitizeProviderMessage` removem Bearer/API keys do corpo de erro antes de ir a logs/telemetria.
- **Defesa contra prompt injection estruturada.** `prompt-safety.ts` (wrapper `<untrusted_external_content>` com neutralização do próprio delimitador via entidades HTML — impede "fechar" o bloco falsamente) + `untrustedContentGuard.ts` (padrões de injeção + strip de caracteres de controle).
- **Governança FinOps em 3 camadas.** `chat-model.ts:218-320`: `assertAiBudgetNotExceeded()` (budget global USD/mês, `budget.ts`) → `tokenQuotaService.enforceTokenQuota` por tenant (tier free/starter/pro/enterprise, fallback para modelo econômico ou bloqueio 429) → registro de custo `recordAiUsageCost` por provedor real + `tokenQuotaService.recordUsage`. Quotas em `tokenQuota.service.ts:44-70`.
- **Cache semântico multi-tenant com TTL por categoria e métricas FinOps.** `semanticCache.ts`: prefixo `semcache`, `CACHE_TTL` por categoria (24h enrichment / 7d firmográfico / 12h diagnóstico / 1h pesquisa), fallback em memória, métricas de tokens/custo economizados.
- **LGPD fail-closed na qualificação de lead.** `ai.service.ts:381-406`: `hasPiiExternalConsent(organizationId)` antes de qualquer chamada; sem consentimento retorna `BLOCKED_NO_CONSENT` com motivo explícito — nunca envia PII "mesmo assim". Minimização de PII (`minimizePii`/`rehydratePii`) preserva personalização sem expor nome do contato ao provedor (`ai.service.ts:330-378`).
- **Enxame com travas reais.** `swarmScheduler.service.ts`: candidatos deduplicados por lead (`byLead` map), cooldown configurável (`SWARM_RECOMMENDATION_COOLDOWN_HOURS`), `AIPendingAction` como segunda trava anti-duplicata, `attempts: 1` no scheduler (justificado: reexecução geraria recomendações duplicadas — `swarmScheduler.worker.ts:336-341`), `concurrency: 1` para não propor duplicado (`swarmScheduler.worker.ts:292-294`), `jobId` fixo por org no `upsertJobScheduler` (idempotente entre restarts).
- **Métricas Prometheus abrangentes.** `metrics.ts`: gauges de waiting/active/failed por fila, contador de stalled, idade do job mais antigo, completed/retry/DLQ por fila+motivo, `redis_connection_up` por papel, `redis_reconnect_total`, `workerProcessUp`. Instrumentação centralizada em `workerServer.ts:48` via `registerWorkerForRuntimeMetrics` — nenhum worker precisa lembrar de registrar.
- **Distributed lock correto.** `distributedLock.ts`: SET NX EX, compare-and-delete e compare-and-expire atômicos via Lua, fail-closed quando Redis indisponível, renovação com detecção de perda de posse.
- **Outbox transacional.** `domainEventMesh.service.ts`: `publishInTransaction` grava evento na mesma transação do caso de uso; `MAX_CAUSATION_DEPTH=5` com descarte defensivo contra tempestade de eventos; validação de tenancy obrigatória no envelope.
- **Config LiteLLM coerente com o código.** `litellm-config.yaml`: `usage-based-routing`, `enable_pre_call_checks`, fallbacks declarados (ex.: `deepseek-r1 → local-llama3`), modelo local `local-llama3` como fallback econômico — casa com `TIER_QUOTAS.economicalFallbackModel`.

---

## 2. PROPOSTAS DE MELHORIA

1. **DLQ unificada e replay.** Hoje só WhatsApp tem fila DLQ real; as demais filas gravam apenas `auditLog` (`deadLetter.ts`). Propor fila `*-dlq` genérica + worker/rota de replay idempotente (o `reprocessKey` já existe em `buildFailureState` — `deadLetter.ts:75-90` — falta o consumidor).
2. **Alertas sobre métricas já emitidas.** `bullmq_queue_failed_jobs`, `bullmq_oldest_waiting_job_age_seconds`, `bullmq_dlq_messages_total`, `redis_connection_up` existem mas dependem de regras de alerta externas; garantir alert.rules cobrindo "failed>0 por X min" e "oldest waiting > threshold".
3. **Concorrência explícita em todos os workers.** `createLeadsWorker` (`index.ts:57-123`) e o worker de search não declaram `concurrency` → BullMQ default = 1 (serial). Definir conscientemente (ex.: 3-5) ou documentar por que serial.
4. **Novos tenants do enxame sem restart.** `scheduleSwarmScheduler` só roda no boot; organização que ativar autonomia depois fica sem scheduler até o próximo deploy. Avaliar re-agendamento periódico ou trigger por mudança de config.
5. **Orçamento por org no caminho não-gateway.** `assertAiBudgetNotExceeded` é chamado em `chat-model.ts` (todo `getAiModel`), mas serviços que falam direto com Whisper/provedores fora do gateway (`whisperTranscription.service.ts`, `WHISPER_USD_PER_MINUTE`) podem escapar do teto — auditar se há `assertAiBudgetNotExceeded` no worker de transcrição.
6. **`localFallbackStore`/`localCircuitFallback` sem TTL próprio em alguns pontos** — verificar evicção (ver item 3.3).
7. **Governança do enxame: consolidar SLO panel.** `getSwarmSloSnapshot` (`swarmScheduler.service.ts:625+`) já computa métricas; garantir que o painel do Agente 13 consuma sem fabricar zeros (regra do prompt 13).

---

## 3. ERROS, FALHAS E DÍVIDAS

### P0 — nenhum encontrado no escopo auditado.

### P1

1. **`agentQueue` criada incondicionalmente, ignorando `queuesEnabled`.** `agent.worker.ts:157`: `export const agentQueue = new Queue(AGENT_QUEUE_NAME, { connection })` — sem o guard `queuesEnabled ? ... : null` usado em `leadsQueue`/`enrichmentQueue`/`whatsappCommandQueue`. Em ambiente sem `REDIS_URL` (dev local), `connection` é `lazyConnect` com `enableOfflineQueue:false`; `enqueueSdrOutboundDraft` (`agent.worker.ts:176-193`) tentará comandos e falhará de forma pouco diagnóstica. Ademais, `createAgentWorker()` também não verifica `queuesEnabled` — `worker-ia.ts:282` instancia o worker sempre. **Correção:** espelhar o padrão condicional das demais filas.
2. **`IdempotencyManager` é código morto e não é durável.** `idempotencyManager.ts`: comentário diz "Barramento de Idempotência Durável", mas a implementação é um `Set<string>` em memória de processo — morre no restart, não é compartilhado entre réplicas, e **nenhum arquivo o importa** (grep confirma zero consumidores fora do próprio arquivo). Se algum dia for adotado, (a) não resolve duplicidade multi-instância, (b) `processedKeys` cresce sem bound → memory leak. **Ação:** remover ou reescrever sobre Redis/DB com TTL.
3. **`piiSanitizer.ts` continua código morto.** Prompt do Agente 13 registra a dívida; grep `piiSanitizer` em `src/` retorna zero imports. Risco: falso senso de cobertura de sanitização.

### P2

4. **`processedKeys`/`localFallbackStore`/`localCircuitFallback`/`localTokenUsageCache` — Maps em memória sem eviction visível.** `idempotencyManager.ts` (Set infinito), `semanticCache.ts` (`localFallbackStore` + `localTenantKeys`), `circuit-breaker.ts:219` (`localCircuitFallback` — só limpo em `recordCircuitSuccess` ou overflow), `tokenQuota.service.ts` (`localTokenUsageCache` — tem `expiresAt`, ok). Em processo worker de longa vida, keys nunca removidas em paths de falha acumulam. Severidade depende de volume; `localCircuitFallback` é pequeno (por provider), mas `localTenantKeys`/`processedKeys` podem crescer com tenants.
5. **DLQ ausente em 5 workers.** Sem `recordDeadLetter`: `accountIntelligenceScheduler.worker.ts`, `checkpointerPrune.worker.ts`, `voice-hub/services/{audit,retentionScheduler,slaScheduler}.ts`. Falha final nesses jobs some silenciosamente (só log de erro do BullMQ). Os demais ~25 workers têm DLQ — inconsistência de cobertura.
6. **`queueCompanyEnrichment` reporta `enqueued:true` no fallback direto.** `enrichment.queue.ts:443`: fallback `setImmediate` retorna `{ enqueued: true, executedDirectly: true }` — o caller não distingue "job na fila" de "rodando em background não rastreado" (sem retry, sem DLQ, sem métrica de fila). Falha vira só `logger.error` (`:435-439`) — job perdido sem dead-letter.
7. **Transcrição Whisper: verificar teto de custo.** `transcribeConversation.worker.ts` importa `assertAiBudgetNotExceeded` (bom), mas `WHISPER_USD_PER_MINUTE` sugere cobrança por minuto; confirmar que quota de tokens FinOps não se aplica a áudio (custo fora do controle de `tokenQuota`) e que há cap de duração/tamanho do arquivo.
8. **`agentQueue` sem `defaultJobOptions`.** `agent.worker.ts:157` — jobs só herdam `attempts:3` porque `enqueueSdrOutboundDraft` os define explicitamente (`:186-190`). Qualquer produtor futuro que use `agentQueue.add` direto terá `attempts:1` e sem `removeOnFail` → acúmulo infinito no Redis. Idem `swarmSchedulerQueue` (`swarmScheduler.worker.ts:278`) e `accountIntelligenceSchedulerQueue` — criadas sem defaults; hoje os schedulers passam `opts` por job, mas a fila em si não se protege.
9. **`recordDeadLetter` grava `tenantId: input.organizationId ?? ''`** (`deadLetter.ts`) — auditLog com tenant vazio pode violar expectations de relatórios por tenant; considerar rejeitar/não gravar ou usar tenant de sistema explícito.
10. **Retry infinito potencial via `withRetry` + job retry.** Camadas de retry se multiplicam: job BullMQ (3 tentativas) × `withRetry` do gateway (até 3 por perna × N provedores) × `MAX_ATTEMPTS_PER_LEG`. Pior caso ≈ 3 jobs × 3 tentativas × 3 provedores × 3 retries ≈ dezenas de chamadas LLM por job — custo multiplicado em cenários de outage. Não há budget de "chamadas por job"; o teto global/mensal mitiga, mas um job envenenado pode queimar quota do tenant inteiro. Considerar classificação de erro não-retentável no nível do job (já existe `isRetryableAiError`, mas o worker não a usa para abortar retries do BullMQ).

### P3

11. **`worker.ts` concentra ~25 workers num único processo** (`worker.ts:104-180`). Escala vertical única; um worker travado/loop consome o processo todo. O split por role (`worker-ia`, `worker-prospecting` etc.) existe mas `worker.ts 'all'` o anula em deploy que use o entrypoint único. Documentar qual entrypoint o deploy usa.
12. **`enabledOrganizations()` só avaliado no boot** — nova org com autonomia ativada não entra no scheduler nem no cold-call até restart (ver proposta 4).
13. **`Organization.monthlyAiBudgetUsd` vs `AI_MONTHLY_BUDGET_USD`** — dois tetos coexistindo (`budget.ts:17-22`); risco de confusão operacional sobre qual está ativo. Documentar precedência.
14. **`scheduleGlobalNewsScan`/`scheduleCheckpointerPrune` e afins no `worker.ts` 'all'** — schedulers duplicados se múltiplos entrypoints rodarem juntos no mesmo Redis (upsertJobScheduler mitiga para os que usam; verificar os que usam `queue.add` com `repeat` legado).
15. **Cobertura de teste de DLQ/reprocess**: existe `newsMonitor.worker.test.ts` e testes de circuit breaker/tokenQuota, mas não há teste de integração "job falha N vezes → deadLetter + métrica DLQ" para as filas genéricas.

---

## 4. Veredito

Base de filas/IA **madura e acima da média**: DLQ real no caminho crítico, idempotência por `jobId` determinístico, RLS propagada corretamente, FinOps em 3 camadas, circuit breaker distribuído, sanitização de PII/segredos consistente. As dívidas concentram-se em: **(a)** filas criadas sem guard `queuesEnabled`/`defaultJobOptions` (`agent.worker.ts`, `swarmScheduler.worker.ts`), **(b)** idempotência "durável" que é um `Set` em memória e código morto, **(c)** DLQ audit-only fora do WhatsApp (sem replay), e **(d)** multiplicação de camadas de retry sem teto por job.

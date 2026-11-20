# Inventário Mestre de Dívida — Release Readiness 2026-11-18
**Base auditada:** `main @ b54060ad1` | **Método:** 11 relatórios de domínio em `.agents/runs/audit-2026-11-18/` + gates executados + reconciliação de 22 PRs abertos. Deduplicado entre relatórios.
**Legenda Impacto:** BLOQUEADOR = impede GO; DEPENDE DE DECISÃO = precisa resposta humana/config; NÃO BLOQUEADOR = débito rastreado.

## P0 — Críticos

| ID | Título | Fonte | Impacto | Status |
|---|---|---|---|---|
| DEBT-0001 | Deploy EC2 real não roda `prisma migrate deploy` nem healthcheck (scp+restart cego) — viola B-05 | INF-01 | BLOQUEADOR | Não corrigido; PRs não cobrem |
| DEBT-0002 | Zero backup real de produção; backup/restore/DR/rollback são stubs que reportam sucesso falso | INF-02, DB-07 | BLOQUEADOR | Não corrigido |
| DEBT-0003 | Worker dedicado não registra consumidores `bitrix-outbound-sync`/`external-crm-outbound-sync` — filas sem consumidor em topologia worker | WRK-01 | BLOQUEADOR se deploy usa worker dedicado; verificar topologia | Não corrigido |
| DEBT-0004 | App mobile aponta para backend sem DNS (`app.birthhub360.com.br` não resolve; App Link → onrender arquivado) | INF-05 | DEPENDE DE DECISÃO (mobile no escopo Day-1?) | Não corrigido |

## P1 — Altos (confirmados, com evidência de código)

| ID | Título | Fonte | Impacto | Dono provável |
|---|---|---|---|---|
| DEBT-0005 | SSRF residual: `isSafeUrl` fraco (sem DNS pinning, IPv6/link-local/CGNAT/metadata) + redirects sem revalidação em `/prospecting/enrich` e crawler; rota sem requireRole | SEC-01 | BLOQUEADOR (P0 se metadata cloud alcançável) | 05/15 |
| DEBT-0006 | Fallback global `BITRIX24_WEBHOOK_URL` importa leads de portal alheio p/ qualquer org sem conexão | SEC-02, CRM-09 | BLOQUEADOR se env setada em prod — **verificar env** | 01/06 |
| DEBT-0007 | Webhook 3CX com segredo global compartilhado → forja cross-tenant de eventos | SEC-03 | BLOQUEADOR se >1 org usa 3CX | 12/01 |
| DEBT-0008 | `hasLeadReplied` sem corte temporal → resposta histórica encerra cadência no 1º tick (feature inerte) | PRO-01 | BLOQUEADOR módulo Cadência | 17 |
| DEBT-0009 | Toque de voz `pending` sem TTL/sweeper → run de cadência trava `locked` eterno | PRO-02 | BLOQUEADOR módulo Cadência | 17/12 |
| DEBT-0010 | Nenhuma mensagem outbound instrui opt-out (sem "responda SAIR"/footer/List-Unsubscribe) — opt-out inexerciseível | PRO-03 | BLOQUEADOR LGPD/envio | 17/05 |
| DEBT-0011 | `sendColdEmail` sem persistência (sem Activity/EmailMessage), sem idempotência, sem bounce, legalBasis não gravada | PRO-04 | BLOQUEADOR cold-email/LGPD | 05 |
| DEBT-0012 | Loop ReAct do enxame fora do gateway: sem quota/budget/AILog/circuit breaker por iteração; custo invisível | IA-01, IA-06 | BLOQUEADOR se enxame/IA externa ligado | 07/13 |
| DEBT-0013 | "Consentimento LGPD" de IA é allowlist de env var, não consentimento registrado por org/titular | IA-02 | DEPENDE DE DECISÃO (alegação de conformidade) | 13/21 |
| DEBT-0014 | TokenQuota fail-open (DB down→0) + bypass sem tenantId em jobs → teto de custo não garantido | IA-03 | BLOQUEADOR custo IA | 07 |
| DEBT-0015 | `scriptAndPromptTool` fallback fabrica prompt e salva `approved:true` — falso sucesso de IA | IA-04 (+IA-05 API de fallback) | BLOQUEADOR honestidade IA | 07 |
| DEBT-0016 | `batchUpdateLeads` não atômico: status persiste mas failedCount conta falha (trade-off documentado, pendente adendo 24) | CRM-01, DB-04 | BLOQUEADOR UX/dados | 04 (PR #390 pendente) |
| DEBT-0017 | Mesa de Tratamento + IA `start_cadence` alteram Lead.status fora do fluxo canônico (sem histórico/pipeline/closedAt) | CRM-02, CRM-03, DB-04 | BLOQUEADOR integridade CRM | 04/07 |
| DEBT-0018 | `Contact.companyId` sem validação de tenant → vínculo cross-tenant | CRM-04 | BLOQUEADOR integridade | 04/01 |
| DEBT-0019 | Exclusão de Company é hard delete sem guarda de dependências (schema tem deletedAt não usado) | CRM-05 | BLOQUEADOR perda de dados | 04 |
| DEBT-0020 | Importação Bitrix (Company/Contact/Lead) não atômica → órfãos parciais | DB-03 | BLOQUEADOR integridade dados | 06/01 |
| DEBT-0021 | `retentionPurge.service.ts` dead code + incompatível com RLS (sem requestContext.run) — retenção de logs nunca executa | DB-01 | BLOQUEADOR retenção/LGPD | 01A |
| DEBT-0022 | Voz persiste transcrição/áudio/rawPayload sem retenção/anonimização; consentimento DECLINED não impede storage; DSR não cobre ThreeCXCallEvent | VOZ-01, VOZ-02 | BLOQUEADOR LGPD se voz no escopo | 12/21 |
| DEBT-0023 | `executeVoiceCommand` falso sucesso (OPT_OUT ignora retorno, TRANSFER/HANGUP marcam verified sem efeito) + OPT_OUT telefone arbitrário | VOZ-03, VOZ-04, SEC-08 | BLOQUEADOR se comandos de voz ativos | 12 |
| DEBT-0024 | Sem criação manual de lead/oportunidade na UI; palette "Nova oportunidade" navega para intent que CrmBoard ignora | UX-01 | BLOQUEADOR jornada CRM | 02/04 |
| DEBT-0025 | Clusters mortos sob typecheck: `ai-voice/`+`voice/` (inclui VOZ-03/04/05), `proposals/` (assinatura simulada), `temporal-workers/`+`crawlee/` (não compilam, excluídos do tsconfig) | ARQ-01, ARQ-02, ARQ-03 | NÃO BLOQUEADOR direto; BLOQUEADOR de higiene/manutenção — decidir remover ou reintegrar | 00/12 |
| DEBT-0026 | SonarQube mede cobertura só do unitário (~30% piso); verify:integrations/verify:ai fora do CI → issue #200 estruturalmente insatisfatível | QA-01, QA-14, QA-02 | BLOQUEADOR gate de qualidade | 08 |

## P2 — Médios relevantes (amostra dos confirmados; lista completa nos relatórios)

| ID | Título | Fonte |
|---|---|---|
| DEBT-0027 | TMQ/velocidade vendas retorna null por comparação stageName enum≠label | CRM-10 |
| DEBT-0028 | convertLead não valida estado anterior (reabre deal ganho/perdido, zera closedAt) | CRM-06 |
| DEBT-0030 | LeadStageHistory best-effort engole erro → forecast/auditoria incompletos silenciosos | CRM-07, DB-04 |
| DEBT-0031 | Escritas Contact/Activity/Enrichment sem organizationId no where final (só pré-check+RLS) | CRM-08, SEC-06 |
| DEBT-0032 | Funil "Negócio" com estágios hardcoded de pilotos de cliente | UX-10 |
| DEBT-0033 | Gamificação esconde erro API como empty state; KPI pipeline null→"R$ 0" | UX-03, UX-07 |
| DEBT-0034 | Opt-out gaps: lead sem contactId não coberto por flags; recordContactOptOut ignora scope/channel; TOCTOU check→send | PRO-09, PRO-10 |
| DEBT-0035 | Budget prospecting pode ser ilusório se `recordProspectingProviderSpend` não for mais chamado | PRO-11 |
| DEBT-0036 | Automações e-mail disparam sem aprovação por execução; erro de `to` = envio errado em massa | IA-08 |
| DEBT-0037 | Rollback de produção depende de tag de imagem que deploy nunca cria; runbooks divergentes | INF-03 |
| DEBT-0038 | Observabilidade cega em produção: Prometheus não scrapea prod, sem Alertmanager receptor, EXPOSE_METRICS off | INF-04 |
| DEBT-0039 | identidade-visual/ documenta paleta Neon anterior; splash Capacitor Obsidian | INF-06 |
| DEBT-0040 | migration-drift e golden-eval `continue-on-error` no CI; 9 GHSA allowlisted sem expiração | INF-07, QA-03, QA-04 |
| DEBT-0041 | E2E serial ~73min c/ retries mascarando flake; visual regression c/ bypass de escopo + 11 snapshots divergentes (#201) | QA-05, QA-06 |
| DEBT-0042 | OpenAPI documenta endpoints inexistentes (/cadence/opt-outs/check, /runs/{id}/events); drift checker não detecta doc-sem-código | API-01, API-02 |
| DEBT-0043 | 3+ envelopes de erro/sucesso heterogêneos; público usa `{ok}` que apiFetch não desembrulha | API-03 |
| DEBT-0044 | POSTs sensíveis sem idempotência (booking, promote, cold-email, convert, mesa register) | API-04, PRO-04 |
| DEBT-0045 | ~24 endpoints de IA e rotas prospecção sem requireRole/Zod → VISUALIZADOR dispara LLM pago; payload inválido→500 | API-07, API-08, PRO-12, SEC-05 |
| DEBT-0046 | SIP/WebRTC bridge dormente inseguro (token/URL/recording fabricados, orgId arbitrário) — remover defaults antes de reativar | VOZ-05, ARQ-01 |
| DEBT-0047 | Webhooks voz: timestamp opcional + dedupe Redis fail-open 30min; fingerprint de payload reserializado | VOZ-06 |
| DEBT-0048 | Retry/backoff/DLQ inconsistente; schedulers sem opts; DLQ outbox sem requeue/purge agendado | WRK-02, WRK-03 |
| DEBT-0049 | Chamadas de voz sem lock/idempotência na origem → double-dial real | WRK-04 |
| DEBT-0050 | VoiceHubView engole erro API como "não configurado" | VOZ-07 |
| DEBT-0051 | Filas voice-hub fora do registry de métricas; webhookService.dispatch engole falha | WRK-05, WRK-06 |
| DEBT-0052 | `public/design-lab/` publica ~100 arquivos internos em produção; `agente-codigo-local/` segundo app no repo | ARQ-05, ARQ-06 |
| DEBT-0053 | 4 componentes React com `// @ts-nocheck` (orbs 3D/brand em produção) | ARQ-07 |
| DEBT-0054 | framer-motion + motion duplicados; ≥15 deps mortas prováveis (dompurify c/ 6 waivers); 4-5 stacks LLM paralelos | ARQ-08, ARQ-09, ARQ-10 |
| DEBT-0055 | gitleaks allowlist `.agents/runs/**.md` ampla → segredo em relatório futuro passa no scan | ARQ-12 |
| DEBT-0056 | Soft delete opt-in inconsistente (AUDITABLE_MODELS cobre 9 de ~14 models) | DB-05 |
| DEBT-0057 | Gate RLS estático com pontos cegos (tabelas filhas, DROP POLICY posterior) | DB-06 |
| DEBT-0058 | Skips em fluxo de receita: proposalVersioning "Pago"→DealClosureEvent (2 it.skip); test:containers fora de CI | QA-09, QA-08 |
| DEBT-0059 | Settings de pilar: 3/4 abas placeholder não persistidas; perfil read-only | UX-08, UX-09 |
| DEBT-0060 | Playbooks botão "Abrir Roteiros" morto; War Room score heurística local | UX-02, UX-04 |
| DEBT-0061 | Outbound legado sem tenant canônico/RLS (`normalizeTenantCompany` colapsa orgs); gated 503 — **não reativar sem migrar p/ organizationId+RLS** | DB-02 |
| DEBT-0062 | `AdaptiveMultichannelCadenceService.executeNextStep` simula envio, `success:true`+messageId fabricado (mesmo padrão falso-sucesso de DEBT-0015) | PRO-06 |
| DEBT-0063 | `SelfDrivingCrmService` com `InMemoryOptOutRepository`+Maps — se ligado, opt-outs LGPD não persistem (fail-open) | PRO-07, UX-06 |
| DEBT-0064 | AIPendingAction: ações aprovadas que falham não têm retry visível confirmado | IA-07 |
| DEBT-0065 | Auth components legadas mortas + PromptStudio órfão + deep link ?lead inválido silencioso | UX-05, UX-11 |

## P3 — Baixos (registrados, não bloqueiam)
SEC-04 enumeração e-mail convite; SEC-07 env cru; PRO-05 batch sem consumidor; PRO-08 InMemoryOptOut 200; PRO-13/14 module-gate/dead code; API-05 listas sem paginação; API-06 campo divergente voz (#NaN); API-09/10/11/12; DB-08 FKs/tenant schema; ARQ-04/13/14/15; INF-08/09; QA-07/10/11/13; VOZ-08.

## Não verificado / depende de ambiente real
- `.env` do EC2: `BITRIX24_WEBHOOK_URL`, `THREECX_WEBHOOK_SECRET`, `EXPOSE_METRICS`, encryption keys, `ENABLE_QUEUES`/topologia worker.
- Branch protection GitHub; Prometheus/Grafana no host; backups agendados (cron); DNS/TLS prod.
- Execução real de `test:integration`/`test:e2e` local (Docker) — gates de CI cobrem no SHA do PR, não necessariamente em main local.
- Diffs exatos dos PRs #381–#393 vs main (vários achados "não coberto por PR" podem estar em branches — reconciliar antes de corrigir).

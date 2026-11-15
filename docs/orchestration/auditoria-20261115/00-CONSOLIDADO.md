# Consolidação da Auditoria Geral — DEM-20261115-001

**Data:** 2026-11-15 · **Orquestrador:** Agente 00
**Fontes:** 21 relatórios de cluster em `docs/orchestration/auditoria-20261115/` (clusters com auditoria dupla do re-despacho tiveram os pares fundidos nesta consolidação).

## Sumário executivo

| Cluster | Relatórios | P0 | P1 | Destaques |
|---|---|---|---|---|
| 01/01A Dados/RLS | 01-dados-schema-rls.md + 01-plataforma-dados.md | 0 | ~6 | RLS/tenancy exemplar; anonimização LGPD com lacunas; drift schema↔migrations reincidente |
| 02/03 Frontend/UX/Design | 02-03-frontend-ux-design.md + 02-03-produto-ux-design.md | 0 | ~6 | DS maduro; ~2.963 hex hardcoded; alert()/confirm nativos; skip-link ausente |
| 04/05 CRM/BI/Prospecção | 04-05-crm-bi-prospeccao.md + 04-crm-bi.md + 05-prospeccao.md | 0 | ~7 | batchUpdateLeads grava enum errado; **SSRF em webScraper via /prospecting/enrich sem requireRole**; Places fora do teto de budget |
| 06/06A Integrações/Bitrix | 06-integracoes-bitrix.md | 0 | ~5 | Bitrix maduro; sync CRM externo reporta sucesso sem persistir; pushLeadToAllConnections engole falhas |
| 07/13/16 IA/Runtime/Workers | 07-13-16-ia-runtime-workers.md + 07-ia-runtime.md | 0 | ~7 | **Outbox relay nunca iniciado** (eventos FAILED para sempre); **winLossAnalysis envia PII sem consentimento**; agentQueue ignora queuesEnabled |
| 08/08A QA/Release/Deploy | 08-qa-release-deploy.md + 08-qa-ci.md | 1–2 | ~4 | CI excepcional; deploy 100% manual sem gate/rollback; artefatos OCI inexistentes |
| 09 Mobile | 09-mobile.md | 2 | ~3 | iOS crasha sem NS*UsageDescription; offline sync é código morto |
| 10 Infra/SRE | 10-infra-sre.md | 3 | ~5 | Docker 2375 sem auth na LAN; ZERO backup de produção; smoke/rollback tests falsos |
| 11/12 Marca/Voz | 11-12-marca-voz-telefonia.md + 12-voz-telefonia.md | 0 | ~10 | Marca bem governada; **voice-hub inteiro morto (503)**; transcrições sem masking PII; `GET /calls/:id` sem requireRole; stubs com falso sucesso |
| 14/18 Contratos/API | 14-18-contratos-api-harness.md + 11-17-18-marca-cadencia-contratos.md | 0 | ~5 | OpenAPI drift check passa, **mas só num sentido** — doc sem rota (ex.: `/cadence/opt-outs/check`, `/cadence/runs/{id}/events`) não é detectado; contrato analytics declarado 3× e divergente; 3 sistemas de marca divergentes |
| 15/21 Segurança/LGPD | 15-21-seguranca-lgpd.md | 0 | ~5 | Postura excelente (Argon2id, AES-GCM, ROPA); retenção sem job de purge; sem DSR self-service |
| 17/22 Cadência/Verificação | 17-22-cadencia-verificacao.md | 1 | ~4 | Opt-out maduro; canal e-mail da cadência é "surdo" (sem transporte inbound, sem List-Unsubscribe) |
| 23/24 Custo/Perf/Review | 23-24-custo-performance-revisao.md | 0 | ~4 | AgentExecutor bypassa gateway/orçamento de IA (~15 agentes invisíveis ao AILog) |

**Totais aproximados:** 5–7 P0, ~50 P1, dezenas de P2/P3. **Nenhum P0 de vazamento de dados confirmado**; os P0 são operacionais (backup zero, docker exposto, iOS crash, cadência sem descadastro).

---

## Onda AUD-1 — Contenção, Segurança e Continuidade (prioridade máxima)

Justificativa: riscos que podem causar perda de dados, exposição ou violação LGPD independente de novas features.

| # | Achado | Dono | Evidência |
|---|---|---|---|
| A1 | **Zero backup de produção** (EC2 single-node) | 10 | 10-infra-sre.md |
| A2 | Docker daemon `192.168.0.116:2375` sem auth exposto na LAN | 10 + 15 | 10-infra-sre.md, 15-21 (rotação de segredos já documentada) |
| A3 | `production-smoke-tests.sh`/`rollback-drill.sh` são falsos (echo+exit 0) | 10/08 | 10-infra-sre.md, 08-qa-release-deploy.md |
| A4 | Deploy manual sem gate, sem `prisma migrate deploy`, `StrictHostKeyChecking=no`, sem rollback | 08A + 10 | 08-qa-release-deploy.md |
| A5 | Retenção declarada sem job de purge (`LANDING_LEAD_RETENTION_*`); sem expurgo CRM Contact/Lead; sem canal self-service DSR | 15/21 + 01 | 15-21-seguranca-lgpd.md, 01-dados-schema-rls.md |
| A6 | Anonimização LGPD não cobre `Note`, `WhatsAppMessage.phoneE164`, `EmailMessage`, `Attachment` (S3), `EnrichmentLog.rawData`; `AuditLog` retém PII sem retenção | 01/01A + 21 | 01-dados-schema-rls.md |
| A7 | `purge-expired-data.sql` função morta e perigosa (não limpa índices cegos) | 01 | 01-dados-schema-rls.md |
| A8 | Canal e-mail da cadência sem transporte inbound + sem `List-Unsubscribe`/rodapé (risco LGPD/entregabilidade) | 17 + 06/05 | 17-22-cadencia-verificacao.md |
| A9 | `SECURE_COOKIES` default false; `sanitizeRequest` não montado; `/api-docs` sem auth quando flag ligada; token de operador via query string | 15 | 15-21-seguranca-lgpd.md |
| A10 | Scripts raiz com senha `00000000`/bypass de sessão (`create-auth.ts`, `create_admin_user.ts`, `seed_users.ts`) | 15 + 01 | 01-plataforma-dados.md |
| A11 | **SSRF em `webScraper.service.ts`** (sem DNS pinning/redirect/body limit) exposto via `POST /api/prospecting/enrich` **sem `requireRole`** — qualquer autenticado (incl. VISUALIZADOR) dispara scraping arbitrário + Playwright | 05 + 15 | 05-prospeccao.md |
| A12 | **winLossAnalysis envia PII a LLM sem `assertPiiExternalConsent`** — corpos de WhatsApp/timeline ao modelo sem gate de consentimento | 07 + 21 | 07-ia-runtime.md |

**Handoffs propostos:** `15-para-01` (purge jobs + anonimização), `10-para-08` (smoke/rollback reais + deploy gate), `17-para-06` (transporte inbound e-mail + unsubscribe), `15-para-21` (DSR self-service — decisão de produto).

## Onda AUD-2 — Integridade de Domínio, IA e Voz

| # | Achado | Dono | Evidência |
|---|---|---|---|
| B1 | `batchUpdateLeads` grava rótulo legível no enum Prisma → mudança de etapa em lote falha silenciosamente e bypassa gates/eventos | 04 | 04-05-crm-bi-prospeccao.md |
| B2 | Sync de import CRM externo (HubSpot/Pipedrive/RDStation/Monday) reporta sucesso sem persistir nada | 06 | 06-integracoes-bitrix.md |
| B3 | `pushLeadToAllConnections` engole falhas via `allSettled` sem log/retry; webhook 3CX síncrono (DIV-06-003 pendente) | 06 | 06-integracoes-bitrix.md |
| B4 | `AgentExecutor.executeWithTools` fora do gateway: ~15 agentes sem `logAiUsage`/budget/quota/circuit breaker — gasto invisível | 23 + 07 | 23-24-custo-performance-revisao.md |
| B5 | `agentQueue`/`createAgentWorker` ignoram `queuesEnabled`; DLQ ausente em 5 workers; `IdempotencyManager` é Set em memória (código morto) | 16/07 | 07-13-16-ia-runtime-workers.md |
| B6 | Voz: `PrismaCallRecordRepository` só in-memory, `StreamingEngine`/`TwilioProvider`/`BimodalLiveVoice` stubs com falso sucesso, URLs LiveKit fabricadas | 12 + 01 | 11-12-marca-voz-telefonia.md |
| B7 | Segundo motor de cadência cenográfico (`MultichannelCadenceEnrollment`) move com `success:true` sem enviar; `src/features/proposals/**` e `selfDrivingCrm.service.ts` dead code | 17 + 04 | 17-22-cadencia-verificacao.md |
| B8 | Anonimização não cobre modelos de cadência (`EmailMessage`, `CadenceTouchAttempt`, `MultichannelCadenceEnrollment`, assinaturas) | 01 + 21 | 17-22 + 01 |
| B9 | GETs WhatsApp sem `requireRole` (PII legível por qualquer papel); token Pipedrive em query string | 06 + 15 | 06-integracoes-bitrix.md |
| B10 | N+1 residuais (`cadenceWebhookResolver`, `dealRiskDetection`), `findMany` sem `take` (Mesa de Tratamento, Copiloto), over-fetch `company/contact` em crmTools | 04/23 + 01 | 23-24 + 04-05 |
| B11 | **Outbox relay nunca iniciado** — `startDomainEventOutboxRelay()` sem caller; eventos com `DOMAIN_EVENT_OUTBOX=prisma` ficam `FAILED` para sempre (~15 produtores) | 16 + 07 | 07-ia-runtime.md |
| B12 | Transcrições de voz (`VoiceCallLog.transcript`, `Note.content`) em claro sem masking PII; `telephonyProvider.service.ts` loga telefones em claro | 12 + 15/21 | 12-voz-telefonia.md |

**Handoffs:** `04-para-01` (B1 schema/enum), `06-para-01` (B2/B3 persistência honesta), `07-para-23` (B4 gateway), `07-para-16` (B11 outbox relay), `12-para-15/21` (B12 masking de transcrição), `16-para-01` (B5 DLQ schema), `12-para-07` (B6 voz real ou remover stubs), `17-para-07` (B7 destino do motor cenográfico), `05-para-15` (A11 SSRF webScraper + requireRole), `07-para-21` (A12 consentimento winLoss).

## Onda AUD-3 — Mobile e Experiência (UX/UI/A11y)

| # | Achado | Dono |
|---|---|---|
| C1 | iOS `Info.plist` sem `NSCameraUsageDescription`/`NSMicrophoneUsageDescription`/`NSLocationWhenInUseUsageDescription` → crash em getUserMedia/MediaRecorder | 09 |
| C2 | Offline sync é código morto — `offlineSyncService.enqueue*` sem consumidores; `FieldMeetingRecorder` sem rota | 09 + 02 |
| C3 | `SceneDelegate.swift` hardcoded URL Render desativada; `validTabs` iOS diverge do Android (~34 vs ~60, drift bidirecional) | 09 |
| C4 | Skip-link ausente (WCAG 2.4.1); erros de formulário sem `aria-describedby`/`role="alert"`; `alert()`/`window.confirm` nativos em voice-hub/integrations/prospecting | 03 + 02 |
| C5 | `OperationalStateContainer` (mandatório no DESIGN.md) com zero usos; ~2.963 hex hardcoded fora dos tokens; `Modal.tsx`/`BottomSheet`/`ModulePlaceholder` mortos; rota `gamification` duplicada; ErrorBoundary raiz com cores hardcoded | 03 + 02 |
| C6 | Paleta "dourado" conflitante (DESIGN.md `#FFC107` vs CSS `#D4AF37`); pasta órfã `birthub-360-assets`; 4 DOCUMENTO_MESTRE sem versão canônica | 11 + 03 |
| C7 | Contrato de analytics declarado 3× e divergente (`analytics.service.ts` stale vs `AnalyticsUseCases`); worker PDF semanal consome implementação legada | 18 + 04 |

**Handoffs:** `09-para-02` (C2/C3 rotas e navegação), `02-para-03` (C4/C5 padronização a11y), `11-para-03` (C6 tokens), `18-para-04` (C7 contrato analytics).

## Onda AUD-4 — Plataforma, Contratos e Processo

| # | Achado | Dono |
|---|---|---|
| D1 | Validação Zod cobre ~37/109 routers; auth de 5 prefixos depende de efeito colateral do rate limiter; `test:api-schema` morto; `npm run docs` inexistente | 18 + 01 |
| D2 | Drift schema↔migrations reincidente (2×); `migrate.sql` solto na raiz; `prospecting/outbound/server/db.ts` SQL cru fora de RLS | 01 |
| D3 | Três implementações Bitrix paralelas mortas mantidas por testes; `bitrix_fields.json`/`parsed_fields.json` expõem taxonomia de portal real | 06 + 15 |
| D4 | fly.toml `[[services]]` duplicado; `vercel.json`/`onda-2.5-validation.yml` obsoletos; `release:check` órfão; golden-eval `continue-on-error` | 08 |
| D5 | `_MATRIX.csv` parsing quebrado; 29 handoffs RESOLVIDO com `aprov=NAO`; ~79 pareceres sem hash de revisão | 24 + 00 |
| D6 | k8s/+argocd ainda com banners `[ARCHIVED]` na raiz (só render.yaml.disabled foi movido); RUNBOOK aponta para docker-compose.oci.yml/deploy-oci.sh inexistentes; ~15 imagens `:latest` | 10 + 08 |
| D7 | Enxame: novos tenants exigem restart; dois tetos de budget coexistem; Maps em memória sem eviction em workers long-running | 13 + 16 |
| D8 | Transcrições em texto claro sem criptografia/controle dedicado; mídia sem Git LFS; screenshots possivelmente com PII | 12 + 21 |
| D9 | Prompts/documentação: `docs/performance/**` e `scripts/benchmarks/**` inexistentes; `RELATORIO_PERFORMANCE.md` placeholder | 23 |
| D10 | **Drift OpenAPI fantasma**: `verify-openapi-drift` só checa rota→doc; doc sem rota passa verde (`/cadence/opt-outs/check`, `/cadence/runs/{id}/events` documentados e inexistentes); `mapa-de-navegacao.md` defasado vs `tabMeta.ts`; schema de `POST /cadence/opt-outs` diverge do body real | 18 + 17 |

**Handoffs:** `18-para-01` (D1/D2 rotas+schema), `06-para-15` (D3 jsons públicos), `08-para-10` (D4/D6 artefatos), `24-para-00` (D5 processo), `13-para-16` (D7 enxame).

---

## Decisões humanas pendentes (não executar sem aprovação)

1. **Backup de produção**: definir estratégia (EBS snapshot, pg_dump agendado, destino) — requer acesso AWS.
2. **Docker 2375**: fechar porta ou colocar atrás de VPN/TLS+auth — mudança de infra no host 116.
3. **DSR self-service**: escopo de produto (portal do titular vs. fluxo manual assistido).
4. **Motor de cadência cenográfico e módulo `outbound/` morto**: remover ou implementar? (recomendação: remover — zero consumidores reais segundo auditorias).
5. **Voz**: implementar de verdade (LiveKit/Twilio reais) ou reduzir escopo honestamente? Investimento significativo.
6. **Reescrita de histórico**: commits de dump (`2e30b2f`, `543c5b0`, `8b1bc38`) não existem neste clone — confirmar com remoto se segredos antigos foram purgados do histórico (15/21).

## O que está excepcional (preservar)

- **Tenancy/RLS**: FORCE RLS em todas as tabelas, bypass por allowlist justificada, papéis Postgres separados, FKs compostas por tenant, PII AES-256-GCM com índices cegos — referência de qualidade.
- **Segurança**: Argon2id+lockout, rate limits por domínio, Helmet+CSP fail-closed, webhooks HMAC com anti-replay, gitleaks+Trivy+CodeQL no CI.
- **LGPD**: opt-out unificado fail-closed em todos os canais, consentimento append-only com hash-chain e crypto-shredding, ROPA completo.
- **Bitrix24**: SSRF guard, pacing, circuit breaker, checkpoints incrementais, expurgo LGPD ativo.
- **CI**: gate único fail-closed, ~1.000 arquivos de teste, thresholds de cobertura por domínio.
- **Frontend**: tokens com contraste WCAG medido, Dialog/Drawer Radix acessíveis, RHF+zod, lazy loading disciplinado, MotionConfig reducedMotion.
- **Filas**: DLQ real no WhatsApp, idempotência por jobId, FinOps em 3 camadas, circuit breaker distribuído.
- **Governança de IA (caminho principal)**: budget global+por org, quota por tier com OTel, semantic cache.

---

*Relatórios individuais: `docs/orchestration/auditoria-20261115/*.md` — cada um contém evidências arquivo:linha completas.*

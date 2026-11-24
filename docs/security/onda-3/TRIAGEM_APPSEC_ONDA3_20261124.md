# TRIAGEM APPSEC — ONDA 3 (consolidação de estado real)

**Data:** 2026-11-24
**Agente:** 99 — Vito (AppSec, SAST e Secret Scanning)
**Demanda:** DEM-20261123-001 (slot liberado pelo Agente 09 após parecer APROVADO da baseline)
**Worktree:** `wt-99-appsec` · **Branch:** `agente/99-appsec-onda3`
**Baseline:** `integracao/onda-3-dem20261123` @ `027f42b180d2bec1d87bcd451e5085dad67ddff8`
**Escopo de escrita:** somente este diretório + `.agents/handoffs/onda-3/99-*.md`. Nenhum código alterado.

---

## 1. Estado consolidado por frente

### 1.1 CodeQL — 137 alertas abertos (CONFIRMADO via API, 2026-11-24)

Fonte: `gh api repos/MaarkssDN/Birthub-360/code-scanning/alerts?state=open` → **exatamente 137 alertas**, correspondendo ao número citado na demanda. Distribuição por severidade do SARIF:

| Severidade CodeQL (`rule.severity`) | Qtde | Nível de gate |
|---|---|---|
| `error` | 41 | **Bloqueia PR** via `scripts/security/check-codeql-sarif.ts` (`level: error`) |
| `warning` | 96 | Visível na aba Security, não bloqueia |

> Nota: o workflow `codeql.yml` está verde porque `github/codeql-action/analyze` não falha o job; o gate real (`security:codeql-sarif`) só roda em PR para `main`/`master`. Os 137 alertas são **dívida acumulada em `main`**, não regressão nova.

#### Top regras (warning)

| Regra | Qtde | Arquivos dominantes |
|---|---|---|
| `js/incomplete-url-substring-sanitization` | 21 | `prospecting/services/enrichment/webScraper.service.ts`, `services/cnpj.ts`, `crawlee/crawler.ts` |
| `js/missing-rate-limiting` | 19 | rotas `prospecting/outbound/server/routes/*`, `job-roles.routes.ts`, `integrations.routes.ts`, `agente-codigo-local/server.ts`, vários `tests/integration/*` (FP provável) |
| `js/remote-property-injection` | 10 | `src/shared/middlewares/sanitizeRequest.ts`, `voice-hub/services/workflowCollabService.ts`, `prospecting/outbound/server/auth.ts`, `integrations/bitrix/service/leads.ts` |
| `js/polynomial-redos` | 9 | `voice-runtime/intelligence/IntentEngine.ts`, `prospecting/outbound/server/validators.ts`, `leadSearch.service.ts`, `bitrix.ts`, `knowledge.routes.ts`, `agentBuilder.service.ts` |
| `js/incomplete-multi-character-sanitization` | 7 | `notifications/templates/sanitizer.ts`, `integrations/email/emailSanitizer.ts`, `intelligence/tools/marketResearchTool.ts` |
| `js/file-system-race` | 4 | `scripts/backup/run-backup-restore-drill.ts`, `scripts/architecture/verify-file-ownership.ts` |
| `js/bad-tag-filter` | 4 | `src/lib/zodSanitizer.ts`, `webScraper.service.ts`, `marketResearchTool.ts` |
| `js/insecure-randomness` / `biased-cryptographic-random` | 6 | `roleplay`, `team.service.ts`, `scripts/reset-passwords.core.ts`, `useRoleplaySimulator.ts` |
| `js/insufficient-password-hash` | 2 | `src/lib/voice-hub/services/apiKeyService.ts`, `src/features/api-keys/apiKey.service.ts` |

#### Os 41 alertas `error` — triagem individual (amostra verificada no código)

| Regra | Qtde | Principais locais | Classificação |
|---|---|---|---|
| `js/log-injection` | 10 | `ai-voice/bimodalLiveVoice.service.ts:84,205`; `commercialRedteamEvaluator.service.ts:179`; `leads.routes.ts:1050`; `system.routes.ts:120`; `cnpj.ts:157,221`; `webScraper.service.ts:191,225`; `voice-runtime/Observability.ts:27` | **MÉDIO** — log forging em serviços que logam input de usuário/tenant. Não é RCE, mas polui SIEM e pode forjar eventos de auditoria. Handoff por domínio. |
| `js/request-forgery` (SSRF) | 8 | `agente-codigo-local/server.ts:758`; `prospecting/outbound/server/ai.ts:64,154,687`; `services/bitrix.ts:186`; `services/cnpj.ts:88,165`; `webScraper.service.ts:131` | **MÉDIO/BAIXO** — ver análise abaixo. Nenhum confirmado explorável de forma trivial; `cnpj.ts` usa host fixo + `cleanCnpj` (`replace(/\D/g,'')`, length≥14); `webScraper.service.ts` tem guarda `isSafeUrl()` (linha 42/122) que rejeita antes do `fetch`; `ai.ts` usa `config.ollamaUrl` (config de IA do tenant → revisar se admin de tenant pode apontar para rede interna = SSRF intra-tenant). |
| `js/system-prompt-injection` | 8 | `agente-codigo-local/server.ts:76,304`; `smart-lead-router.service.ts:75`; `cadence-ai.service.ts:56`; `roleplay-ai.service.ts:101,184`; `socialSellingApproach.service.ts:56`; `voice-runtime/providers/LLMGateway.ts:159` | **MÉDIO** — prompt injection é risco inerente a LLM com dados de usuário; exige guardrails (Agente 77 Gaia). Classificar como débito de design, não bug pontual. |
| `js/user-controlled-bypass` | 7 | `integrations/google/google.routes.ts:44`; `job-roles/JobRoleController.ts:23`; `prospecting/outbound/routes/auth.routes.ts:45`; `integrations.routes.ts:353`; `voice-hub/middlewares/index.ts:132` | **BAIXO (maioria FP provável)** — verificado: são guardas de validação de input (`!email \|\| !password`), `verifyState()` do OAuth Google (presente e correto), middleware de API key legítimo. `integrations.routes.ts:353` permite `apiKey` do body como fallback de `HUNTER_API_KEY` → **revisar (médio)**: usuário pode injetar chave arbitrária na chamada ao Hunter. |
| `js/path-injection` | 6 | `scripts/capture-fase03-evidence.mjs:30,33`; `scripts/verify-pillar-cards.mjs:30,33` | **BAIXO** — scripts manuais de evidência, não rodam em produção. |
| `js/insecure-helmet-configuration` | 1 | `src/bootstrap/security.ts:123` | **BAIXO/by-design** — `contentSecurityPolicy: false` somente quando `NODE_ENV !== 'production'`; em produção há CSP explícita (linhas 132-160). CodeQL não distingue ambiente. |
| `js/reflected-xss` | 1 | `activities/ActivityController.ts:115` (`getIcalFeed`) | **BAIXO-MÉDIO** — feed iCal (`text/calendar`, `Content-Disposition: attachment`); `owner` vem de query param e alimenta `generateIcalFeed`. Risco real baixo (attachment + MIME não-HTML), mas escaping de campos iCal com `\r\n`/`;`/`,` deve ser confirmado pelo dono (Squad 40). |

**Conclusão CodeQL:** nenhum achado `error` confirmado como explorável remotamente sem autenticação na baseline. Os mais relevantes para remediação são: SSRF via `ollamaUrl`/webhook URLs configuráveis por tenant, log-injection nos serviços de prospecting/voz, e os 96 warnings (rate-limiting ausente em rotas de auth/integration é o mais sensível).

### 1.2 Segredos — repositório PÚBLICO, secret scanning DESLIGADO

- **Histórico:** triagem de 2026-09-05 (`docs/security/GITLEAKS_HISTORICAL_FINDINGS_2026-09-05.md`) reduziu 45 achados a: 1 FP suprimido, 1 chave Gemini **rotacionada e removida do histórico**, 1 ação humana pendente: **confirmar que `BIRTHHUB360_WEBHOOK_SECRET` em produção ≠ valor antigo hardcoded** (histórico, commit `9236028b`).
- **Árvore atual (baseline):** `git grep` com padrões de alto sinal (AWS `AKIA`, chaves privadas PEM, `sk-`, `xox*`, `ghp_`, JWTs, URLs de webhook Bitrix com credencial) → **zero segredos reais**; todos os matches são fixtures de teste, documentação de evals e exemplos. Nenhum `.env` real rastreado (só `.env.example`/`.env.test.example`). `charts/.../secret.yaml` usa `{{ .Values.secrets }}` (sem literais).
- **Gap estrutural:** repositório público + secret scanning nativo do GitHub desligado + gitleaks só no CI de PR (não varre `main` retroativamente). Decisão humana pendente (item 7 das decisões da demanda). **Permanece BLOQUEIO de governança**, não achado de segredo novo.
- Ferramentas locais indisponíveis neste worktree: `gitleaks`/`semgrep`/`trivy` não instalados; `docker` indisponível. O fallback `scripts/security/scan-secrets.sh` foi executado mas abortado por varrer junction de `node_modules` — cobertura equivalente obtida via `git grep` acima (apenas arquivos rastreados; arquivos não rastreados não entram em commit de qualquer forma).

### 1.3 Dependências — `npm audit`

`npm audit --package-lock-only` (2026-11-24, registry npm): **2 moderadas, 0 altas, 0 críticas**.

| Pacote | Severidade | Cadeia | Risco |
|---|---|---|---|
| `@opentelemetry/instrumentation-http` | moderate | `@opentelemetry/auto-instrumentations-node` (**devDependency**) | **BAIXO** — insertion of sensitive info into logs; dev-only. Bump no próximo ciclo. |

Os 36-40 waivers Trivy (`.trivyignore.yaml`, **40 entradas `- id:`**, todas `expired_at: 2026-11-30`) continuam válidos e coerentes com `docs/security/AUDIT_WAIVERS.md` e a auditoria da Onda 2 (`docs/security/AUDITORIA_HOTSPOTS_TRIVY_ONDA2_20261123.md`). Divergência de contagem: demanda cita "36 waivers"; o arquivo tem 40 entradas (inclui pares GHSA maiúsculo/minúsculo do mesmo CVE). **Ação humana necessária antes de 29/11 21h -03:** decidir renovações do Grupo A (`better-auth`, `dompurify`, `nodemailer`) — sem decisão, o gate Trivy de PR volta a falhar.

### 1.4 Hotspots arquiteturais — `check:hotspots` EXECUTADO na baseline

`npx tsx scripts/architecture/check-hotspots.ts` → **PASS**: 1970 arquivos, 0 acima de 1000 linhas sem exceção; 11 exceções ativas, todas `reavaliar até: 2026-11-30`. Vencem em 6 dias (gate falha a partir de 29/11 21h -03). Deriva desde a auditoria da Onda 2: `leads.routes.ts` cresceu para **1440/1500** (restam 60 linhas de folga) e `PillarRegistry.tsx` está em 1403/1450 — os dois piores casos caminham para o teto mesmo sem novos commits grandes.

### 1.5 Semgrep — estado no CI

- Workflow `security-semgrep.yml` existe, é bloqueante (`--error`), rulesets `p/typescript` + `p/nodejs` + `p/secrets`, escopo `src server.ts worker.ts scripts`, **não cobre `agente-codigo-local/` nem `tests/`**.
- Último run (2026-11-23, branch `devin/handoff-encerramento-20261122`, run 45105231319): **FAIL com 2 findings bloqueantes**:
  1. `scripts/security/reencrypt-credentials.ts:565` — `bypass-tls-verification`. **Na baseline atual o padrão flagrado não existe mais**: `credential-script-guards.ts:295-303` implementa `resolveDbSsl()` fail-closed (`rejectUnauthorized: !insecure`, opt-out só via `DB_SSL_INSECURE_SKIP_VERIFY=true` com warning explícito). Provável correção já mergeada → **confirmar com novo run do Semgrep na baseline** antes de abrir handoff de correção.
  2. `src/features/integrations/bitrix/bitrix.routes.ts:837` — `javascript.express.security.audit.xss.direct-response-write`. Verificado: é `res.attachment(filename).type('application/octet-stream').send(buffer)` (download de extração Bitrix, `auditAccessMiddleware` + `managementRoles`). **Falso positivo funcional** (MIME octet-stream + attachment não renderiza HTML), mas o Semgrep continuará bloqueando todo PR até suprimir com `// nosemgrep` justificado **ou** reescrever como `res.end(buffer)`. Decisão de supressão é do owner do arquivo + Agente 94 (não faço supressão artificial — regra dura).
- **Semgrep não está instalado localmente** — comando pronto para o Agente 00 rodar: `docker run --rm -v "$PWD:/src" semgrep/semgrep semgrep scan --config p/typescript --config p/nodejs --config p/secrets --error --metrics=off --exclude node_modules --exclude dist --exclude tests /src/src /src/server.ts /src/worker.ts /src/scripts` (ou `semgrep scan` local se instalado).

---

## 2. Handoffs emitidos

| Handoff | Destino | Conteúdo |
|---|---|---|
| `99-para-00-codeql-137-alertas-e-decisoes.md` | Agente 00 | Triagem CodeQL completa + decisões pendentes (repo público/secret scanning, `agente-codigo-local`, confirmação env `BIRTHHUB360_WEBHOOK_SECRET`) |
| `99-para-43-prospecting-ssrf-e-log-injection.md` | Agente 43 (Amon — Prospecção Outbound) / Squad 40 | SSRF `ai.ts` (ollamaUrl), log-injection `cnpj.ts`/`webScraper`/`leads.routes.ts`, rate-limiting em rotas outbound |
| `99-para-50-bitrix-download-e-waivers.md` | Agente 50 (Atlas) / Squad 50 | `bitrix.routes.ts:837` finding Semgrep bloqueante + request-forgery `services/bitrix.ts` |
| `99-para-60-voz-log-injection-e-api-keys.md` | Agente 60/65 (Aurora/Lena) / Squad 60 | log-injection `bimodalLiveVoice`/`Observability`, `apiKeyService` insufficient-password-hash, middleware voice-hub |
| `99-para-70-ia-system-prompt-injection.md` | Agente 70/77 (Orion/Gaia) / Squad 70 | 8 system-prompt-injection + polynomial-redos em serviços de IA |
| `99-para-94-ci-semgrep-e-branch-protection.md` | Agente 94 (Tess) / Squad 90 | Status Semgrep (1 FP + 1 já corrigido?), check Semgrep não é required, decisão de supressão `nosemgrep`, vencimento waivers Trivy 30/11 |
| `99-para-20-backend-codeql-core.md` | Agente 20 (Ciro) / Squad 20 | `sanitizeRequest.ts` remote-property-injection, helmet CSP, `integrations.routes.ts:353` apiKey do body, `zodSanitizer`, `insufficient-password-hash` em `features/api-keys` |

---

## 3. Riscos residuais e bloqueios

1. **BLOQUEIO HUMANO (não novo):** repositório público + secret scanning desligado — item 7 das decisões da demanda DEM-20261123-001. Sem varredura histórica no GitHub, qualquer segredo commitado antes do gitleaks no CI permanece exposto publicamente.
2. **Prazo duro:** waivers Trivy e 11 exceções de hotspot vencem **2026-11-30**; gate de hotspots falha a partir de **29/11 21h -03**. Sem decisão de renovação/refatoração, PRs passam a falhar.
3. **CodeQL `error` em PRs novos:** qualquer PR que toque os arquivos listados herdará os 41 alertas `error` → o gate `security:codeql-sarif` pode reprovar PRs que não introduziram o problema (dívida em `main`). Coordenador deve decidir se o gate compara baseline ou bloqueia absoluto.
4. Nenhum segredo real encontrado na árvore atual; nenhuma credencial reproduzida neste relatório.

---

**Agente 99 — Vito** · Auditoria read-only; correções delegadas via handoffs formais.

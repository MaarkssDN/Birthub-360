# Auditoria de Segurança Aplicada — Release-Readiness (Agente 15 + 01/21)
**Data:** 2026-11-18 | **Estado auditado:** `main @ b54060ad1` | **Método:** leitura estática `server.ts` → `src/bootstrap/*` → routers → middlewares → services. READ-ONLY.

## Sumário executivo

O estado de `main` é **notavelmente maduro**: todos os routers de feature passam por `authenticateToken` + `requireTenant` (ou recebem `authenticateToken` via rate limiter dedicado antes do mount — verificado em `rateLimiters.ts:66-74,114`), todos os 8 webhooks de entrada validam autenticidade com comparação em tempo constante e falham fechado sem env, RLS é FORCE em praticamente todas as tabelas tenant-bearing com um gate estático (`scripts/security/check-rls-coverage.ts`), `urlGuard.ts`/`safeFetch` com pinning de DNS cobre SSRF na maioria dos caminhos, e logs têm redact + sanitização de PII. Os achados restantes são concentrados e a maioria P2/P3.

---

## Achados

### SEC-01 — SSRF residual em `POST /api/prospecting/enrich` e `runCrawler`
- **Severidade:** P1 | **Confiança:** Alta
- **Arquivo:linha:** `src/features/prospecting/routes/prospecting.routes.ts:585-611`; `src/features/prospecting/services/enrichment/webScraper.service.ts:42-69,131`; `src/features/prospecting/crawlee/crawler.ts:65-71`
- **Esperado vs atual:** URLs fornecidas por usuário deveriam passar pelo guard canônico `safeFetch`/`assertSafeExternalUrl` (`src/shared/security/urlGuard.ts`), usado em Bitrix/3CX/Slack/SMS. Atualmente usam `isSafeUrl`, que é só comparação de string de hostname — **sem resolução DNS**.
- **Evidência:** `isSafeUrl` bloqueia literais `127.x`, `192.168.x`, `10.x`, `172.16-31.x`, `localhost`, `.local`, `.internal`. **Não cobre:** `169.254.x.x` link-local (**inclui `169.254.169.254` metadata de cloud**), IPv6 (`::ffff:7f00:1` mapeado, `fc00::/7` ULA, `fe80::` link-local), CGNAT `100.64/10`, `0.0.0.0`, `198.18/15`, `192.0.0.x`. Além disso `fetch(targetUrl)` (linha 131) e `page.goto` (crawler.ts:78+) **seguem redirects sem revalidação**. Hostname público que resolve para IP privado também passa (sem `dns.lookup`).
- **Causa raiz:** guard anti-SSRF paralelo e mais fraco que `urlGuard.ts`, nunca migrado após a correção IPv6.
- **Impacto:** qualquer usuário autenticado — **inclusive VISUALIZADOR** (rota sem `requireRole`, `prospecting.routes.ts:585`) — pode fazer o servidor buscar URLs arbitrárias. **DEPENDE DE DECISÃO** (em cloud com metadata endpoint é P0).
- **Correção mínima:** trocar `isSafeUrl`+`fetch` por `safeFetch` em `scrapeWebsite`, e no `runCrawler` rejeitar URLs que não passem em `assertSafeExternalUrl`; adicionar `requireRole` na rota `/enrich`.
- **Coberto por PR:** não.

### SEC-02 — Fallback global `BITRIX24_WEBHOOK_URL` mistura tenants
- **Severidade:** P1 | **Confiança:** Alta (código); impacto depende de config
- **Arquivo:linha:** `src/features/crm/application/LeadUseCases.ts:570-576`
- **Comportamento:** `importRecentBitrixLeads(organizationId)` — se a org não tem `BitrixConnection`, cria uma usando `process.env.BITRIX24_WEBHOOK_URL` **global**, e importa leads desse portal para a org chamadora.
- **Problema:** (a) env **não declarada em `env.ts`** (lida via `process.env` cru); (b) se configurada, **todas as orgs sem conexão própria importam do MESMO portal Bitrix** — leads/PII de uma empresa caem no CRM de outra. Rota `POST /api/leads/import/bitrix24` é `managementRoles` (`lead.routes.ts:36`).
- **Impacto:** vazamento cross-tenant de dados comerciais. **DEPENDE DE DECISÃO** — bloqueador se `BITRIX24_WEBHOOK_URL` estiver setada em produção.
- **Correção mínima:** remover o fallback ou restringir a org allowlist; declarar a env em `env.ts`.
- **Coberto por PR:** não.

### SEC-03 — Webhook 3CX: segredo global compartilhado permite injeção cross-tenant
- **Severidade:** P1 | **Confiança:** Alta
- **Arquivo:linha:** `src/features/integrations/threecx/threecx.routes.ts:30-93`; `src/features/integrations/threecx/threecx.service.ts:494-599`
- **Comportamento:** `THREECX_WEBHOOK_SECRET` é **uma env global** para todas as orgs. Após assinatura válida, o tenant é resolvido por `extension` (ramal) varrendo todas as orgs.
- **Problema:** quem configura o PABX 3CX de uma org **precisa conhecer o segredo global** — cada tenant detém chave que forja eventos para **qualquer** org. Ramais curtos/sequenciais e adivinháveis; evento forjado cria `ThreeCXCallEvent`/atividades no CRM de outro tenant. Comentário (linhas 497-539) documenta que o correto seria `connectionId` opaco na URL.
- **Impacto:** escrita cross-tenant de dados falsos. **DEPENDE DE DECISÃO** — bloqueador para multi-tenant real se 3CX for usado por >1 org.
- **Correção mínima:** segredo por conexão (`ThreeCXConnection.webhookSecret`) com `connectionId` na rota, espelhando `stripe.webhook.ts`.
- **Coberto por PR:** não.

### SEC-04 — Enumeração de e-mail cross-tenant no convite de equipe
- **Severidade:** P3 | **Confiança:** Alta
- **Arquivo:linha:** `src/features/team/services/team.service.ts:116-119`
- `prisma.user.findUnique({ where: { email } })` sem filtro de org; erro 409 revela se e-mail existe em **qualquer tenant** (User está em `BYPASS_RLS_ALLOWED_MODELS`).
- **Impacto:** ADMIN pode sondar e-mails de outras orgs. **NÃO BLOQUEADOR.** Correção: resposta genérica ou erro opaco.

### SEC-05 — Módulos novos sem restrição de papel (VISUALIZADOR acessa)
- **Severidade:** P3 | **Confiança:** Média
- **Arquivo:linha:** `src/features/social-selling/server/socialSelling.routes.ts:6-8`; `src/features/sales-orchestration/server/salesOrchestration.routes.ts:6`; mounts `src/bootstrap/routes.ts:275-276`
- `POST /api/social-selling/approach/generate` (IA), `POST /api/social-selling/interactions` (escrita) e `GET /api/sales-orchestration/overview` acessíveis a qualquer papel, incl. VISUALIZADOR — inconsistente com Mesa/Copiloto/Comercial Inteligente.
- **Impacto:** custo de IA e escrita por papel read-only. **DEPENDE DE DECISÃO.** Correção: definir roles em `authorization.ts` + `requireRole` no mount.

### SEC-06 — Repositório de enrichment sem defesa em profundidade de tenant
- **Severidade:** P3 | **Confiança:** Alta
- **Arquivo:linha:** `src/features/prospecting/infra/PrismaEnrichmentRepository.ts:53-71`
- `updateCompany`, `findContactsEmailsAndPhones`, `createContacts`, `createEnrichmentLog` sem `organizationId` no where — única barreira é RLS FORCE. Resto do módulo escopa explicitamente.
- **Impacto:** se rodar fora de `requestContext` (worker/bypass), pode ler/escrever cross-tenant. **NÃO BLOQUEADOR** (RLS cobre). Correção: adicionar `organizationId` aos wheres.

### SEC-07 — `process.env` cru para segredos fora do schema
- **Severidade:** P3 | **Confiança:** Alta
- `LeadUseCases.ts:570-573` (`BITRIX24_WEBHOOK_URL` — caso real do SEC-02); `publicLead.routes.ts:42`; `dsrRequest.service.ts:62-66,91` (fallbacks redundantes). Envs fora da validação Zod e checks de `env.ts:477-537`.
- **NÃO BLOQUEADOR.**

### SEC-08 — Voz: OPT_OUT aceita telefone arbitrário
- **Severidade:** P3 (observação) | **Confiança:** Média
- **Arquivo:linha:** `src/features/voice/voice-command-executor.service.ts:23-90,236-258`; `sip-webrtc-bridge.service.ts:175-199`
- `executeVoiceCommand` injeta org/lead **da sessão SIP** (correto contra prompt injection). Porém `OPT_OUT` aceita `parameters.phone` arbitrário — comando de voz pode registrar supressão para qualquer telefone. Rota HTTP de exposição não localizada — gating não confirmado.
- **DEPENDE DE DECISÃO.**

---

## Verificado como SEGURO

- **Auth map:** todos os mounts em `src/bootstrap/routes.ts` têm `authenticateToken`+`requireTenant`, exceto públicos deliberados (`/api/public/*`, booking público auto-protegido, `dsrRequestRoutes`). `/api/intelligence`, `/api/knowledge`, `/api/agent`, `/api/bug-reports` recebem auth via rate limiters antes do requireTenant — correto.
- **Webhooks (8):** birth-voice, voice-result Bland, 3CX (HMAC+timestamp+replay), Bitrix (`application_token` por conexão, timing-safe), Chatwoot (HMAC), email inbound, signature status, Stripe (segredo por conexão + timestamp) — todos com `claimWebhookDelivery` anti-replay.
- **RBAC:** hierarquia única em `authorization.ts`; `UNVERIFIED_ROLE` fail-closed; `/admin/queues` exige ADMIN + `PLATFORM_OPERATOR_TOKEN` timing-safe; `/metrics` protegido quando `EXPOSE_METRICS`.
- **RLS:** FORCE em todas as tabelas tenant-bearing; `BYPASS_RLS_ALLOWED_MODELS` allowlist pequena justificada; gate estático quebra CI.
- **SQL cru:** todos parametrizados; nenhum `Unsafe` com interpolação.
- **Segredos:** nenhum hardcoded em `src/`; `env.ts` fail-closed em produção; `.env.example` existe.
- **PII em logs:** redact paths extensivo + sanitize/mask; error handler mascara 5xx em prod.
- **LGPD/DSR:** tokens 32B hash SHA-256 uso único 72h, anti-enumeração, dados cifrados, auditoria sem PII.
- **Endpoints públicos:** rate limits por IP; honeypot+consent na landing; `publicToken` uuid; booking com conflito de horário.
- **AI/tool calling:** `AIPendingAction` com aprovação humana; `safeFetch` em tools; `assertPiiExternalConsent`; `AI_PII_EXTERNAL_CONSENT_ORGANIZATIONS` fail-closed.
- **Legados:** `/api/voice-hub`, `/api/outbound`, `/api/dialer-3cx` → 503 via `unavailableLegacyModule`.

## Limitações
- Sem execução ao vivo; estático.
- Não verificado se `BITRIX24_WEBHOOK_URL`/`THREECX_WEBHOOK_SECRET` estão configurados em produção — decisivo para severidade real de SEC-02/03.
- Rota HTTP do `executeVoiceCommand` não localizada.
- `agente-codigo-local/` não auditado (possível código morto).
- Sem testes de integração/RLS contra Postgres real.

## Top-5 riscos de lançamento
1. **SEC-01 SSRF no scraper** — único fetch server-side sem guard canônico; alcançável por VISUALIZADOR; potencial metadata de cloud.
2. **SEC-02 `BITRIX24_WEBHOOK_URL` global** — se env existir em prod, ADMIN importa leads de outro portal Bitrix → vazamento cross-tenant de PII. Verificar env antes do go-live.
3. **SEC-03 segredo global webhook 3CX** — chave mestra compartilhada entre tenants; forja de eventos cross-tenant.
4. **Rotação de credenciais Bitrix/Bland** — pendente como ação externa; histórico git ainda expõe base com PII.
5. **Cobertura de teste dos pontos fracos** — scraper SSRF, fallback Bitrix, RBAC dos módulos novos sem testes de regressão.

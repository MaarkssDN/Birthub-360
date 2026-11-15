# Handoff — Auditoria de tenancy VoiceHub/Outbound/Dialer (Onda F2)

De: 12 — Voz e Telefonia
Para: 00 — Coordenador
Onda: F2
Status: resolvido (auditoria concluída; gate permanece FECHADO — ver parecer)
Prioridade: alto
Referência: `.agents/handoffs/00-para-12-17-voicehub-reactivacao.md`
Branch: `agente/12-voicehub-reactivacao` (base `integracao/coordenador-20261112`)

## Parecer: NO-GO para abrir o `legacyModuleGate`

O gate está correto e deve permanecer. A auditoria mostrou que o bloqueio não é
"falta de filtro de organizationId" — é que os três módulos legados **não
compartilham o modelo canônico de identidade/tenant** do app, e duas das três
superfícies têm exposição cross-tenant real se forem montadas como estavam.

## 1. `/api/voice-hub/*` → `src/lib/voice-hub/**` (125 arquivos .ts)

### O que está BOM (evidência)

- Todo router de `src/lib/voice-hub/routes/*.routes.ts` aplica `requireTenant`
  (exceto `telephony.routes.ts` — webhooks Twilio com assinatura
  `X-Twilio-Signature` — e `health.routes.ts`, que nem é montado). Congelado em
  teste estrutural: `src/lib/voice-hub/__tests__/tenant-isolation.test.ts`.
- `requireTenant` (`middlewares/rbac.ts:4`) exige `req.voiceHubUser` +
  `req.organizationId` consistentes; `requireRole`/`requirePermission` por cima.
- Services/repositories filtram por `organizationId` de forma consistente e
  fail-closed (404, não 403): callLog, session, agent, metric, setting,
  workflow(+versions), apiKey, webhookEndpoint, billing, auditLog,
  organizationAiConsent, birthhub360CallResult, user (com checagem
  `target.organizationId === organizationId` antes de update/delete/anonymize).
- RLS existe no banco para todos os models de voz
  (`prisma/migrations/20260924000000_voice_hub_models` +
  `20260925000000_voice_hub_rls`): `tenant_isolation` com FORCE ROW LEVEL
  SECURITY em Workflow, Agent, CallLog, Metric, Setting, OrganizationAiConsent,
  APIKey, OrganizationWebhookEndpoint, Transaction, Wallet, AgentSession,
  Campaign, DncList, CallAttempt, WorkflowVersion.
- Telephony resolve tenant por `Agent.phoneNumber` (único) →
  `agent.organizationId` (`services/telephonyService.ts:76-87`) — desenho correto
  para webhook sem sessão.
- Testes novos provam isolamento cross-tenant em calls (callLog), sessions,
  agents, apiKeys, users (incl. LGPD anonymize) e webhook endpoints — 36 testes,
  todos verdes.

### O que está QUEBRADO (bloqueadores reais)

1. **Schema incompatível — o código não compila contra `prisma/schema.prisma`.**
   `npx tsc --noEmit -p tsconfig.voice.json` retorna centenas de erros
   (config não referenciada por CI — `tsconfig.json` exclui `src/lib/voice-hub`).
   Delegates/campos inexistentes:
   - `prisma.tenant`, `prisma.membership`, `prisma.role`, `prisma.permission`
     — models **não existem** (tenant canônico é `Organization`).
   - `prisma.session` usado com `organizationId/userId/agentId/channel/metadata/
     deletedAt` — o model `Session` real é o do Better Auth
     (`token/expiresAt/ipAddress/userAgent`). O model correto seria
     `AgentSession` (existe, tem RLS).
   - `prisma.user` com `companyName/deletedAt/memberships` — `User` canônico não
     tem esses campos.
   - `prisma.tenantWebhookEndpoint` — o model real chama-se
     `OrganizationWebhookEndpoint` (nome do delegate difere).
   - `prisma.notification` com `message/isRead` — o model real tem
     `body/kind/readAt` + `organizationId` obrigatório.
   - `auditLogService` espera `userId/user`; `AuditLog` real tem
     `actorId/tenantId/entity`.
   - `authService.register()` importa `createTenant` de
     `../repositories/organizationRepository.js` — **arquivo inexistente**
     (módulo nem carrega).
2. **Identidade paralela.** Voice-hub tem JWT próprio (`JWT_SECRET`, 15 min,
   cookies `access_token`/`refresh_token` próprios) e `POST /auth/register`
   que **cria tenants novos** — se montado, qualquer usuário autenticado do app
   poderia provisionar tenants arbitrários fora do Better Auth. O mount antigo
   (`authenticateToken` + `requireTenant` do app) só garantiria sessão Better
   Auth; o router interno ignoraria `req.user` e usaria `req.voiceHubUser`.
   Com RLS ativa, `requestContext.tenantId` seria o org do Better Auth e as
   queries do voice-hub (org do JWT legado) falhariam fechado — ou seja,
   montado como está = quebrado, não vazado. Mas o endpoint de register é um
   risco latente que precisa morrer ou ser adaptado antes de qualquer mount.
3. **`src/features/voice-hub/routes/index.js` não existe** — o import lazy do
   mount antigo (`features/voice-hub/routes/index.js`) nunca resolve; o router
   real é `src/lib/voice-hub/routes/index.ts`, que **não é importado em lugar
   nenhum** do bootstrap atual.

## 2. `/api/outbound/*` → `src/features/prospecting/outbound/server/**` (domínio do 05)

- `apiRouter` (`server/routes.ts:50`) usa `attachUser` com cookie próprio
  `birthhub360_session` (HMAC, `SESSION_SECRET`) e tenant = string `company`,
  **não** `organizationId` canônico; banco próprio via `getDatabase()`.
- `routes/campaigns.routes.ts` (208 linhas) tem **zero** `requireAuth/
  requireAdmin/requireManager` — `GET /campaigns`, `GET /users/:userId/leads`,
  `GET /leads/distribution` retornam dados de TODAS as companies para qualquer
  chamador. Se o gate abrir com o mount antigo
  (`authenticateToken, requireTenant, apiRouter`), o auth externo passa e o
  router interno continua expondo o banco legado inteiro → cross-tenant real.
- Handoff aberto para o 05: `12-para-05-outbound-api-legado-tenancy.md`.

## 3. `/api/dialer-3cx/*` → `src/features/cadence/dialer/interface/http/server.ts` (domínio do 17)

- `createServer()` monta campaigns/leads/dnc/**health** sem **nenhum** middleware
  de auth e sem escopo de tenant (repos são ports; o app standalone nunca foi
  desenhado para multi-tenant HTTP). O mount antigo era um placeholder que só
  chamava `next()` — nunca serviu rotas.
- Handoff aberto para o 17: `12-para-17-dialer-3cx-sem-auth.md`.

## 4. O que foi entregue nesta branch

- `src/lib/voice-hub/__tests__/tenant-isolation.test.ts` — 36 testes:
  isolamento cross-tenant em callLog/session/agent/apiKey/user(LGPD)/
  webhookEndpoint + garantia estrutural de `requireTenant` em todos os routers.
- Handoffs: este relatório + `12-para-01-voicehub-identidade-schema-adapters.md`
  + `12-para-05-...` + `12-para-17-...`.
- `legacyModuleGate` **intocado** (decisão de reabertura é do 00 após revisão
  do 24).

## 5. Checklist para um futuro GO (não completo hoje)

- [ ] 01 decide e executa adaptadores de identidade/schema (Organization↔Tenant,
      User+role↔Membership/Role, AgentSession↔Session, OrganizationWebhookEndpoint↔
      TenantWebhookEndpoint, Notification canônico) — ver handoff ao 01.
- [ ] Eliminar ou restringir `POST /api/voice-hub/auth/register|login|refresh`
      (duplicam Better Auth; register provisiona tenants).
- [ ] 05 blinda `/api/outbound` (auth + escopo `company`/org em todas as rotas)
      ou decide aposentar o módulo.
- [ ] 17 decide destino do dialer-3cx (integrar ao cadence canônico ou cortar).
- [ ] Consentimento de gravação de chamadas (CallRecording 90d criptografado —
      Documento Mestre V4.1) ainda não existe como enforcement.
- [ ] Retenção: `purgeExpiredCallLogs` existe mas não está agendado
      (`retentionScheduler.ts` existe; confirmar wiring no worker).
- [ ] RLS já existe nas tabelas de voz — validar que o client usado pelo
      voice-hub seta `app.current_tenant_id` (hoje `attachAuthIfPresent` não
      popula `requestContext.tenantId`).
- [ ] `tsconfig.voice.json` está quebrado/não referenciado — alinhar ou remover.

## Testes executados

- `npx vitest run -c vitest.unit.config.ts src/lib/voice-hub` → 37 arquivos,
  333 testes, todos verdes (inclui os 36 novos).
- `npx tsc --noEmit` (config principal) → exit 0 (voice-hub é excluído desse
  tsconfig — registrar que o gate de tipos não cobre o módulo).
- `npx tsc --noEmit -p tsconfig.voice.json` → centenas de erros (evidência do
  item 1 acima; config não é usada por CI).

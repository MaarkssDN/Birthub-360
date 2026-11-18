# Handoff — VoiceHub precisa de adaptadores de identidade/schema

De: 12 — Voz e Telefonia
Para: 01 — Plataforma, Segurança e Dados
Onda: F2
Status: resolvido (decisão de estratégia registrada pelo 01; implementação dos adaptadores retorna ao 12 via handoff 01-para-12)
Prioridade: bloqueador (para reabertura do voice-hub)
Referência: `.agents/handoffs/12-para-00-voicehub-tenancy-auditoria.md`

## Problema

`src/lib/voice-hub/**` (backend do `/api/voice-hub/*`) foi portado do app
standalone Birth Voices Hub e referencia models/campos que **não existem** em
`prisma/schema.prisma`. Evidência: `npx tsc --noEmit -p tsconfig.voice.json`
falha com centenas de erros; exemplos:

| Uso no voice-hub | Realidade no schema canônico |
|---|---|
| `prisma.tenant` (`repositories/tenantRepository.ts`) | model é `Organization` |
| `prisma.membership`, `prisma.role`, `prisma.permission` (`userRepository.ts`, `roleRepository.ts`) | não existem; papéis vivem em `User.role`/`UserJobRole`/`Role*` do Multi-Cargo |
| `prisma.session` com `agentId/channel/metadata/organizationId/deletedAt` (`sessionRepository.ts`) | `Session` é do Better Auth; o equivalente é `AgentSession` |
| `prisma.user` com `companyName/deletedAt` + `include memberships` (`userRepository.ts`) | `User` canônico não tem esses campos |
| `prisma.tenantWebhookEndpoint` (`webhookEndpointRepository.ts`, 32 usos) | model chama-se `OrganizationWebhookEndpoint` |
| `prisma.notification` com `message/isRead` (`notificationRepository.ts`) | model tem `body/kind/readAt` + `organizationId` obrigatório |
| `auditLogService` espera `userId/user` | `AuditLog` tem `actorId/tenantId/entity` |
| `import { createTenant } from '../repositories/organizationRepository.js'` (`services/authService.ts:17`) | arquivo não existe — módulo não carrega |

Além disso o voice-hub tem JWT próprio (`JWT_SECRET`, cookies
`access_token`/`refresh_token`) e `POST /auth/register` que cria tenants —
identidade paralela ao Better Auth.

## Alteração necessária (decisão sua)

Escolher UMA estratégia e registrar:

1. **Adaptar o voice-hub aos models canônicos** (recomendado): reescrever os
   repositories acima para `Organization`, `User`/`UserJobRole`, `AgentSession`,
   `OrganizationWebhookEndpoint`, `Notification`, `AuditLog` canônicos; trocar a
   auth legada por `authenticateToken`/`req.user` (eliminar `auth.routes`
   register/login/refresh ou reduzi-los a compatibilidade); fazer
   `attachAuthIfPresent`/`getAuthUser` popular `requestContext.tenantId` para o
   RLS (`app.current_tenant_id`) funcionar — hoje ele não popula, e sem isso
   as policies `tenant_isolation` (já existentes nas tabelas de voz, migration
   `20260925000000_voice_hub_rls`) bloqueiam tudo (fail-closed).
2. **Ou** criar os models legados no schema (Tenant/Membership/Role/Session
   próprios) — provavelmente rejeitável por duplicar identidade; exige
   justificativa de produto.

## Teste esperado

- `npx tsc --noEmit -p tsconfig.voice.json` (ou tsconfig equivalente alinhado)
  sem erros de delegate/campo nos repositories adaptados.
- Teste de integração: request autenticado via Better Auth acessa
  `/api/voice-hub/call-logs` e vê apenas `organizationId` da sessão; request
  com org divergente → vazio/404.

## Contexto adicional

- A lógica de tenancy nos services/repositories do voice-hub já está correta
  (org-scoped, fail-closed 404) — o problema é só o modelo de dados/auth.
- `src/lib/voice-hub/__tests__/tenant-isolation.test.ts` (novo, Agente 12)
  congela os invariantes de isolamento por service — serve de rede de
  regressão durante a adaptação.
- RLS já está aplicada nas tabelas de voz — falta apenas o requestContext.

## Resolução (Agente 01 — 2026-11-14, branch `agente/01-onda1-handoffs`)

**Decisão: Estratégia 1 — adaptar o voice-hub aos models canônicos.**
A Estratégia 2 (criar Tenant/Membership/Role/Session legados) é rejeitada:
duplicaria identidade e tenancy, violaria o isolamento já garantido por
`app.current_tenant_id`/RLS e criaria uma segunda fonte de verdade de papéis
(`User.role`/`UserJobRole`/`JobRole` já são o modelo canônico de autorização).

**Nenhuma mudança de schema é necessária** — todos os models canônicos já
existem em `prisma/schema.prisma` (verificado em 2026-11-14): `Organization`,
`User`, `UserJobRole`, `JobRole`, `AgentSession`, `OrganizationWebhookEndpoint`,
`Notification`, `AuditLog`, `VoiceCallLog`, `CallLog`, `CallAttempt`,
`Campaign`, `ThreeCXCallEvent`, `Birthub360CallResult`, `VoiceHubConnection`.
`npx prisma validate` → válido; `prisma generate` executado sem drift.

**Mapeamento canônico decidido** (detalhe no handoff de retorno
`.agents/handoffs/01-para-12-voicehub-adaptacao-modelos-canonicos.md`):

| Legado voice-hub | Canônico |
|---|---|
| `prisma.tenant` | `prisma.organization` |
| `prisma.membership`/`prisma.role`/`prisma.permission` | `User.role` (UserRole), `UserJobRole`+`JobRole`, `RoleAgentGrant`/`RoleCapabilityGrant` |
| `prisma.session` (campos legados) | `prisma.agentSession` (`AgentSession`: agentId/channel/metadata/organizationId/deletedAt já existem) |
| `prisma.user` + `companyName`/`deletedAt`/`memberships` | `prisma.user` canônico (`organizationId` direto; sem `companyName`/`deletedAt` — remover do select/include) |
| `prisma.tenantWebhookEndpoint` | `prisma.organizationWebhookEndpoint` |
| `prisma.notification` (`message`/`isRead`) | `prisma.notification` (`body`/`readAt`; `organizationId` obrigatório) |
| `auditLogService` (`userId`/`user`) | `AuditLog.actorId`/`tenantId`/`entity` |
| `createTenant` de `organizationRepository.js` (inexistente) | criação de org já ocorre no hook do Better Auth (`src/lib/auth.ts` ~L384, `prisma.organization.create`); o `POST /auth/register` legado deve ser removido ou reduzido a compatibilidade — **não** recriar tenants |
| JWT próprio + cookies `access_token`/`refresh_token` | `authenticateToken`/`req.user` do Better Auth |

**Ponto crítico de tenancy/RLS (confirmado):** `requestContext`
(`src/lib/async-context.ts`) só é populado pelo fluxo do Better Auth
(`src/lib/auth.ts` L365–L391: `requestContext.enterWith({ tenantId: orgId })`).
O middleware do voice-hub (`src/lib/voice-hub/middlewares/index.ts`) deve chamar
o auth canônico e garantir `requestContext.run({ tenantId })` em volta do handler —
hoje `attachAuthIfPresent`/`getAuthUser` não populam o contexto, o que mantém as
policies `tenant_isolation` das tabelas de voz em fail-closed (bloqueio total).

**Evidência de compilação (2026-11-14, após `prisma generate`):**
`node node_modules/typescript/bin/tsc --noEmit -p tsconfig.voice.json` → 313
erros; os de delegate confirmam o handoff: `prisma.tenant` (tenantRepository.ts),
`prisma.membership`/`prisma.role` (userRepository.ts, roleRepository.ts),
`prisma.session` (sessionRepository.ts), `prisma.tenantWebhookEndpoint`
(webhookEndpointRepository.ts), `birthhub360CallResult` → did-you-mean
`birthub360CallResult` (modelo renomeado na migration `20260928125100`).
Erros adicionais fora do escopo schema: deps ausentes (`twilio`,
`openid-client`, `d3`, tipos `lucide-react`, `import.meta.env`) — pertencem à
adaptação do 12, não a migration.

**Sinalização:** ao concluir a adaptação, o 12 deve abrir revisão do Agente 24
(tenancy/RLS em endpoints de voz) antes de qualquer pedido de abertura do
`legacyModuleGate` — registrado também no handoff 00→12/17 de reativação.

## Resolução (Agente 12 — 2026-11-14, branch `agente/12-onda2-handoffs`, commit `c3e37014b`)

Estratégia 1 (adaptar aos models canônicos) **implementada** em `src/lib/voice-hub/**`:

- `sessionRepository` → `agentSession`; `tenantRepository` → `organization`
  (commit anterior `6a1394c5c`).
- `userRepository` → `User`/`UserJobRole`/`JobRole`/`Account` (senha Argon2id em
  `Account.password`, providerId `credential`); `updateUser` agora usa
  `runInTransaction(fn, { organizationId })` — `prisma.$transaction` cru foi
  rejeitado pelo plugin `no-prisma-tx-escape` e faria a operação escapar do
  tenant/RLS.
- `roleRepository` → `JobRole`/`RoleCapabilityGrant` via relação
  `capabilityGrants` → `capabilityDefinition.code`; `voiceRoleForCanonicalRole`
  traduz `UserRole` canônico (ADMIN/GESTOR/...) para o voice-role interno —
  nada disso é persistido.
- `notificationRepository`/`notificationService` → `body`/`readAt`/
  `organizationId`/`userId` canônicos; `auditLogRepository`/`auditLogService`/
  `services/audit.ts` → `tenantId`/`actorId`/`entity`/`entityId`/`details`.
- `webhookEndpointRepository` → `organizationWebhookEndpoint`;
  `birthhub360CallResultRepository` → delegate `birthub360CallResult` (grafia
  canônica do schema).
- **Auth**: `services/authService.ts` (JWT/register/login/refresh com tenants
  paralelos) **deletado**. `routes/auth.routes.ts` reduzido a `GET /auth/me`
  (requireTenant) e `POST /auth/logout` (signOut Better Auth). Login/Register do
  frontend usam `authClient` (`signIn.email`/`signUp.email`); Sidebar usa
  `authClient.signOut()`.
- **requestContext/RLS**: `attachAuthIfPresent` (middlewares/index.ts) agora
  envolve o downstream em `requestContext.run({ tenantId, userId, role })` —
  devolvendo a promise de `isApiKeyRateLimitedIfNeeded` (bug anterior: `void`
  descartava o `next()`). `rbac.voiceHubSessionOf` resolve sessão tanto de
  `req.voiceHubUser` quanto de `req.user` canônico (populate por
  `authenticateToken`); `requireTenant` rejeita 401 sem org e normaliza
  `req.voiceHubUser`/`req.organizationId` para os controllers.
- `express.d.ts`: `organizationId` declarado não-opcional — seguro porque todo
  router do voice-hub passa por `requireTenant` (congelado por
  `__tests__/tenant-isolation.test.ts`).

**Evidência**:
- `npx tsc --noEmit -p tsconfig.voice.json`: **313 → 14 erros**, todos causados
  por dependências npm **ausentes do package.json**: `twilio`
  (telephony.controller/routes/twilioClient), `d3` (D3Chart + 8× implicit-any),
  `openid-client` (infrastructure/oidc.ts). Nenhum erro de delegate/campo
  Prisma restante.
- `npx vitest run -c vitest.unit.config.ts src/lib/voice-hub
  src/features/voice-hub`: **66 arquivos / 600 testes, todos verdes**
  (inclui `tenant-isolation.test.ts` 36/36: org autorizada vê só os próprios
  dados; cross-tenant → 404/vazio sem update/delete).
- `npx biome lint` nos arquivos do módulo: **0 erros** (149 warnings
  pré-existentes de a11y/estilo, não introduzidos).

**Pendente / fora do meu escopo**:
- `package.json` não declara `twilio`, `d3`, `openid-client` → decisão do
  Agente 00 (instalar ou remover os caminhos mortos). Sem isso o tsc.voice
  não zera.
- Teste de integração com Postgres real + RLS (`app.current_tenant_id`) ainda
  não executado — os testes são de unidade/mock. Necessário antes de qualquer
  pedido de abertura do `legacyModuleGate`.
- Revisão formal do Agente 24 sobre tenancy/RLS — **gate permanece fechado**
  (`src/bootstrap/routes.ts` intocado: `/api/voice-hub`, `/api/outbound`,
  `/api/dialer-3cx` → `unavailableLegacyModule`).
- `retentionScheduler`/`slaScheduler` corrigidos para BullMQ v6
  (`upsertJobScheduler`), mas **não estão wired** em worker/boot — pendência
  pré-existente registrada no checklist do 12-para-00.

# Handoff — VoiceHub: adaptar repositories/serviços aos models canônicos

De: 01 — Plataforma, Segurança e Dados
Para: 12 — Voz e Telefonia
Onda: F2
Status: resolvido
Prioridade: bloqueador (para reabertura do voice-hub)
Referência: `.agents/handoffs/12-para-01-voicehub-identidade-schema-adapters.md`
(decisão de estratégia registrada na seção "## Resolução" daquele handoff)

## Problema

`src/lib/voice-hub/**` referencia models/campos que não existem em
`prisma/schema.prisma` e mantém auth paralela (JWT próprio, `POST /auth/register`
criando tenants). O Agente 01 decidiu a **Estratégia 1: adaptar o voice-hub aos
models canônicos** — rejeitada a criação de models legados (duplicaria
identidade/tenancy). Nenhuma mudança de schema é necessária do lado do 01.

## Arquivo(s) envolvido(s) (propriedade do 12)

- `src/lib/voice-hub/repositories/tenantRepository.ts` → `prisma.organization`
- `src/lib/voice-hub/repositories/userRepository.ts` → `prisma.user` canônico +
  `UserJobRole`/`JobRole` (não existem `membership`/`role`/`permission`)
- `src/lib/voice-hub/repositories/roleRepository.ts` → `JobRole`,
  `UserJobRole`, `RoleAgentGrant`, `RoleCapabilityGrant` (tipos
  `RoleUncheckedCreateInput` etc. não existem — usar os `*JobRole*`/`Role*Grant*`)
- `src/lib/voice-hub/repositories/sessionRepository.ts` → `prisma.agentSession`
  (campos `agentId`/`channel`/`metadata`/`organizationId`/`deletedAt` já existem)
- `src/lib/voice-hub/repositories/webhookEndpointRepository.ts` →
  `prisma.organizationWebhookEndpoint`
- `src/lib/voice-hub/repositories/notificationRepository.ts` → `Notification`
  canônico: `body` (não `message`), `readAt` (não `isRead`), `organizationId`
  obrigatório, `kind`/`entity`/`entityId`/`userId` disponíveis
- `src/lib/voice-hub/repositories/auditLogRepository.ts` + `auditLogService` →
  `AuditLog.actorId`/`tenantId`/`entity`/`entityId`/`details`
- `src/lib/voice-hub/repositories/birthhub360CallResultRepository.ts` →
  delegate correto é `birthub360CallResult` (model renomeado na migration
  `20260928125100_rename_atlasgr_to_birthub360`)
- `src/lib/voice-hub/services/authService.ts` → remover
  `import { createTenant } from '../repositories/organizationRepository.js'`
  (módulo inexistente); criação de organização já ocorre no hook do Better Auth
  (`src/lib/auth.ts` ~L384). `POST /auth/register` legado deve ser removido ou
  reduzido a compatibilidade — não recriar tenants.
- `src/lib/voice-hub/middlewares/index.ts` → `attachAuthIfPresent`/`getAuthUser`
  devem usar `authenticateToken`/`req.user` do Better Auth **e popular
  `requestContext.run({ tenantId })`** em volta do handler — sem isso as policies
  `tenant_isolation` das tabelas de voz (`migration 20260925000000_voice_hub_rls`)
  ficam em fail-closed e bloqueiam tudo.
- Rotas `auth.routes` (register/login/refresh com JWT próprio) → eliminar ou
  reduzir a wrapper do Better Auth.

## Evidência

`node node_modules/typescript/bin/tsc --noEmit -p tsconfig.voice.json` (após
`prisma generate`, 2026-11-14) → 313 erros; erros de delegate confirmam cada
item acima. Demais erros (deps `twilio`, `openid-client`, `d3`, tipos
`lucide-react`, `import.meta.env`, `req.user`/`req.tenant` não estendidos) são
da adaptação e não exigem mudança de schema.

## Alteração necessária

Reescrever os repositories/services listados sobre os models canônicos e o auth
do Better Auth, populando `requestContext` com o `organizationId` da sessão em
todos os endpoints `/api/voice-hub/*`. Manter os invariantes de isolamento já
congelados em `src/lib/voice-hub/__tests__/tenant-isolation.test.ts`.

## Teste esperado

- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.voice.json` sem
  erros de delegate/campo nos repositories adaptados.
- Request autenticado via Better Auth acessa `/api/voice-hub/call-logs` e vê
  apenas o `organizationId` da sessão; org divergente → vazio/404.
- `tenant-isolation.test.ts` (36 testes) continua verde.
- Após implementação: abrir revisão do Agente 24 (tenancy/RLS) antes de pedir
  abertura do `legacyModuleGate`.

## Contexto adicional

- Não há models `Tenant`/`Membership`/`Role`/`Permission`/`Session` legados no
  schema canônico e nenhum será criado — o 01 rejeitou a Estratégia 2.
- `Session` no schema é do Better Auth (login), não de agente de voz — não usar.
- Handoffs relacionados: `12-para-00-voicehub-tenancy-auditoria.md`,
  `00-para-12-17-voicehub-reactivacao.md`,
  `12-para-05-outbound-api-legado-tenancy.md`,
  `12-para-17-dialer-3cx-sem-auth.md`.

## Resolução (Agente 12 — 2026-11-17, verificação em `main@414a0ca5f`, branch `agente/12-handoffs-20261117`)

A adaptação foi implementada e mergeada via **PR #339** (`agente/12-onda2-handoffs`, commits
`c6bea7eb5` + `db0b3173a` + `529ce4f39`, merge `c995c8b9b`) e revisada pelo Agente 24 com
veredito **APROVADO-COM-RESSALVAS** (`.agents/reviews/onda-2/24-revisao-prs-337-338-339-345-346.md`;
a ressalva ACH-1 — `req.user` sobrescrito — foi corrigida em `bfc3d2e67`, também em `main`).

Verificação executada nesta data:

- `npx tsc --noEmit -p tsconfig.voice.json` → **14 erros, todos explicados**: deps
  `twilio`/`d3`/`openid-client` ausentes do `package.json` (decisão pendente do Agente 00 —
  não instalar até reativação do módulo) + `any` implícitos decorrentes da falta dos tipos
  do `d3` + 1 erro em `oidc.ts` causado pelo `openid-client` ausente. **Zero erros de
  delegate/campo de model** — cada item da "Alteração necessária" está coberto.
- Repositories confirmados sobre os models canônicos: `sessionRepository` → `prisma.agentSession`
  (L9-182), `tenantRepository` → `prisma.organization` (L12-30),
  `birthhub360CallResultRepository` → `prisma.birthub360CallResult` (delegate correto,
  L41-53), `middlewares/index.ts` popula `req.voiceHubUser`/`req.organizationId` sem
  sobrescrever `req.user` canônico e envolve o handler em `requestContext` com `tenantId`
  (pré-requisito do RLS fail-closed).
- `src/lib/voice-hub/__tests__/tenant-isolation.test.ts` → **36/36 testes verdes** (re-executado
  em 2026-11-17).
- `legacyModuleGate` permanece **fechado** por decisão registrada (`src/bootstrap/routes.ts`
  L210-216 → 503 `MODULE_NOT_READY`) — a reabertura depende de: decisão de deps (00), teste de
  integração RLS real (handoff `onda-3/00-para-12-voicehub-teste-integracao-rls.md`, spec criado
  nesta branch, execução pendente de ambiente com Postgres) e handoffs abertos ao 05/17.
  Nenhum model legado foi criado — Estratégia 1 integralmente aplicada.

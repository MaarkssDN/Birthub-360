# Handoff — VoiceHub precisa de adaptadores de identidade/schema

De: 12 — Voz e Telefonia
Para: 01 — Plataforma, Segurança e Dados
Onda: F2
Status: aberto
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

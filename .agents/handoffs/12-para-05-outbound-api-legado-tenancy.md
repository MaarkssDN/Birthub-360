# Handoff — `/api/outbound/*` expõe banco legado sem escopo de tenant

De: 12 — Voz e Telefonia
Para: 05 — Prospecção
Onda: F2
Status: aberto
Prioridade: bloqueador (para reabertura do gate `outbound`)
Referência: `.agents/handoffs/12-para-00-voicehub-tenancy-auditoria.md`

## Problema

`src/features/prospecting/outbound/server/routes.ts` monta `apiRouter` com
`attachUser` (cookie próprio `birthhub360_session`, HMAC + `SESSION_SECRET`) —
identidade e tenant (`company`, string livre) **independentes** do
`organizationId` canônico. O banco é próprio (`getDatabase()` em `server/db.ts`).

Rotas sem nenhum `requireAuth`/`requireAdmin`/`requireManager`
(`routes/campaigns.routes.ts`, 208 linhas — verificado por grep: zero
ocorrências):

- `GET /campaigns` — lista todas as campanhas de todas as companies.
- `GET /users/:userId/leads` — leads + mensagens de qualquer vendedor.
- `GET /leads/distribution` — distribuicao de leads de todos os vendedores,
  agrupada por `company`.

O mount antigo em `src/bootstrap/routes.ts` era
`app.use('/api/outbound', authenticateToken, requireTenant, apiRouter)`:
o auth externo (Better Auth) passaria, mas o router interno não conhece
`req.user`/`organizationId` — ele só lê o cookie legado. Resultado se o gate
abrir: qualquer usuário autenticado do app lê o banco outbound inteiro
(todas as companies) → cross-tenant/LGPD.

## Arquivo(s) envolvido(s)

- `src/features/prospecting/outbound/server/routes.ts`
- `src/features/prospecting/outbound/server/routes/campaigns.routes.ts`
- `src/features/prospecting/outbound/server/routes/{leads,tasks,chat,
  integrations,system,auth}.routes.ts` (auditar cobertura de auth em cada um —
  campaigns é o pior caso confirmado)
- `src/features/prospecting/outbound/server/auth.ts` (modelo de tenant)

## Alteração necessária

Decidir e executar UMA das opções:

1. Blindar o router: exigir `requireAuth`/`requireManager` em toda rota de
   dados e impor escopo `company`/tenant derivado da sessão em TODA query
   (hoje várias queries não filtram por company — ex.: `GET /campaigns`).
2. Ou aposentar `/api/outbound` e migrar os dados/fluxos para os módulos
   canônicos (prospecting/cadence) — registrar decisão.

## Teste esperado

- Request autenticado como company A não retorna leads/campaigns de company B.
- Request sem sessão → 401 em todas as rotas de dados.

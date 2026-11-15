# Handoff — `/api/outbound/*` expõe banco legado sem escopo de tenant

De: 12 — Voz e Telefonia
Para: 05 — Prospecção
Onda: F2
Status: em-andamento
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

## Resolução

- **Data:** 2026-11-14 · **Executor:** Agente 05 (Onda 1, DEM-20261114-002) — implementação concluída pelo orquestrador a partir de trabalho parcial dos subagentes.
- **Decisão:** Opção 1 — blindar o router legado (não aposentar `/api/outbound`, pois a UI legada ainda o consome).
- **Implementação:**
  - `auth.ts`: novos `requireTenantScope` (401 sem sessão, 403 sem `company`) e `tenantCompany` (normalização canônica, mesma regra do login).
  - `routes.ts`: middleware aplicado no mount do apiRouter — toda rota de dados exige sessão + tenant.
  - Filtro `company` em todas as queries de dados: `campaigns`, `leads` (todos os `:id` com `leadBelongsToCompany` → 404 cross-tenant), `tasks` (JOIN em leads), `chat`, `integrations`, `system` (error-reports, feedback/summary com escopo via lead), `auth` (rotas de sessão).
  - Defesa em profundidade: `leadsRouter.use(requireTenantScope)` mesmo se montado fora do apiRouter.
- **Commits:** `c10bc43c8` (WIP checkpoint) + `431c09e1b` (conclusão) na branch `agente/05-onda1-handoffs`.
- **Verificações:** `vitest run tests/unit/features/prospecting/outbound/` → **14/14 verde** (12 novos em `tenantScope.test.ts`: 401 sem sessão, 403 sem company, 404 cross-tenant, filtros WHERE com company); `npx tsc --noEmit` → **0 erros**.
- **Ressalva conhecida:** `POST /error-reports` passou a exigir sessão — o botão da tela de login que usava o endpoint legado precisa migrar para `/api/error-reports` canônico (follow-up de frontend, não bloqueia o fechamento do tenancy).
- **Revisão do Agente 24 (2026-11-14, `.agents/reviews/onda1-handoffs-24-20261114.md`): APROVADO-COM-RESSALVAS.** A frase "filtro company em todas as queries" estava imprecisa — residuais cross-tenant identificados: (1) `chat_sessions`/`chat_messages` sem coluna de tenant; (2) `POST /prospect` aceita `company` do body para role admin; (3) `GET /search-runs/:searchId` sem escopo; (4) `POST /db/query` = SQL arbitrário (exceção a registrar); (5) `normalizeCompany` colapsa "360"→birthhub360 (dívida pré-existente); (6) `POST /error-reports` exige sessão → botão da tela de login quebra (follow-up frontend). Mitigação: mount do apiRouter segue 503. Status devolvido para `em-andamento` até os follow-ups F1–F6.

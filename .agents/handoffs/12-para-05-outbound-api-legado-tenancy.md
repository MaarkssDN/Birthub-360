# Handoff — `/api/outbound/*` expõe banco legado sem escopo de tenant

De: 12 — Voz e Telefonia
Para: 05 — Prospecção
Onda: F2
Status: resolvido
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

**Agente 05 — 2026-11-17** (branch `agente/05-handoffs-20261117`, commit deste PR)

Opção 1 executada — router blindado + escopo de tenant. A implementação já existia revisada na branch `agente/05-onda1-handoffs` (commits `c10bc43c8` → `431c09e1b` → `5aec9295b`; PR #323 foi fechado não-mergeado pelo proprietário com a ressalva "hardening preservado na branch"). Neste PR o hardening foi **portado integralmente** para `main` (diff limpo: merge-base `1e7f143eb` não tinha mudanças posteriores nos arquivos):

- `server/auth.ts`: novos `requireTenantScope` (401 sem sessão / 403 sem `company`), `tenantCompany(req)` e `normalizeTenantCompany`.
- `server/routes.ts`: `requireTenantScope` aplicado uma vez no mount — TODA rota de dados (system, campaigns, tasks, chat, integrations, leads) exige sessão + tenant; `/health` e `authRouter` permanecem públicos.
- Escopo `company` nas queries: campaigns (lista, `:id`, `users/:userId/leads` → 404 cross-tenant, `leads/distribution`), tasks (join `leads.company`), leads (`leadBelongsToCompany`/`LEAD_COMPANY_CLAUSE` em todas as rotas por-id — stage, tags, save, enrich, cnpj-refresh, evidence, bitrix), integrations (bitrix send-lead/check validam lead da company), system (search-runs, error-reports, feedback/summary, db/stats, observability, users), auth (`GET /users` filtrado por company).
- `POST /prospect`: `company` do body não é mais bypass para admin (ressalva F2 — ver handoff `05-para-05-prospect-admin-company-body.md`, resolvido).
- Chat: gap residual de coluna de tenant coberto na sequência via coluna `company` (migration do PR #381 + filtros em `chat.routes.ts` — ver handoff `05-para-01-chat-sessions-sem-coluna-tenant.md`, resolvido).

**Teste:** `tests/unit/features/prospecting/outbound/tenantScope.test.ts` (novo, 16 testes) — 401 sem sessão, 403 sem company, 404 cross-tenant em leads/campaigns/tasks/search-runs/evidence/stage/bitrix, filtro `company` presente nas queries, prospect sem bypass de admin. `vitest run` → 16/16 verde.

**Ressalvas (mesmas do parecer na branch de origem):**
- `/db/query` (SQL Explorer) segue `requireAdmin` sem escopo de tenant — débito documentado em `05-para-01-outbound-tenant-schema-decisao.md` (decisão de modelo: admin do módulo é single-tenant por desenho ou precisa de RLS real).
- `GET /error-reports`, `/observability/summary`, `/db/stats`, `/providers/health`, `/cnpj/:cnpj` exigem sessão+tenant mas não filtram por company (agregados/sondas — dados não são por-tenant; error-reports contém e-mail de usuário, avaliar `requireAdmin` futuro).
- Módulo continua montado fechado (503 via `unavailableLegacyModule('outbound')` em `src/bootstrap/routes.ts`) — este PR é pré-requisito para reabertura, não muda exposição ativa.
- **Ordem de merge:** PR #381 (coluna `company` em chat) deve mergear antes/junto — `chat.routes.ts` referencia a coluna.

# MAIN-50-DAILYPLAN-NOTES-IDOR — Relatório de execução

- **Agente**: 50 — Atlas (Squad 50, Integrações)
- **Data**: 2026-11-26
- **Branch**: `agente/50-dailyplan-idor-notes-main` (base `origin/main` @ `45b8e16e`)
- **Entrega de referência**: `a08e841a0c` (branch `agente/50-dailyplan-idor-s50`, base antiga)
- **SHA final**: commit único no topo de `agente/50-dailyplan-idor-notes-main` (SHA congelado informado no relatório de missão — `git rev-parse HEAD`)

## 1. Auditoria de `dailyPlan*` em `origin/main`

| Endpoint / serviço | Estado em main | Ação |
|---|---|---|
| `GET /daily-plan`, `POST /daily-plan/sync` (`fetchUserDailyPlan`) | Já escopado: filtra `owner: userId` localmente; override `assignedById` só para ADMIN/GESTOR na rota | Sem alteração |
| `POST /daily-plan/complete` (`completeDailyPlanItem`) | **Já corrigido por main** — fix POS4 (`fe55e14b2`, Agente 06): `normalizeDailyPlanItemId`, `assertBitrixItemBelongsToPlanUser` (responsável/atribuído = bitrixUserId do plano), `owner` no `where` de `LOCAL_ACTIVITY` | **Não tocado** (assinatura e testes POS4 preservados) |
| `POST /daily-plan/note` (`addDailyPlanItemNote`) | **VULNERÁVEL**: `_userId` ignorado; `LOCAL_ACTIVITY` via `findUnique({id, organizationId})` sem owner; `BITRIX_*` postava comentário sem posse; `entityType`/`entityId` arbitrários | Corrigido |
| `GET /daily-plan/notes` (`fetchDailyPlanItemNotes`) | **VULNERÁVEL (leitura)**: nem recebia `userId`; itemId enumerável → lia comentários de qualquer colega | Corrigido |
| `POST /daily-plan/activity` (`createDailyPlanActivity`) | **VULNERÁVEL (tenancy)**: `leadId` do body sem filtro de org → `Activity` podia apontar para `Lead` de outro tenant e vazar contato/empresa no plano | Corrigido |
| `GET/POST /daily-plan/closing*` | Já escopado por `{organizationId, owner/userId}` | Sem alteração |

## 2. O que foi portado/adaptado de `a08e841a0c`

- **`service/dailyPlanAuthz.ts` (novo, ~209 linhas)**: `DailyPlanUserContext`, `isDailyPlanManager`, `resolveDailyPlanBitrixUserId` (fail-closed, `findFirst` com `organizationId`), `assertDailyPlanItemAccess` (ADMIN/GESTOR bypass; demais → ownership via `tasks.task.get`/`crm.activity.get`/`crm.lead.get`, 404 antes de 403), `assertTimelineEntityType` (allowlist `lead|deal|contact|company`).
  - **Adaptação vs. original**: `assertBitrixItemOwnership` agora é **fail-closed** — `itemType` desconhecido lança 400 (antes caía sem checagem; a rota só faz cast de string, então um tipo bogus podia contornar a posse e ainda chegar em `crm.timeline.comment.*`).
- **`service/dailyPlan.service.ts`**:
  - `addDailyPlanItemNote`: `_userId: string` → `user: DailyPlanUserContext`; `assertTimelineEntityType` + `normalizeDailyPlanItemId` (agora `export`ada — rejeita prefixo de outro tipo, ex.: `bitrix_lead_9` como `BITRIX_TASK`); `LOCAL_ACTIVITY` com `findFirst({id, organizationId, owner: user.id})` → 404 (mesmo critério estrito do POS4, sem bypass de gestor em atividade local); `BITRIX_*` com `assertDailyPlanItemAccess` antes da mutação; **`BITRIX_LEAD` força `ENTITY_TYPE:'lead'`/`ENTITY_ID:rawId`** — o item É o lead, então `entityId`/`entityType` do cliente são ignorados (hardening extra: item autorizado não pode desviar o comentário para outra entidade).
  - `createDailyPlanActivity`: `prisma.lead.findFirst({id, organizationId, deletedAt: null})` → 404 antes de criar `Activity`.
- **`service/dailyPlanNotes.service.ts`**: `fetchDailyPlanItemNotes` passa a receber `user: DailyPlanUserContext`; `assertTimelineEntityType` + `assertDailyPlanItemAccess` **fora** do try/catch (403/404 propagam, não viram `[]` silencioso); `normalizeDailyPlanItemId` no lugar do regex permissivo; `BITRIX_LEAD` idem no read path.
- **`dailyPlanRoutes.ts`**: `POST /daily-plan/note` e `GET /daily-plan/notes` passam `{id, email, role}` do `AuthRequest`; nova allowlist `DAILY_PLAN_ITEM_TYPES` rejeita `itemType` inválido com 400 nas duas rotas (fecha a borda do bypass de gestor com tipo bogus).

## 3. Testes

Novo: `src/features/integrations/bitrix/service/__tests__/dailyPlanNotes.test.ts` (14 casos):

- `addDailyPlanItemNote`: LOCAL cross-owner → 404; LOCAL legítimo → update; BITRIX_TASK/activity/lead cross-user → 403 sem mutação; legítimos → sucesso; BITRIX_LEAD ignora entityId/entityType do cliente; entityType inválido → 400; ADMIN bypass; sem vínculo Bitrix → 400; prefixo cruzado → 400.
- `fetchDailyPlanItemNotes`: LOCAL → `[]`; BITRIX_TASK cross-user → 403 sem `getlist`; legítimo → notas; entityType inválido → 400.
- `createDailyPlanActivity`: leadId cross-org → 404; leadId da org → create.

Existente `dailyPlanComplete.test.ts` (POS4) mantido intacto — regressão executada junto.

## 4. Gate

- `vitest run -c vitest.unit.config.ts src/features/integrations/bitrix/` → **21 arquivos / 242 testes passando** (inclui `dailyPlanNotes.test.ts` 16 novos + `dailyPlanComplete.test.ts` POS4 10 testes intactos).
- `tsc --noEmit` → **0 erros nos arquivos alterados**. Único erro do projeto: `src/lib/auth/cookie-security.ts(20,3) TS2739` (`Dict<string>` vs `ProcessEnv`) — **pré-existente/ambiental**, arquivo não tocado por esta missão (introduzido por `40b64db23e`, fora do diff).
- `biome lint` nos 5 arquivos alterados → limpo.
- `prisma generate` executado no worktree (client v7.10.0) para viabilizar tsc/vitest — node_modules é junction do checkout principal.
- IT/E2E: Postgres/Redis indisponíveis no worktree → fica para CI.

## 5. Ressalvas / handoffs

- **Residual conhecido (fora do escopo do porte)**: para `BITRIX_ACTIVITY`, `entityId`/`entityType` do cliente (allowlist ok) não são conferidos contra o `OWNER_*` da atividade — um usuário dono de uma atividade ainda poderia ler/postar comentário na timeline de outra entidade CRM do portal passando `entityId` arbitrário dentro de `lead|deal|contact|company`. Fechar exigiria `assertDailyPlanItemAccess` devolver a entidade dona; registrar como handoff se o Coordenador quiser endereçar.
- `completeDailyPlanItem` (POS4) usa modelo "posse do item = responsável do plano" (mais estrito: não aceita `CREATED_BY`), enquanto `dailyPlanAuthz` aceita responsável **ou** criador e dá bypass a gestores. Divergência intencional: não alterei o fix do Agente 06; se quiserem convergir as duas regras, é decisão de coordenação.

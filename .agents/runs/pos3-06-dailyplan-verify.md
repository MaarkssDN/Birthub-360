# POS3-06-DAILYPLAN-VERIFY — Auditoria somente-leitura: persistência e tenancy do daily-plan Bitrix

- **Agente:** 06 — Gael (Verificação de Realidade, Squad 00)
- **Missão:** `POS3-06-DAILYPLAN-VERIFY` (read-only; nenhum código de produto alterado)
- **Base auditada:** `1960064d8` (`agente/06-dailyplan-verify-s00`)
- **Branch comparada:** `agente/50-dailyplan-idor-s50` → **sem commits** (`git rev-parse` = `1960064d8`). Item 6 da missão fica **pendente de re-verificação** quando o 50 commitar.
- **Data:** 2026-11-23

---

## 1. Fluxo completo de `POST /api/bitrix/daily-plan/complete`

```
POST /api/bitrix/daily-plan/complete
  └─ src/bootstrap/routes.ts:225  → app.use('/api/bitrix', authenticateToken, requireTenant, bitrixRoutes)
  └─ src/features/integrations/bitrix/bitrix.routes.ts:848 → router.use(dailyPlanRoutes)
  └─ src/features/integrations/bitrix/dailyPlanRoutes.ts:74-90
       extrai { organizationId, id: userId } do JWT (AuthRequest.user)
       valida apenas presença de itemType/itemId (NÃO valida enum nem formato)
       → completeDailyPlanItem(organizationId, userId, itemType, itemId)
  └─ src/features/integrations/bitrix/bitrix.service.ts:33 (reexport)
  └─ src/features/integrations/bitrix/service/dailyPlan.service.ts:642-691
```

Desfecho por `itemType` (`DailyPlanItemOrigin`, `src/shared/contracts/dailyPlan.contract.ts:12-16`):

| itemType | Ação | Evidência |
|---|---|---|
| `LOCAL_ACTIVITY` | `prisma.activity.update({ where: { id, organizationId }, data: { status: 'Concluida' } })` | dailyPlan.service.ts:650-657 |
| `BITRIX_TASK` | `tasks.task.complete` via webhook da org | dailyPlan.service.ts:666-669 |
| `BITRIX_ACTIVITY` | `crm.activity.update` `{ COMPLETED: 'Y' }` | dailyPlan.service.ts:671-677 |
| `BITRIX_LEAD` | `crm.timeline.comment.add` (comentário fixo "Contato diário realizado...") | dailyPlan.service.ts:679-688 |
| qualquer outro | **cai no default e retorna `{ success: true, 'Item concluído.' }` sem fazer nada** | dailyPlan.service.ts:690 |

**Persistência local:** NÃO existe model `DailyPlan`/`DailyPlanItem` no `prisma/schema.prisma`. O plano diário é **montado on-the-fly** em `fetchUserDailyPlan` (dailyPlan.service.ts:226-637) a partir de `crm.activity.list`, `tasks.task.list`, `crm.lead.list` do Bitrix + `prisma.activity.findMany` local. A única persistência do domínio é `DailyPlanClosing` (schema.prisma:3470-3488) — fechamento de fim de dia, fluxo separado (`/daily-plan/closing`, `dailyPlanClosing.service.ts`).

## 2. Isolamento de tenant

- **Rota:** `authenticateToken` + `requireTenant` (routes.ts:225); `organizationId`/`userId` vêm do JWT, nunca do body. `requireTenant` só exige `user.organizationId` presente (authorization.ts:12-28).
- **Conexão Bitrix:** `resolvePlanConnection` → `listBitrixConnections(organizationId)` filtra por org (connections.ts:39-41) e `getConnectionWebhookUrl` revalida `{ id, organizationId }` antes de devolver a URL (client.ts:214-220). **Cross-tenant via webhook: protegido** — o webhook usado é sempre o da própria org (`connections[0]`, dailyPlan.service.ts:184-189).
- **LOCAL_ACTIVITY:** `where: { id: rawId, organizationId }` (dailyPlan.service.ts:653) — filtro de tenant presente (extendedWhereUnique, Prisma 7). ID de outra org → P2025 → 404 "Registro não encontrado." (errorHandler.ts:254-257). **Não vaza existência cross-tenant.**
- **BITRIX_\*:** nenhuma query local por ID — a "autorização" é delegada ao portal Bitrix via webhook da org. IDs Bitrix são **numéricos sequenciais e enumeráveis**.
- **FK:** `Activity.organizationId` é FK simples → Organization (schema.prisma:763-764), convenção do repo; `DailyPlanClosing` tem `@@unique([userId, referenceDate])` (schema.prisma:3486) — userId é globalmente único, colisão cross-tenant impossível.

**Veredito item 2: `furo confirmado` (mesmo-tenant) / cross-tenant `não reproduzido`.**

## 3. Autorização / ownership

- `completeDailyPlanItem(organizationId, _userId, ...)` — **`_userId` é declarado e NUNCA usado** (dailyPlan.service.ts:644). Idem `addDailyPlanItemNote` (:698).
- **Nenhum ponto do fluxo verifica ownership**: não há checagem de `Activity.owner === userId`, nem resolução do `bitrixUserId` do chamador para comparar com `RESPONSIBLE_ID`/`OWNER_ID` do item alvo.
- `itemId` é 100% controlado pelo cliente (body). `itemType` não é validado contra o enum.
- Prefixo é removido por regex genérica (`/^(bitrix_task_|bitrix_act_|bitrix_lead_)/`, :664) **independente do itemType** — `itemType=BITRIX_TASK` + `itemId=bitrix_act_7` resolve `rawId=7` e completa a task 7. Idem `LOCAL_ACTIVITY` aceita o cuid cru sem prefixo.
- `GET /daily-plan/notes` (dailyPlanRoutes.ts:121-143) e `addDailyPlanItemNote` aceitam `entityType`/`entityId` **livres** → leem (`crm.timeline.comment.list`, dailyPlanNotes.service.ts:59-78) e escrevem (`crm.timeline.comment.add`, dailyPlan.service.ts:746-754) comentários de **qualquer entidade CRM do portal** (lead/deal/contact/company, qualquer ID).
- `GET /daily-plan` permite `assignedById` arbitrário apenas para ADMIN/GESTOR (dailyPlanRoutes.ts:31-33) — esse gate existe na leitura, mas **não** existe em complete/note/notes.

**Cenário confirmado (mesmo tenant):** qualquer usuário autenticado (qualquer papel, inclusive VISUALIZADOR — a rota não tem `requireRole`) pode:
1. Completar `Activity` local de outro usuário do mesmo org (`local_<cuid>` — cuid precisa ser conhecido, mas vaza via plano do admin/equipe);
2. Completar **qualquer** task/activity/lead do portal Bitrix por ID numérico sequencial — inclusive itens que nunca estiveram no plano do chamador;
3. Postar comentário em qualquer entidade CRM do portal via `/daily-plan/note`;
4. Ler histórico de comentários de qualquer entidade CRM via `/daily-plan/notes`.

**Veredito item 3: `furo confirmado` (IDOR intra-tenant, alta severidade).**

## 4. Idempotência / duplicação

- `LOCAL_ACTIVITY`: `update` setando status fixo → naturalmente idempotente. Re-complete retorna sucesso (status já 'Concluida' — Bitrix/ActivityStatus permite, sem erro).
- `BITRIX_ACTIVITY`: `COMPLETED: 'Y'` → idempotente.
- `BITRIX_TASK`: delega ao Bitrix; sem pré-checagem de status local (o filtro `!STATUS: 5` só existe na listagem). Re-complete de task já concluída depende do erro do Bitrix (provável `BitrixDefinitiveError` → erro HTTP, não sucesso silencioso).
- `BITRIX_LEAD` e `/daily-plan/note`: **`crm.timeline.comment.add` cria um comentário novo a cada chamada** — duplo clique/retry gera **duplicatas reais no Bitrix**. Sem chave de idempotência, sem dedupe.
- `DailyPlanClosing`: `upsert` por `(userId, referenceDate)` (dailyPlanClosing.service.ts:109-124) → idempotente por design.

**Veredito item 4: `furo confirmado` (duplicação de comentários; demais caminhos degradam para o comportamento do Bitrix).**

## 5. Sanitização PII em logs/respostas

- Logs do fluxo: `userEmail`, `userId`, `organizationId`, `bitrixUserId` (dailyPlan.service.ts:268, 300, 332, 361, 386, 393, 844; dailyPlanNotes.service.ts:81). **`userEmail` é PII em log** — severidade baixa (log interno estruturado, não vai ao cliente).
- Conteúdo de notas/comentários (`noteText`, `POST_MESSAGE`, `COMMENT`) **não é logado** — bom.
- Respostas HTTP: apenas `{ success, message }` com strings fixas — sem PII/IDs internos expostos. Erros passam pelo `errorHandler` com `clientSafeMessage` (errorHandler.ts:241-262).
- `userComment`/`nextDayGoals` do closing são persistidos sem sanitização além de `trim()` (dailyPlanClosing.service.ts:95-116) — texto livre do próprio usuário, renderizado via React (escaped por padrão); observação, não furo.

**Veredito item 5: `não reproduzido` como furo; observação de PII (email) em logs registrada.**

## 6. Comparação com `agente/50-dailyplan-idor-s50`

`git rev-parse agente/50-dailyplan-idor-s50` = `1960064d8...` — **idêntica à base; zero commits**. `git log 1960064d8..agente/50-dailyplan-idor-s50` vazio. Nada a auditar; **re-verificação obrigatória quando o 50 commitar** (o fix de IDOR provavelmente toca exatamente `completeDailyPlanItem`, `addDailyPlanItemNote`, `fetchDailyPlanItemNotes` — os três pontos sem ownership).

---

## Resumo de vereditos

| # | Item | Veredito |
|---|---|---|
| 1 | Fluxo mapeado | documentado acima |
| 2 | Tenant cross-org | `não reproduzido` (org filter + webhook por org) |
| 2b | Tenant mesmo-org | **`furo confirmado`** — IDOR |
| 3 | Ownership/autorização | **`furo confirmado`** — `_userId` ignorado, itemId livre, entityType/entityId livres |
| 4 | Idempotência | **`furo confirmado`** — duplicação de comentários Bitrix; restante depende do Bitrix |
| 5 | PII | `não reproduzido` (furo); observação: userEmail em logs |
| 6 | Fix do Agente 50 | **pendente** — branch sem commits |

## Handoffs abertos

- `.agents/handoffs/onda-4/06-para-50-dailyplan-complete-note-idor.md` — IDOR (prioridade: **bloqueador** para release do fluxo)
- `.agents/handoffs/onda-4/06-para-50-dailyplan-idempotencia-pii.md` — duplicação de comentários + validação de itemType + PII em log (prioridade: **alto**)

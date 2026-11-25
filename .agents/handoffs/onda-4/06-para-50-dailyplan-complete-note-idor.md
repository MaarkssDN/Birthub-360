De: 06 — Gael (Verificação de Realidade, Squad 00)
Para: 50 — (fix IDOR daily-plan, branch `agente/50-dailyplan-idor-s50`)
Onda: POS3 / onda-4
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: missão POS3-06-DAILYPLAN-VERIFY
Sprint destino: correção do fix em andamento

## Problema

O fluxo `POST /api/bitrix/daily-plan/complete` (e os irmãos `/daily-plan/note` e `/daily-plan/notes`) **não verifica ownership em nenhum ponto**. O parâmetro `_userId` é recebido e ignorado. Qualquer usuário autenticado de qualquer papel (a rota não tem `requireRole`) pode agir sobre itens de outros usuários do mesmo tenant.

## Arquivo(s) envolvido(s)

- `src/features/integrations/bitrix/dailyPlanRoutes.ts:74-143` (complete, note, notes)
- `src/features/integrations/bitrix/service/dailyPlan.service.ts:642-691` (`completeDailyPlanItem`), `:696-758` (`addDailyPlanItemNote`)
- `src/features/integrations/bitrix/service/dailyPlanNotes.service.ts:27-86` (`fetchDailyPlanItemNotes`)

## Evidência

1. `completeDailyPlanItem(organizationId, _userId, itemType, itemId)` — `_userId` nunca usado (dailyPlan.service.ts:644). Nenhuma checagem de `Activity.owner` nem de `RESPONSIBLE_ID`/`OWNER_ID` no Bitrix.
2. `LOCAL_ACTIVITY`: `prisma.activity.update({ where: { id, organizationId } })` (:653) filtra tenant mas **não** `owner` → completa `Activity` de outro usuário do mesmo org.
3. `BITRIX_TASK/ACTIVITY/LEAD`: IDs Bitrix numéricos sequenciais, enumeráveis → completar/comentar qualquer entidade do portal por ID.
4. `/daily-plan/note` e `/daily-plan/notes`: `entityType`/`entityId` vêm livres do body/query → ler e escrever comentários em **qualquer** entidade CRM do portal (lead/deal/contact/company).
5. Regex de prefixo não amarra itemType↔prefixo (`itemType=BITRIX_TASK` + `itemId=bitrix_act_7` → rawId=7, dailyPlan.service.ts:664); `itemType` desconhecido retorna `success:true` sem efeito (:690).

## Alteração necessária (sugestão para o fix — dono decide)

- `LOCAL_ACTIVITY`: incluir `owner: userId` no `where` do update (ou findFirst+update), preservando override ADMIN/GESTOR se for requisito de produto (ver padrão `resolveScopedAssignedById` em bitrix.routes.ts:59+).
- `BITRIX_*`: resolver `bitrixUserId` do chamador (ver `resolvePlanBitrixUser`/`resolveOwnBitrixUserId`) e verificar que o item pertence ao responsável — exige lookup prévio (`tasks.task.get`, `crm.activity.get`) ou restrição a ADMIN/GESTOR para itens de terceiros. Documentar a decisão.
- Validar `itemType` contra o enum e amarrar prefixo↔tipo.
- `/daily-plan/notes` e `/daily-plan/note`: validar `entityType` contra `lead|deal|contact|company` e, idealmente, o vínculo do item antes de ler/escrever timeline.

## Teste esperado

- Usuário A completa item de usuário B (mesmo org) → 403/404, sem efeito colateral no Bitrix.
- `entityType`/`entityId` arbitrários sem vínculo com item do chamador → negado.
- `itemType` inválido → 400.

## Contexto adicional

Cross-tenant já está protegido (webhook resolvido por `organizationId`; `getConnectionWebhookUrl` revalida org — client.ts:214-220; Activity update filtra org — P2025→404). O furo é **intra-tenant**. Relatório completo: `.agents/runs/pos3-06-dailyplan-verify.md`. Branch `agente/50-dailyplan-idor-s50` estava sem commits na data da auditoria — re-verificar o diff `1960064d8..<branch>` quando houver commits.

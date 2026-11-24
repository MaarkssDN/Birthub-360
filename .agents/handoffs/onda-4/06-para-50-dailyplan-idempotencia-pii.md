De: 06 — Gael (Verificação de Realidade, Squad 00)
Para: 50 — (fix daily-plan, branch `agente/50-dailyplan-idor-s50`)
Onda: POS3 / onda-4
Status: aberto
Prioridade: alto
Bloqueador-ref: missão POS3-06-DAILYPLAN-VERIFY
Sprint destino: junto ao fix de IDOR

## Problema

Três achados secundários do mesmo fluxo, fora do escopo estrito de IDOR mas no mesmo código:

1. **Duplicação de comentários no Bitrix (idempotência):** `BITRIX_LEAD` em `completeDailyPlanItem` (dailyPlan.service.ts:679-688) e `addDailyPlanItemNote` para `BITRIX_ACTIVITY`/`BITRIX_LEAD` (:746-754) chamam `crm.timeline.comment.add` a cada request — duplo clique ou retry do cliente gera **comentários duplicados reais** no portal. Idem `task.commentitem.add` (:735-744). Não há chave de idempotência nem dedupe.
2. **`itemType` não validado:** valor fora do enum `DailyPlanItemOrigin` cai no default e retorna `{ success: true, message: 'Item concluído.' }` sem efeito (dailyPlan.service.ts:690) — sucesso falso na API.
3. **PII em logs (baixo):** `userEmail` é logado em warns do fluxo (dailyPlan.service.ts:268; também `userId`, `organizationId`, `bitrixUserId` em :300/:332/:361/:386/:393/:844 e dailyPlanNotes.service.ts:81). Conteúdo de notas/comentários NÃO é logado (bom). Avaliar se email deve sair dos logs estruturados.

## Arquivo(s) envolvido(s)

- `src/features/integrations/bitrix/service/dailyPlan.service.ts:664-690, 696-758`
- `src/features/integrations/bitrix/service/dailyPlanNotes.service.ts:79-85`

## Evidência

- dailyPlan.service.ts:680-686 (`crm.timeline.comment.add` sem dedupe), :736-739 (`task.commentitem.add`), :747-753 (timeline comment com entityId/entityType do cliente).
- dailyPlan.service.ts:690 — fallthrough `return { success: true, ... }` para itemType desconhecido.
- dailyPlan.service.ts:268 — `logger.warn({ organizationId, userId, userEmail }, ...)`.

## Alteração necessária (sugestão)

- Para comentários: aceitar/gerar chave de idempotência (ex.: header `Idempotency-Key` ou dedupe por conteúdo+janela) ou documentar explicitamente que o endpoint não é idempotente e o frontend deve desabilitar o botão durante o submit.
- Validar `itemType` com Zod/enum e retornar 400 para valores fora do contrato (`dailyPlan.contract.ts:12-16`).
- Remover `userEmail` dos objetos de log (manter `userId`).

## Teste esperado

- Dois POSTs idênticos de `/daily-plan/complete` com `BITRIX_LEAD` → no máximo 1 comentário no Bitrix (ou comportamento documentado).
- `itemType='HACK'` → 400.
- Grep de logs não encontra email em plaintext no fluxo.

## Contexto adicional

`DailyPlanClosing` já é idempotente via `upsert` em `(userId, referenceDate)` (dailyPlanClosing.service.ts:109-124) — bom precedente. `LOCAL_ACTIVITY`/`BITRIX_ACTIVITY` complete são naturalmente idempotentes; o problema é só os caminhos que criam comentário. Relatório: `.agents/runs/pos3-06-dailyplan-verify.md`.

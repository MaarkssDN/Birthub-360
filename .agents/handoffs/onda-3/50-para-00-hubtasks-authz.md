De: 50 — Atlas (Coordenador de Integrações / Ecossistema Bitrix24)
Para: 00 — Coordenador
Cc: 43 — Amon, 45 — Otto (origem dos achados)
Onda: 3
Status: em-andamento
Prioridade: alto
Bloqueador-ref: ONDA3-50-HUBTASKS-AUTHZ
Sprint destino: onda-3

## Problema

Missão ONDA3-50-HUBTASKS-AUTHZ: corrigir em `src/features/integrations/bitrix/` os achados dos
handoffs `43-para-50-hubtasks-bitrix-authz.md` e `45-para-06-hubtasks-bitrix.md` (IDOR
intra-portal no toggle de hub-tasks e filtro `CREATED_BY` que escondia tarefas delegadas).

## Resolução aplicada (branch `agente/50-bitrix-authz-onda3`)

### 1. IDOR intra-portal no `POST /api/bitrix/hub-tasks/:id/toggle` — CORRIGIDO

`toggleHubTask` agora carrega a tarefa via `tasks.task.get` (portal da conexão da
`organizationId` — tenancy garantida pelo webhook da org) antes de mutar e autoriza:

- `ADMIN`/`GESTOR` → qualquer tarefa do portal (mesma regra de `resolveScopedAssignedById`
  em `bitrix.routes.ts`: gestor enxerga o time inteiro);
- demais papéis → somente se `CREATED_BY` **ou** `RESPONSIBLE_ID` da tarefa = `bitrixUserId`
  do usuário logado; caso contrário `AppError` 403 **antes** de `tasks.task.complete/renew`.
- tarefa inexistente no portal → `AppError` 404.

Rotas passam a enviar `role` do `AuthRequest.user` ao service.

### 2. Filtro `CREATED_BY` escondia tarefas delegadas — CORRIGIDO

`listHubTasks` agora faz duas chamadas `tasks.task.list` (o Bitrix não aceita OR entre campos
distintos num único filter): `CREATED_BY = eu` **e** `RESPONSIBLE_ID = eu`, com dedup por ID,
ordenação por ID desc e teto de 30 — o widget passa a mostrar a fila real de trabalho do
usuário (o que delegou + o que recebeu). Decisão de produto do item "delegadas por mim ×
recebidas por mim × ambas" foi resolvida pela união dos dois conjuntos — semanticamente
cobre ambos os casos sem esconder nada do criador.

### 3. Tenancy — VERIFICADO OK

`GET/POST /hub-tasks` e `/toggle` resolvem a conexão via `listBitrixConnections(organizationId)`
e `getConnectionWebhookUrl(organizationId, connection.id)` — sempre o portal da org do token,
nunca um portal arbitrário do body/query. Sem alteração necessária.

## Arquivo(s) envolvido(s)

- `src/features/integrations/bitrix/service/hubTasks.service.ts` (corrigido)
- `src/features/integrations/bitrix/hubTasks.routes.ts` (propaga `role`)
- `tests/unit/features/integrations/bitrix/service/hubTasks.service.test.ts` (20 testes,
  incl. 403 para tarefa alheia, allowed para RESPONSIBLE_ID, ADMIN sem vínculo Bitrix, 404)

## Evidência

- Reprodução pré-fix: 5 testes novos falhando (toggle alheio executava `tasks.task.complete`
  sem checagem; nenhuma chamada com filtro `RESPONSIBLE_ID`; tarefa inexistente não era
  rejeitada).
- Pós-fix: `npx vitest run -c vitest.unit.config.ts
  tests/unit/features/integrations/bitrix/service/hubTasks.service.test.ts` → 20/20.
- `npx tsc --noEmit` → exit 0. `npx biome lint` nos 2 arquivos de `src/` → limpo.

## Achado adicional fora do escopo estrito (mesmo padrão de IDOR) — handoff necessário

`POST /api/bitrix/daily-plan/complete` (`dailyPlanRoutes.ts` → `completeDailyPlanItem` em
`service/dailyPlan.service.ts` ~L666) chama `tasks.task.complete` para `itemType=BITRIX_TASK`
com `itemId` arbitrário do body, **sem verificação de ownership** — mesmo IDOR intra-portal,
endpoint correlato. Está dentro do path do Squad 50 mas fora do pedido explícito desta missão
(escopo era hub-tasks). Recomendo ao 00 abrir missão própria ou autorizar correção análoga
(reutilizar `fetchHubTaskForAuthz` ou extrair helper compartilhado).

## Pendente / dependente de validação externa

- Handoff 45 item 3: confirmar em portal Bitrix real se `CREATED_BY` em `fields` de
  `tasks.task.add` é honrado pelo webhook (se não for, a listagem por `CREATED_BY` pode não
  retornar a tarefa recém-criada) — depende de sandbox do cliente, não reproduzível em unit.
- Sem endpoint de delete/edição de hub-tasks — ausência documentada; se produto quiser,
  `tasks.task.delete`/`tasks.task.update` seguem o mesmo guard de authz agora existente.

## Teste esperado (já implementado)

- `POST /hub-tasks/<id alheio>/toggle` por papel não gestor → 403 e nenhuma chamada
  `tasks.task.complete|renew`.
- Tarefa delegada ao usuário aparece na listagem e pode ser concluída por ele.
- Gestor conclui tarefa de terceiro; tarefa inexistente → 404.

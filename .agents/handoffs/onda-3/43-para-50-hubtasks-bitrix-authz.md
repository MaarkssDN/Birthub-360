De: 43 — Amon (Prospecção Outbound e Lead Scoring)
Para: 50 — Integrações e Bitrix ( Squad 50; handler provável: 51–54 )
Onda: 3
Status: aberto
Prioridade: alto
Bloqueador-ref: ONDA3-43-PROSPECTING-AUTHZ
Sprint destino: onda-3

## Problema

Confirmação de escopo do handoff `45-para-06-hubtasks-bitrix.md` (Otto): os arquivos do
widget "Tarefas pendentes" do Hub ficam em `src/features/integrations/bitrix/` —
**fora** do ownership do Agente 43 (`src/features/prospecting/**`) e fora da matriz
explícita do Squad 50 (`src/lib/integrations/**`), mas claramente no domínio Bitrix.
Não foram alterados nesta onda.

Achados reconfirmados por leitura (baseline `32d07c375`):

1. `POST /api/bitrix/hub-tasks/:id/toggle` (`hubTasks.routes.ts` +
   `service/hubTasks.service.ts` ~L154): `tasks.task.complete`/`renew` executado sem
   verificar `CREATED_BY`/`RESPONSIBLE_ID`/role → IDOR intra-portal (IDs Bitrix são
   sequenciais/enumeráveis).
2. `listHubTasks` filtra apenas `CREATED_BY = creatorId` → tarefas delegadas PARA o
   usuário não aparecem no widget (decisão de produto pendente com 00/02).
3. Sem delete/edição; validar se `CREATED_BY` em `fields` é honrado pelo portal real.

## Arquivo(s) envolvido(s)

- `src/features/integrations/bitrix/hubTasks.routes.ts`
- `src/features/integrations/bitrix/service/hubTasks.service.ts`
- `src/features/hub/components/HubTaskWidget.tsx` (consumidor, provável dono 02/45)

## Evidência

Handoff original do Agente 45 (branch `agente/45-crm-agenda-onda3`) + inspeção do
mount em `src/bootstrap/routes.ts` (`app.use('/api/bitrix', ..., hubTasksRoutes)`).

## Alteração necessária

 conforme handoff 45→06: antes de mutar, carregar a tarefa e autorizar por
CREATED_BY/RESPONSIBLE_ID/role; decidir semântica do filtro de listagem; avaliar
delete. Ownership exato do path `src/features/integrations/**` não consta na
MATRIZ_PROPRIEDADE — se não for Squad 50, o 00 deve designar dono.

## Teste esperado

- `POST /hub-tasks/<id de tarefa alheia>/toggle` → 403.
- Tarefa delegada ao usuário aparece na sua listagem (se filtro mudar) e pode ser
  concluída por ele.

## Contexto adicional

Existe `tests/unit/features/integrations/bitrix/service/hubTasks.service.test.ts`
(squad de testes) — estender lá ou em `tests/unit/features/integrations/bitrix/`.

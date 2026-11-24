De: 45 — Otto (Tarefas, Agendas e Atividades)
Para: 06 — Integrações e Bitrix
Onda: 3
Status: aberto
Prioridade: alto
Bloqueador-ref: ONDA3-45-CRM-AGENDA
Sprint destino: onda-3

## Problema

Widget "Tarefas pendentes" do Hub (`src/features/integrations/bitrix/hubTasks.routes.ts` +
`service/hubTasks.service.ts`, montado em `/api/bitrix/hub-tasks`). Três problemas comprovados
por leitura de código:

### 1. `toggleHubTask` não verifica se a tarefa pertence ao usuário/fluxo — IDOR dentro do portal

`POST /hub-tasks/:id/toggle` aceita qualquer `taskId` e chama `tasks.task.complete`/`renew`
direto no webhook do portal Bitrix da org. Não há verificação de que:

- a tarefa foi criada via este fluxo (`CREATED_BY` = usuário logado);
- o usuário é o `RESPONSIBLE_ID` ou tem papel para concluir tarefa alheia.

Qualquer usuário autenticado da org pode concluir/reabrir QUALQUER tarefa do portal Bitrix
pelo ID numérico (IDs do Bitrix são sequenciais e enumeráveis). Correção sugerida: antes de
completar/renovar, listar/filtrar a tarefa e exigir `CREATED_BY === creatorId` ou
`RESPONSIBLE_ID === bitrixUserId do usuário` (ou role admin/gestor), senão 403.

### 2. `listHubTasks` filtra só `CREATED_BY` — tarefas delegadas PARA mim são invisíveis

`tasks.task.list` usa `filter: { CREATED_BY: creatorId }`. O widget se chama "Tarefas
pendentes" mas mostra apenas o que EU deleguei — o responsável real (colega) nunca vê as
tarefas que recebeu aqui. Se a intenção é "fila de trabalho do vendedor", o filtro deveria
incluir `RESPONSIBLE_ID` (ou `!createdBy && responsible` conforme semântica desejada —
decisão de produto a confirmar com o 00/02). Hoje o SDR que recebe a tarefa delegada não tem
como vê-la/concluí-la neste widget.

### 3. Sem exclusão e sem edição

Missão ONDA3-45 pedia verificar criação/edição/conclusão/exclusão. Existe create + toggle
(complete/renew), mas:

- não há DELETE nem "disclaimer" — tarefa delegada errada fica para sempre no Bitrix (e no
  widget por 30 itens);
- `createHubTask` envia `CREATED_BY` em `fields`, mas o Bitrix normalmente define o criador
  como o usuário do webhook — convém confirmar que o campo é honrado no portal real
  (se não for, `listHubTasks` com filtro CREATED_BY pode não retornar a tarefa recém-criada,
  ou retornar tarefas de outro usuário do portal — validar em sandbox).

## Arquivo(s) envolvido(s)

- `src/features/integrations/bitrix/hubTasks.routes.ts` (rotas GET/POST/toggle)
- `src/features/integrations/bitrix/service/hubTasks.service.ts` (`listHubTasks` ~82,
  `toggleHubTask` ~154, `createHubTask` ~127)
- `src/features/hub/components/HubTaskWidget.tsx` (consome a API; fora do escopo de escrita
  do 45 também)

## Evidência

Leitura direta na branch `agente/45-crm-agenda-onda3` (baseline 32d07c375). Itens 1 e 2 são
verificáveis por inspeção do payload enviado ao `tasks.task.*`; item 3 depende de validação
no portal Bitrix do cliente.

## Alteração necessária

1. Em `toggleHubTask`: carregar a tarefa (`tasks.task.get` ou list com filtro ID) e autorizar
   por CREATED_BY/RESPONSIBLE_ID/role antes de mutar.
2. Decidir com produto o filtro de listagem (delegadas por mim × recebidas por mim × ambas).
3. Avaliar endpoint de delete (`tasks.task.delete`) ou documentar ausência como decisão.

## Teste esperado

- Usuário B tenta `POST /hub-tasks/<id de tarefa do usuário A>/toggle` → 403.
- Tarefa delegada a B aparece na listagem de B (se filtro mudar) e pode ser concluída por B.
- Criar tarefa → ela reaparece na listagem do criador após reload (persistência Bitrix).

## Contexto adicional

Tenant: a conexão Bitrix é por `organizationId`, então o isolamento cross-tenant depende do
portal correto — OK. O problema é autorização intra-tenant e semântica do filtro.

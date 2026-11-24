De: 45 — Otto (Tarefas, Agendas e Atividades)
Para: 05 — Prospecção
Onda: 3
Status: aberto
Prioridade: alto
Bloqueador-ref: ONDA3-45-CRM-AGENDA
Sprint destino: onda-3

## Problema

`src/features/prospecting/outbound/server/routes/tasks.routes.ts` — terceiro sistema de
tarefas do produto (além de `Activity` do CRM e das tarefas Bitrix do Hub). Dois problemas
de autorização comprovados por leitura de código:

### 1. `GET /users/:userId/tasks` não valida que `:userId` é o próprio usuário logado

Rota protegida só por `requireAuth` (linha 169). O comentário nas linhas 190-191 diz "um
vendedor comum só vê as próprias [tarefas]" — mas nada compara `req.params.userId` com
`req.outboundUser.id`. Qualquer vendedor autenticado do tenant lê as tarefas de qualquer
outro vendedor (saber "o que o colega X deve hoje" pode ser aceitável para gestor, mas a
rota não exige `requireManager` nem self-check — o painel `/tasks` já é `requireManager`,
então a intenção declarada não está implementada).

Correção sugerida: `if (req.params.userId !== req.outboundUser.id) return requireManager(...)`
ou aplicar `requireManager` na rota e manter self-service em outra rota.

### 2. `POST /leads/:id/tasks` e `PUT /tasks/:id` aceitam `userId` arbitrário do body

`user_id` é atribuído/re-atribuído sem validação: um vendedor pode criar tarefa "em nome" de
outro usuário (aparece no painel dele em `/users/:userId/tasks`) ou re-atribuir tarefa alheia
para si. Se a intenção é "responsável = quem criou", ignorar/forçar `userId =
req.outboundUser.id`; se reatribuição é feature, exigir `requireManager`.

### 3. (menor) `dueDate` não é validado

`due_date` aceita qualquer string do body (`dueDate || null`) — datas inválidas quebram o
`ORDER BY due_date ASC` dependendo do tipo da coluna. Validar ISO date.

## Arquivo(s) envolvido(s)

- `src/features/prospecting/outbound/server/routes/tasks.routes.ts` (linhas 37-74, 97-165,
  169-188, 192-211)
- `src/features/prospecting/outbound/server/auth.ts` (`req.outboundUser` — verificar campo
  de id do usuário para o self-check)

## Evidência

Leitura direta na branch `agente/45-crm-agenda-onda3` (baseline 32d07c375). Não executei o
servidor outbound; o gap de autorização é evidente na ausência de comparação
`params.userId` × sessão.

## Alteração necessária

Ver "Correção sugerida" acima. Manter `requireTenantScope`/JOIN em `leads.company` como está
(o isolamento por tenant via JOIN está correto e foi explicitamente corrigido antes — não
regridir).

## Teste esperado

- `GET /users/<outro-user>/tasks` com sessão de vendedor → 403.
- `POST /leads/:id/tasks` com `userId` de outro usuário → user_id gravado = usuário da
  sessão (ou 403, conforme decisão).
- `dueDate: 'lixo'` → 400.

## Contexto adicional

Este router usa SQLite próprio (`getDatabase`/`saveDatabase`) e tenant por string `company`
— modelo legado documentado no próprio arquivo (handoff 12→05 F2). Fora isso, os filtros de
tenant via JOIN estão corretos; os problemas são de autorização intra-tenant.

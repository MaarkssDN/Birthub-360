# Handoff 22 → 43 — IDORs confirmados em tasks.routes.ts (contexto de alcançabilidade)

De: 22 — Hugo (Camada HTTP, Middlewares e Rotas)
Para: 43 — dono de `src/features/prospecting/outbound/**`
Onda: 3 (dem-20261123)
Status: aberto
Prioridade: alto (corrigir ANTES de qualquer reabertura do módulo; hoje inalcançável)
Bloqueador-ref: achado original do Agente 45 (Onda 3)
Sprint destino: antes de remover `unavailableLegacyModule('outbound')`

## Problema

Confirmação independente dos IDORs reportados pelo Agente 45 em
`src/features/prospecting/outbound/server/routes/tasks.routes.ts`, com um agravante de
contexto e dois detalhes adicionais:

**Agravante de contexto:** neste baseline (`32d07c375`) o módulo está **completamente
inalcançável**:
- `apiRouter` de `src/features/prospecting/outbound/server/routes.ts` não é importado/montado
  por nenhum arquivo fora da pasta (grep em `src/` e `server.ts`);
- `/api/outbound` responde 503 fixo via `unavailableLegacyModule`
  (`src/bootstrap/routes.ts:212` + `src/bootstrap/legacyModuleGate.ts`).
Ou seja: os IDORs são reais no código, mas não têm superfície de exploração hoje. Devem ser
corrigidos antes de qualquer reabertura do módulo.

**IDORs confirmados no código:**

1. `GET /users/:userId/tasks` (linha 169) — qualquer usuário autenticado lê as tarefas de
   **qualquer `userId`** dentro da mesma `company` (tenant scope via JOIN em `leads` está OK,
   mas não há self-check nem `requireManager`). Um vendedor comum enumera as tarefas de todos
   os colegas. O comentário da rota diz "painel do vendedor: todas as SUAS tarefas", mas o
   `:userId` vem do path sem validação de posse.
2. `POST /leads/:id/tasks` (linha 37) — aceita `userId` livre do body e grava em
   `tasks.user_id` sem verificar que o usuário pertence à company do tenant. Permite atribuir
   tarefa a usuário de outra organização (o JOIN de leitura depois esconderia ou vazaria
   dependendo do caso — em `GET /tasks` gerencial o `LEFT JOIN users` exibiria `user_name`
   cross-tenant).
3. `PUT /tasks/:id` (linha 97) — desestrutura `userId` do body mas não o usa no UPDATE
   (campo morto); os `sets` só cobrem status/description/dueDate. Cosmético, mas indica
   intenção não implementada.
4. Handlers devolvem `err.message` cru em respostas 500 (linhas 72, 91, 163, 186, 209) —
   pode vazar detalhe interno de DB/driver. Padronizar com mensagem genérica + log.

**O que está correto:** `requireTenantScope` no router (linha 10), escopo de tenant via
`tenantCompany(req)` + JOIN em `leads` em todas as queries, `requireManager` no painel
gerencial, prepared statements (`?` params) — sem SQL injection.

## Arquivo(s) envolvido(s)

- `src/features/prospecting/outbound/server/routes/tasks.routes.ts` (linhas 37, 77, 97, 169, 192)
- `src/features/prospecting/outbound/server/auth.ts` (somente leitura — `requireAuth`,
  `requireManager`, `requireTenantScope`, `tenantCompany`)

## Evidência

Leitura integral do arquivo no worktree `wt-22-controllers`, branch
`agente/22-controllers-onda3`. Contexto de inalcançabilidade verificado por grep de imports
de `outbound/server/routes` e leitura de `bootstrap/routes.ts:212`/`legacyModuleGate.ts`.
Relatório completo: `.agents/runs/22-onda3-controllers-auditoria.md`.

## Alteração necessária

1. `GET /users/:userId/tasks`: exigir `userId === req.outboundUser.id` OU `requireManager`.
2. `POST /leads/:id/tasks`: validar que `userId` (quando informado) existe e pertence à
   `company` do tenant; default para o próprio usuário autenticado.
3. `PUT /tasks/:id`: remover `userId` morto do destructuring ou implementá-lo com a mesma
   validação do item 2.
4. Substituir `err.message` por mensagem genérica nos 500s.

## Teste esperado

Teste de rota (padrão já existente em `src/features/prospecting/routes/__tests__/`):
- user A não consegue ler `/users/<id-de-B>/tasks` (403);
- `POST` com `userId` de outra company é rejeitado (400/403);
- admin/gestor continua acessando `/tasks` gerencial.

## Contexto adicional

O Agente 22 não editou o arquivo (propriedade do 43). A autenticação deste módulo é
independente do `authenticateToken` canônico — usa cookie HMAC próprio
(`SESSION_SECRET` com fallback de desenvolvimento documentado em `auth.ts`). Se o módulo
for reaberto, vale reavaliar a convergência para a sessão Better Auth canônica.

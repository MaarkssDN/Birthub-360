# Handoff 05 → 01 — Débito de tenant no outbound legado (schema + decisão)

- **De:** 05 — Prospecção
- **Para:** 01 — Plataforma, Segurança e Dados
- **Onda:** Onda 1 (pós-PR #323)
- **Status:** em-andamento (item 1 entregue; item 2 aguarda decisão)
- **Prioridade:** alto (bloqueia reabertura do módulo `/api/outbound`)
- **Bloqueador-ref:** parecer 24 PR #323 (`.agents/reviews/24-review-pr323-tenant-scope-outbound.md`)
- **Sprint destino:** próxima onda de reabertura do outbound

## Problema

O router `/api/outbound` legado foi endurecido com `requireTenantScope` + filtros `company`
(hardening portado para `main` no PR deste handoff, branch `agente/05-handoffs-20261117`),
mas restavam dois débitos que exigiam schema ou decisão de modelo do Agente 01:

1. ~~**`chat_sessions` / `chat_messages` sem coluna de tenant nem de usuário**~~ —
   **RESOLVIDO**: migration `20261117230000_outbound_chat_tenant_company` (PR #381)
   adiciona `company TEXT` + índices; filtros propagados em `chat.routes.ts`
   (handoff `05-para-01-chat-sessions-sem-coluna-tenant.md` → resolvido).
   Linhas legadas `company IS NULL` ficam invisíveis (fail-closed).
2. **`POST /db/query` executa SQL arbitrário como `admin` sem escopo de tenant**
   (`system.routes.ts`) — decisão de modelo necessária: restringir a papel global
   explícito, exigir confirmação, ou aposentar a rota antes da reabertura do módulo.
   Comentário de débito já registrado no código.

## Arquivo(s) envolvido(s)

- `src/features/prospecting/outbound/server/routes/system.routes.ts` (`/db/query`)
- `prisma/schema.prisma` / `prisma/migrations/**` (somente Agente 01, se a decisão exigir)

## Evidência

- Parecer 24 PR #323, achados [MÉDIO] chat e decisão sobre `/db/query`.
- Módulo inteiro atrás de `unavailableLegacyModule('outbound')` → 503 em produção;
  nenhum consumidor frontend. Débitos são latentes, não exploráveis hoje.

## Alteração necessária

1. ~~Decidir e criar migration de tenant em `chat_sessions`/`chat_messages`~~ — feito (PR #381).
2. **Pendente:** decidir o destino de `POST /db/query` (restringir papel / confirmar / aposentar).
   Sem decisão, a rota segue `requireAdmin` — admin do módulo outbound é hoje
   single-tenant por desenho (`company` única na sessão), mas se o módulo um dia
   abrigar admins multi-tenant, a rota vira cross-tenant por definição.
3. Atualizar handoff `12-para-05-outbound-api-legado-tenancy.md` quando decidido.

## Teste esperado

- ~~Teste cross-tenant provando que sessões de company A não leem chats de company B~~ —
  implementado em `chat.routes.ts` (validação de `company` da sessão em todas as queries);
  cobertura de suíte em `tests/unit/features/prospecting/outbound/tenantScope.test.ts`.
- Decisão documentada sobre `/db/query` neste handoff.

## Contexto adicional

O restante dos gaps altos do parecer já foi corrigido e portado para `main`
(branch `agente/05-handoffs-20261117`): bypass de admin no `POST /prospect`,
`GET /search-runs/:id` com filtro de tenant, 404 em `users/:userId/leads`,
`requireTenantScope` global nas rotas de dados e coluna `company` no chat.
Cobertura em `tenantScope.test.ts` (16 testes).

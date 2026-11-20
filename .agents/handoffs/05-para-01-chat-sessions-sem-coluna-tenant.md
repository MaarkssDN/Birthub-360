De: Agente 05
Para: Agente 01
Onda: saneamento-handoffs-20261114
De: Agente 05
Para: Agente 01
Onda: saneamento-handoffs-20261114
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: parecer 24 Onda 1 — `.agents/reviews/onda1-handoffs-24-20261114.md` (ressalvas PR #323)
Sprint destino: Onda 3

## Problema

chat_sessions/chat_messages do outbound legado não têm coluna de tenant — qualquer autenticado lê chat de todos os tenants (LGPD).

## Arquivo(s) envolvido(s)

src/features/prospecting/outbound/** (schema do banco legado + rotas chat)

## Evidência

Parecer 24 `.agents/reviews/onda1-handoffs-24-20261114.md`, ressalva F1 do PR #323.

## Alteração necessária

Decidir: adicionar coluna company/tenant às tabelas de chat (migration é do 01) e propagar o filtro nas queries do chat.routes.ts (05).

## Teste esperado

Request autenticado company A não retorna sessões/mensagens de company B.

## Contexto adicional

Origem: follow-up do parecer do Agente 24 sobre PR #323 (tenant scope outbound legado).

## Resolução

**Agente 05 — 2026-11-17** (branch `agente/05-handoffs-20261117`)

- Schema: entregue pelo Agente 01 no PR #381 — migration `prisma/migrations/20261117230000_outbound_chat_tenant_company/migration.sql` (`company TEXT` nullable + índices em `chat_sessions`/`chat_messages`, `ALTER TABLE IF EXISTS`).
- Filtros (parte do 05, conforme handoff de retorno `01-para-05-chat-sessions-filtro-tenant-queries.md`): implementados em `src/features/prospecting/outbound/server/routes/chat.routes.ts` —
  - `POST /chat`: valida que `sessionId` pertence à `company` da sessão (404 cross-tenant, sem escrita); INSERTs gravam `company = tenantCompany(req)`; histórico filtra por `company`.
  - `GET /chat/sessions`: `WHERE LOWER(TRIM(COALESCE(s.company,''))) = ?` — linhas legadas `company IS NULL` ficam invisíveis (fail-closed).
  - `GET /chat/sessions/:id/messages`: valida a sessão (404 se outra company/inexistente) e filtra mensagens por `company`.
- Política NULL: fail-closed (recomendação do 01 aceita — linhas sem dono conhecido invisíveis).
- **Dependência de merge:** o código referencia a coluna `company`, que só existe após `prisma migrate deploy` da migration do PR #381. O módulo outbound segue montado fechado (503 via `unavailableLegacyModule`), então a ordem exigida é **PR #381 → este PR** antes de qualquer reabertura do módulo.
- Gates: `npx tsc --noEmit` ✓; `npm run lint` ✓ (0 diagnósticos nos arquivos alterados); `vitest run tenantScope.test.ts` 16/16 ✓ (suíte portada que cobre requireTenantScope/escopo; cenários específicos de chat dependem da coluna real — mock de db não exercita o SQL contra Postgres).
Prioridade: bloqueador
Bloqueador-ref: parecer 24 Onda 1 — `.agents/reviews/onda1-handoffs-24-20261114.md` (ressalvas PR #323)
Sprint destino: Onda 3

## Problema

chat_sessions/chat_messages do outbound legado não têm coluna de tenant — qualquer autenticado lê chat de todos os tenants (LGPD).

## Arquivo(s) envolvido(s)

src/features/prospecting/outbound/** (schema do banco legado + rotas chat)

## Evidência

Parecer 24 `.agents/reviews/onda1-handoffs-24-20261114.md`, ressalva F1 do PR #323.

## Alteração necessária

Decidir: adicionar coluna company/tenant às tabelas de chat (migration é do 01) e propagar o filtro nas queries do chat.routes.ts (05).

## Teste esperado

Request autenticado company A não retorna sessões/mensagens de company B.

## Contexto adicional

Origem: follow-up do parecer do Agente 24 sobre PR #323 (tenant scope outbound legado).

## Resolução

**Agente 05 — 2026-11-17** (branch `agente/05-handoffs-20261117`)

- Schema: entregue pelo Agente 01 no PR #381 — migration `prisma/migrations/20261117230000_outbound_chat_tenant_company/migration.sql` (`company TEXT` nullable + índices em `chat_sessions`/`chat_messages`, `ALTER TABLE IF EXISTS`).
- Filtros (parte do 05, conforme handoff de retorno `01-para-05-chat-sessions-filtro-tenant-queries.md`): implementados em `src/features/prospecting/outbound/server/routes/chat.routes.ts` —
  - `POST /chat`: valida que `sessionId` pertence à `company` da sessão (404 cross-tenant, sem escrita); INSERTs gravam `company = tenantCompany(req)`; histórico filtra por `company`.
  - `GET /chat/sessions`: `WHERE LOWER(TRIM(COALESCE(s.company,''))) = ?` — linhas legadas `company IS NULL` ficam invisíveis (fail-closed).
  - `GET /chat/sessions/:id/messages`: valida a sessão (404 se outra company/inexistente) e filtra mensagens por `company`.
- Política NULL: fail-closed (recomendação do 01 aceita — linhas sem dono conhecido invisíveis).
- **Dependência de merge:** o código referencia a coluna `company`, que só existe após `prisma migrate deploy` da migration do PR #381. O módulo outbound segue montado fechado (503 via `unavailableLegacyModule`), então a ordem exigida é **PR #381 → este PR** antes de qualquer reabertura do módulo.
- Gates: `npx tsc --noEmit` ✓; `npm run lint` ✓ (0 diagnósticos nos arquivos alterados); `vitest run tenantScope.test.ts` 16/16 ✓ (suíte portada que cobre requireTenantScope/escopo; cenários específicos de chat dependem da coluna real — mock de db não exercita o SQL contra Postgres).

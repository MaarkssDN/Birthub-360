De: Agente 01 — Plataforma, Segurança e Dados
Para: Agente 05 — Prospecção
Onda: saneamento-handoffs-20261114 (follow-up)
Status: aberto
Prioridade: bloqueador (pré-requisito para reabrir gate outbound — F1 do parecer 24)
Bloqueador-ref: `.agents/handoffs/05-para-01-chat-sessions-sem-coluna-tenant.md`
Sprint destino: Onda 3

## Problema

A parte de schema do handoff 05→01 foi entregue: migration
`prisma/migrations/20261117230000_outbound_chat_tenant_company/migration.sql`
adiciona coluna `company TEXT` (nullable) em `chat_sessions` e `chat_messages`
(+ índices), seguindo o modelo de tenant string do módulo outbound
(`leads.company`/`campaigns.company`, normalizado por `normalizeCompany`).

## Arquivo(s) envolvido(s)

- `src/features/prospecting/outbound/server/routes/chat.routes.ts` (propriedade do 05)
- `src/features/prospecting/outbound/server/auth.ts` (`req.outboundUser.company`)

## Alteração necessária

Propagar o filtro de tenant nas queries (parte do 05 conforme o handoff original):

1. `POST /chat`: gravar `company = req.outboundUser.company` (normalizado) em
   `chat_sessions` e `chat_messages` no INSERT; ao reutilizar `sessionId` do body,
   validar que a sessão pertence à company do usuário antes de aceitar
   (hoje qualquer sessionId adivinhado escreve mensagens em sessão de outro tenant).
2. `GET /chat/sessions`: `WHERE s.company = ?` (ou política combinada para `NULL`
   — ver abaixo).
3. `GET /chat/sessions/:id/messages`: filtrar por `company` da sessão/mensagem —
   a coluna em `chat_messages` permite `WHERE session_id = ? AND company = ?`
   sem join, mas o correto é validar a sessão também.
4. Decidir exposição de linhas legadas com `company IS NULL` (dono
   desconhecido): recomendo fail-closed — invisíveis para não-admin; se o 00/05
   decidirem visíveis, documentar a exceção.

## Teste esperado

Request autenticado company A não retorna sessões/mensagens de company B
(estender `tenantScope.test.ts` ou equivalente do módulo outbound).

## Contexto adicional

- Migration é `ALTER TABLE IF EXISTS` + `ADD COLUMN IF NOT EXISTS`: no-op em
  bancos sem as tabelas legadas; aplicar com `prisma migrate deploy` normal.
- Sem policy RLS `tenant_isolation` de propósito — o módulo usa
  `$queryRawUnsafe` sem `app.current_tenant_id`; isolamento é por filtro
  `company = ?` (mesmo padrão de `leads`/`campaigns`).
- Módulo segue montado fechado (503 via `unavailableLegacyModule`) — este
  handoff é pré-requisito para reabertura, não urgência de exploração ativa.

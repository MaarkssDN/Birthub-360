-- Migration: 20261117230000_outbound_chat_tenant_company
-- Demanda: handoff `.agents/handoffs/05-para-01-chat-sessions-sem-coluna-tenant.md`
-- (follow-up F1 do parecer 24 `.agents/reviews/onda1-handoffs-24-20261114.md`, PR #323)
-- Classificação (runbook docs/security/runbooks/MIGRATION_ROLLBACK.md): ADITIVA —
-- somente ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS. Nenhuma linha
-- existente é lida, alterada ou removida.
--
-- Contexto: `chat_sessions`/`chat_messages` são tabelas LEGADAS do módulo outbound
-- (`src/features/prospecting/outbound/server/routes/chat.routes.ts`), criadas
-- fora do ciclo de migrations do Prisma — por isso `ALTER TABLE IF EXISTS`:
-- em bancos onde as tabelas nunca foram provisionadas a migration é no-op em
-- vez de falhar o `migrate deploy`.
--
-- Decisão de modelagem: a coluna `company` segue o MESMO modelo de tenant do
-- restante do módulo outbound (`leads.company`, `campaigns.company`,
-- `users.company` — string normalizada por `normalizeCompany` em auth.routes.ts,
-- ex.: 'birthhub360'), NÃO o `organizationId` canônico das tabelas Prisma.
-- RLS `tenant_isolation` NÃO é aplicada aqui de propósito: o módulo acessa via
-- `prisma.$queryRawUnsafe` sem `runInTransaction`/`app.current_tenant_id`, e a
-- policy `current_setting(...)` em fail-closed quebraria todas as queries do
-- módulo. O isolamento é por filtro `company = ?` nas queries (responsabilidade
-- do Agente 05 em chat.routes.ts — handoff de retorno 01→05).
--
-- `company` em chat_messages é desnormalizada de propósito: a rota
-- `GET /chat/sessions/:id/messages` consulta mensagens direto por `session_id`
-- sem join — com a coluna, o filtro de tenant não depende de o caller lembrar
-- de validar a sessão antes.
--
-- Linhas pré-existentes ficam com `company = NULL` (dono desconhecido — não há
-- como inferir). Política de backfill/exposição fica a cargo do 05/00 na
-- reabertura do módulo (fail-closed recomendado: NULL invisível a não-admin).

ALTER TABLE IF EXISTS "chat_sessions"
  ADD COLUMN IF NOT EXISTS "company" TEXT;

ALTER TABLE IF EXISTS "chat_messages"
  ADD COLUMN IF NOT EXISTS "company" TEXT;

DO $$
BEGIN
  IF to_regclass('public.chat_sessions') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "chat_sessions_company_idx"
      ON "chat_sessions" ("company");
  END IF;
  IF to_regclass('public.chat_messages') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "chat_messages_company_idx"
      ON "chat_messages" ("company");
  END IF;
END
$$;

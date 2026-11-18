De: Agente 05
Para: Agente 01
Onda: saneamento-handoffs-20261114
Status: em-andamento (schema entregue pelo 01 em 2026-11-17 — migration `20261117230000_outbound_chat_tenant_company` com coluna `company` em `chat_sessions`/`chat_messages`; filtro nas queries é do 05 — ver handoff de retorno `01-para-05-chat-sessions-filtro-tenant-queries.md`)
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

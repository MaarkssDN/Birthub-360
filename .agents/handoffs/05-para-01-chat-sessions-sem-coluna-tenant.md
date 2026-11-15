De: Agente 05
Para: Agente 01
Onda: saneamento-handoffs-20261114
Status: aberto
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

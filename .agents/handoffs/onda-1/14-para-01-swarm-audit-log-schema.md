De: Agente 14 (Ambiente de Execução e Test Harness)
Para: Agente 01 (Plataforma, Segurança e Dados)
Onda: 1
Status: em-andamento (schema+migração implementados; aguardando parecer 09 e decisão humana de retenção)
Prioridade: alto
Bloqueador-ref: B-09/B-11 (erro visível sem causa tratada; funcionalidade de rota `/app/characters` quebrada)
Sprint destino: Onda 1

## Problema
`GET /api/agent/characters/activity` responde HTTP 500 para qualquer usuário autenticado (reproduzido, ADMIN de organização nova).
Causa raiz: `src/features/intelligence/services/swarmAudit.service.ts` usa `(prisma as unknown as { swarmAuditLog })`.
O model `SwarmAuditLog` NÃO existe em `prisma/schema.prisma` (0 ocorrências), nem em `prisma/migrations/**`,
nem no Prisma Client gerado. O delegate é `undefined` e `.findMany` lança TypeError. O mesmo defeito aparece
em `GET /api/agent/characters/:id` (campo `recentActivity`) e em `GET /api/agent/audit-logs`. É PRÉ-EXISTENTE:
`.agents/handoffs/onda-52/gha-para-01-typecheck-schema-prisma.md` já lista o TS2339 `swarmAuditLog` não existe.

## Arquivo(s) envolvido(s)
- `prisma/schema.prisma`, `prisma/migrations/**` (dono: 01) — model/tabela ausentes
- `src/features/intelligence/services/swarmAudit.service.ts` (dono: 07, ver handoff 14-para-07)

## Evidência
Reprodução 2026-11-19T22:53:37Z, `GET http://localhost:3114/api/agent/characters/activity`, status 500, corpo:
`{"success":false,"error":"Cannot read properties of undefined (reading 'findMany')","code":"INTERNAL_ERROR","retryable":true,"requestId":"8421e7e6-e123-4459-b0ce-7548930c9f76"}`
Stack do servidor: `TypeError ... at getSwarmAuditLogs (src/features/intelligence/services/swarmAudit.service.ts:127:27) at characterRuntime.routes.ts:64:35`.
Relatório completo: `.agents/runs/14-repro-500-404-agentes-20261119.md`.

## Alteração necessária
Decisão do 01 (com 07/21): (a) criar model `SwarmAuditLog` (id — chave primária única, ex.: `String @id @default(cuid())` —, organizationId, agentType, action, parameters Json, result,
errorMessage, userId, sessionId, correlationId, ipAddress, userAgent, createdAt) com migração, índice
(organizationId, createdAt) e RLS por tenant; ip/userAgent são dado pessoal (LGPD, definir retenção com 21/01A); ou
(b) declarar a auditoria fora do produto e avisar 07 para remover o serviço. Rodar `npx prisma generate`.

## Teste esperado
Teste de integração: ADMIN de org A grava um log, `GET /api/agent/characters/activity` retorna 200 com `logs` da org A;
usuário da org B recebe `logs: []` (acesso cruzado). Org nova sem logs retorna 200 `{logs:[],total:0}`.

## Contexto adicional
Não corrigi: schema pertence ao 01 (AGENTS.md §15). `/api/agent/characters` (lista) NÃO falha: retorna 200.

## Resolução (Agentes 11 Pietro / 12 Vera — branch agente/11-12-swarm-audit-log)
- IMPLEMENTADO: `model SwarmAuditLog` em `prisma/schema.prisma` (cuid, FK Organization onDelete Cascade, índice
  `(organizationId, createdAt)`); migração `20261120120000_swarm_audit_log` (CREATE TABLE/FK/INDEX + ENABLE/FORCE RLS
  + policy `tenant_isolation` no padrão da DSR). ADITIVA, tabela nova: zero downtime; deploy sem a migração
  continua com o 500 atual (B-05: rodar `prisma migrate deploy` antes/junto do código).
- Serviço: cast `as unknown as` removido; usa `prisma.swarmAuditLog` tipado (`parameters` com cast a `Prisma.InputJsonObject`).
- TESTADO: `prisma validate`, `prisma generate`, `npm run verify:rls-coverage` (OK, 138 tabelas), `tsc --noEmit` (sem erros),
  `biome format src` (limpo), vitest characters + intelligence/routes (140 passed).
- NÃO EXECUTADO: aplicação da migração em Postgres e teste de acesso cruzado A/B (sem banco em localhost:5434);
  teste de integração pedido neste handoff.
- DECISÃO HUMANA (LGPD): `ipAddress`/`userAgent` são dado pessoal. Proposta (não decidida): reter 90 dias e depois
  anonimizar (null) os dois campos, mantendo o restante do log; execução pelo 15 (Olavo), base legal/finalidade
  (segurança/auditoria) a confirmar pelo 07 (Íris). Sem job de expurgo hoje; registrar no inventário do 21.
- Handoffs: 07 (Íris) e 15 (Olavo) — retenção; 14 — escrever o teste de integração A/B quando houver banco.

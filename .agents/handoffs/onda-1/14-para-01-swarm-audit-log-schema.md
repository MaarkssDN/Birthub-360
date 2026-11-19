De: Agente 14 (Ambiente de Execução e Test Harness)
Para: Agente 01 (Plataforma, Segurança e Dados)
Onda: 1
Status: aberto
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
Decisão do 01 (com 07/21): (a) criar model `SwarmAuditLog` (organizationId, agentType, action, parameters Json, result,
errorMessage, userId, sessionId, correlationId, ipAddress, userAgent, createdAt) com migração, índice
(organizationId, createdAt) e RLS por tenant; ip/userAgent são dado pessoal (LGPD, definir retenção com 21/01A); ou
(b) declarar a auditoria fora do produto e avisar 07 para remover o serviço. Rodar `npx prisma generate`.

## Teste esperado
Teste de integração: ADMIN de org A grava um log, `GET /api/agent/characters/activity` retorna 200 com `logs` da org A;
usuário da org B recebe `logs: []` (acesso cruzado). Org nova sem logs retorna 200 `{logs:[],total:0}`.

## Contexto adicional
Não corrigi: schema pertence ao 01 (AGENTS.md §15). `/api/agent/characters` (lista) NÃO falha: retorna 200.

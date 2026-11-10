De: 00 — Coordenador
Para: 01A — Confiabilidade de Dados, RLS e Retenção
Onda: paralela-8
Status: aberto
Prioridade: alto (tenancy/LGPD)

## Problema
Auditar isolamento multi-tenant no escopo `src/features/crm/**` e `src/features/crm360/**`: queries Prisma que tocam modelos com `organizationId` sem filtro/escopo de tenant, ou uso de client Prisma sem contexto de tenant.

## Evidência
AGENTS.md exige preservação de RBAC, RLS e isolamento por `organizationId`. Não há evidência prévia de leak nesses módulos — a missão é produzir prova ou correção.

## Alteração necessária
1. Mapear modelos tenant-scoped usados nos dois módulos.
2. Verificar cada query: `where` contém `organizationId`/tenant context ou o repositório injeta escopo centralizado.
3. Corrigir APENAS gaps comprovados (vazamento real possível). Se o padrão for escopo centralizado correto, documentar a evidência e não alterar código.

## Teste esperado
`npx tsc --noEmit` limpo; testes do módulo executados (`vitest run -c vitest.unit.config.ts` com filtro do diretório); relatório com tabela de queries auditadas.

## Contexto
Worktree: `.claude/worktrees/ag-01a`, branch `agente/01a-tenancy-audit`. Não alterar `prisma/schema.prisma` nem migrations — se faltar policy/coluna, abrir handoff para 01.

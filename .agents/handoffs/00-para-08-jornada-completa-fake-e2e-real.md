# Handoff — "Jornada completa" E2E/integration é tautológica (falsa cobertura)

De: 00 — Coordenador
Para: 08 — QA e Release
Onda: pós-homologação 2026-11-10
Status: aberto
Prioridade: alto
Sprint destino: próximo ciclo de QA

## Problema

Dois arquivos prometem "Jornada Comercial Completa Ponta a Ponta
(Lead → Deal → Proposta → Faturamento) sem dados simulados", mas são
**100% tautológicos**: instanciam objetos literais em memória e fazem
`expect` nos próprios valores. Nenhuma API, banco, fila ou browser é tocado.

- `tests/integration/completeCustomerJourney.integration.test.ts`
- `tests/e2e/completeCustomerJourney.e2e.test.ts`

Isso viola o princípio do projeto ("não aprovar funcionalidade sem
evidência") e cria falsa sensação de cobertura da jornada comercial —
exatamente o tipo de teste que a missão pós-homologação pedia e que
**não existe de verdade**.

## Evidência

Leitura integral dos dois arquivos (2026-11-10): `const lead = {...}` →
`expect(lead.id).toBeDefined()` etc. O e2e usa `@playwright/test` mas
nenhum `page.goto`/`request` — é um teste unitário disfarçado.

## Alteração necessária

1. **Reescrever** como jornada real (preferível):
   seed isolado em `prospectordb_test` → prospecção/promote → lead no
   kanban → movimentação de etapa → proposta → forecast reflete →
   automação dispara → indicadores atualizam; asserts por etapa + reload +
   permissão negativa. Usar `tests/helpers/factories` existentes e o
   harness de `tests/AGENTS.md`.
2. Alternativa mínima honesta: renomear/remover os arquivos e criar
   tracking da jornada real — mas a jornada real é o entregável que a
   missão exige (FASE 4 reprovada por ausência).

## Teste esperado

- Novo spec falha se qualquer elo da cadeia quebrar (ex.: remover o
  promote e verificar que o lead não aparece no CRM).
- Execução real registrada em `.agents/runs/`.

## Contexto adicional

- Blocos individuais já têm testes reais: `leads.test.ts` (Prisma),
  `rbac-e2e-crm-*.test.ts`, `prospecting-rls.test.ts`, specs de onda
  01–05 em `tests/integration/onda-0*/`.
- A cadeia cross-módulo documentada na matriz:
  `.agents/runs/2026-11-10-pos-homologacao-relatorio-00.md` §FASE 3.
- Dependência: ambiente de teste precisa do handoff
  `00-para-14-env-test-migrator-e-redis-compartilhado.md` resolvido
  (credencial migrator) para suites de integração completas.

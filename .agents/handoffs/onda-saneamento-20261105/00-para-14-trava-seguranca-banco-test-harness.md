De: 00 — Coordenador
Para: 14 — Ambiente de Execução e Test Harness
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-14-001
Sprint destino: Onda 2 — Runtime, Workers e Infraestrutura

## Problema
Script prepare-integration-env.js roda prisma migrate reset sem verificar se a porta conectada é o PostgreSQL padrão de produção (5432) ou banco protegido.

## Arquivo(s) envolvido(s)
- scripts/test/prepare-integration-env.js:40-75

## Evidência
Base de auditoria: DIVIDAS-AGENTE-14.md.
- scripts/test/prepare-integration-env.js (L40-75): Executa drop de banco se TEST_DATABASE_URL estiver mal configurada ou apontando para instância real por engano.
- Causa Raiz: Falta de trava de segurança estrita checando nome do banco com sufixo _test e ambiente NODE_ENV === 'test'.

## Alteração necessária
1. Inserir asserção obrigatória em prepare-integration-env.js validando: database name termina com _test, host não é endpoint de produção (rds/aws) e NODE_ENV === 'test'.
2. Se qualquer condição falhar, abortar com erro fatal antes de qualquer comando destrutivo.

## Teste esperado
- Critério de Aceite: Script recusa execução se DATABASE_URL apontar para banco sem sufixo _test.
- Teste: test-harness-safety.spec.ts.

## Contexto adicional
Proteção contra perda de dados acidental em ambientes de teste.

## Resolução (Onda 2 — 2026-11-06)
- Implementada e exportada a função `assertTestDatabaseSafety` (e `parseDotEnvContent`) em `scripts/test/prepare-integration-env.js`, invocada antes de qualquer operação de container ou banco.
- A trava aborta imediatamente quando `NODE_ENV !== 'test'`, quando o database em `DATABASE_URL`, `DIRECT_URL` ou `TEST_DATABASE_URL` não termina com `_test`, ou quando o hostname coincide com endpoints gerenciados de produção (AWS RDS, Supabase, Neon, Azure Database, CloudSQL).
- Validado por `tests/unit/scripts/test-harness-safety.test.ts` (6/6 PASS).

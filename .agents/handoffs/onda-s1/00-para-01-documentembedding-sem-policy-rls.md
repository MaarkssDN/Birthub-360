De: 00 (Coordenador) — Etapa S1 (auditoria RLS)
Para: 01 (Plataforma, Segurança e Dados)
Onda: S1 (trilha técnica subordinada à Fase 02)
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: B-10
Sprint destino: próxima

## Problema
`"DocumentEmbedding"` tem `ENABLE` + `FORCE ROW LEVEL SECURITY`, mas nenhuma `CREATE POLICY` em nenhuma migration. Com `FORCE` e papel `NOBYPASSRLS`, todo acesso do app é default-deny (leitura/escrita falham ou retornam vazio).

## Arquivo(s) envolvido(s)
- `prisma/migrations/20260928130000_add_missing_rls_for_new_tables/migration.sql` (L1–2: só ENABLE/FORCE)
- `prisma/schema.prisma` L4684 (`model DocumentEmbedding`: usa coluna `tenantId`, não `organizationId`)

## Evidência
`npx vitest run -c vitest.unit.config.ts tests/unit/db/rls-coverage.test.ts` agora falha em
"garante que 100% das tabelas possuem pelo menos uma CREATE POLICY": `DocumentEmbedding`.
(O teste antes passava por um `if` vazio — corrigido na mesma onda; também corrigidos falsos positivos de `Birthub360CallResult` (rename), `Integration` e `Plan` (nomes de policy com espaço).)

## Alteração necessária
Nova migration (Agente 01) com `CREATE POLICY` para `"DocumentEmbedding"` seguindo o padrão `tenant_isolation` das demais tabelas, usando `"tenantId"` e `current_setting('app.current_tenant_id', true)`. Confirmar antes se `tenantId` guarda o mesmo valor de `organizationId`. Sem backfill de dados.

## Teste esperado
- `rls-coverage.test.ts` verde (6/6).
- Teste de integração: tenant A não lê/escreve embedding do tenant B; tenant A lê o próprio.

## Contexto adicional
Testes de integração (Postgres :5434) não puderam rodar localmente: infra desligada.

## Resolução

A policy `tenant_isolation` já estava na main, na migration
`20261110120000_document_embedding_rls_policy` (`USING ("tenantId" = current_setting('app.current_tenant_id', true))`).
Nenhuma migration nova foi necessária (e a migration já aplicada não foi alterada).

O que faltava — e este PR adiciona — é o teste de integração
`tests/integration/document-embedding-rls.test.ts`, no padrão de `ailog-rls.test.ts`:

- tenant A lê o próprio embedding e **não** lê o do tenant B (nem por `findMany` nem por `findUnique` no id);
- INSERT de A com `tenantId` de B é rejeitado e nada é persistido;
- UPDATE e DELETE de A sobre o embedding de B são rejeitados; o registro de B permanece intacto;
- tenant A consegue atualizar o próprio embedding.

`DocumentEmbedding` usa `tenantId` (não `organizationId`) e não está em `TENANT_INJECTED_MODELS`:
o isolamento observado só pode vir da policy RLS do Postgres.

Teste de cobertura estática `tests/unit/db/rls-coverage.test.ts` deve permanecer verde (policy já versionada).
Testes de integração com Postgres não rodaram neste ambiente (`docker: command not found`; portas 5434/5432 fechadas).

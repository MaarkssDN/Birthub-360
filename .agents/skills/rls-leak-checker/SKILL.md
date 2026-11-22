---
name: rls-leak-checker
description: Auditoria de vazamento de dados entre organizações (Row-Level Security e Tenancy) no PostgreSQL e Prisma. Garante isolamento estrito de tenantId/organizationId em todas as queries e rotas da API.
---

# RLS Leak Checker — Birth Hub 360

## Objetivo
Prevenir o bloqueador crítico **B-10** ("Separação visual sem isolamento real de dados"). Assegurar que nenhum tenant consiga ler, atualizar ou apagar registros de outro tenant em nenhum endpoint.

## Princípios de Isolamento

### 1. Duplo Nível de Proteção
1. **No Código (Prisma Client + `tenantScopingExtension` em `src/lib/prisma.ts`):** Toda query em modelos com `organizationId` deve incluir explicitamente `where: { organizationId: session.organizationId, ... }`.
2. **No Banco (PostgreSQL RLS):** Todas as tabelas do schema possuem `ENABLE ROW LEVEL SECURITY` e `FORCE ROW LEVEL SECURITY`, reforçando o isolamento via variável de sessão `current_setting('app.current_tenant_id', true)` sob papel `NOSUPERUSER` e `NOBYPASSRLS` (verificado por `src/bootstrap/dbRoleCheck.ts` e `scripts/db/bootstrap-app-role.sh`).

### 2. Regras de Inspeção de Código
- **`findMany` / `findFirst`:** Nunca faça busca sem o filtro de organização, a não ser em entidades comprovadamente globais do sistema (`GLOBAL_CATALOG` em `tests/unit/db/rls-coverage.test.ts`).
- **`findUnique` e Relações Seguras:** `@@unique([id, organizationId])` **não garante isolamento sozinho**. `findUnique({ where: { id } })` continua acessível se a policy RLS não estiver ativa ou se houver bypass. Exigir políticas RLS ativas no banco (`ENABLE` + `FORCE ROW LEVEL SECURITY` + `CREATE POLICY`), uso de `findFirst({ where: { id, organizationId } })` ou validação explícita de posse do tenant, e chaves estrangeiras compostas para impedir relações cruzadas (*cross-tenant FK linking*).
- **`update` / `delete`:** Use `updateMany` / `deleteMany` com `organizationId` no `where` ou verifique posse do registro dentro da mesma transação com contexto RLS ativo para evitar IDOR.
- **`$queryRaw` / `$executeRaw`:** Sempre filtre pela coluna `"organizationId"` (camelCase entre aspas duplas no PostgreSQL) ou confie apenas em transações que já executaram `set_config('app.current_tenant_id', organizationId, true)`.

### 3. Governança de `bypassRls`
- O bypass de RLS é controlado em `src/lib/prisma.ts` via `BYPASS_RLS_ALLOWED_MODELS` (restrito em produção aos 15 modelos estritamente necessários para autenticação, resolução de sessão, links públicos e webhooks antes da resolução do tenant, como em `src/shared/middlewares/authenticateToken.ts`).
- `bypassRls: true` é **bloqueado** dentro de `runInTransaction` e dentro do Outbox UoW (`src/lib/queue/outbox/tenantGuard.ts`).
- Qualquer uso de `bypassRls` fora dos fluxos de bootstrap/autenticação ou sem revalidação posterior do `organizationId` deve ser tratado como falha grave de segurança.

## Checklist de Testes Multi-Tenant
- [ ] `npx vitest run -c vitest.unit.config.ts tests/unit/db/rls-coverage.test.ts tests/unit/bootstrap/dbRoleCheck.test.ts tests/unit/lib/tenant-scoping-parity.test.ts` passa 100% verde.
- [ ] Toda tabela possui `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY` e pelo menos uma `CREATE POLICY` válida nas migrations.
- [ ] Teste unitário/integração simulando Tenant A tentando acessar recurso do Tenant B via ID direto retorna 404 ou 403.
- [ ] Teste de contagem (`count`) não revela total agregado de outros tenants.

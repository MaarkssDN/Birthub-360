---
name: rls-leak-checker
description: Auditoria de vazamento de dados entre organizações (Row-Level Security e Tenancy) no PostgreSQL e Prisma. Garante isolamento estrito de tenantId/organizationId em todas as queries e rotas da API.
---

# RLS Leak Checker — Birth Hub 360

## Objetivo
Prevenir o bloqueador crítico **B-10** ("Separação visual sem isolamento real de dados"). Assegurar que nenhum tenant consiga ler, atualizar ou apagar registros de outro tenant em nenhum endpoint.

## Princípios de Isolamento

### 1. Duplo Nível de Proteção
1. **No Código (Prisma Client):** Toda query em modelos com `organizationId` deve incluir explicitamente `where: { organizationId: session.organizationId, ... }`.
2. **No Banco (PostgreSQL RLS):** Políticas RLS ativas reforçam o isolamento via papel `NOSUPERUSER` mesmo se o desenvolvedor esquecer a cláusula no ORM.

### 2. Regras de Inspeção de Código
- **`findMany` / `findFirst`:** Nunca faça busca sem o filtro de organização, a não ser em entidades comprovadamente globais do sistema.
- **`findUnique`:** Atenção redobrada. `findUnique({ where: { id } })` não filtra por tenant nativamente caso o `id` seja chave primária simples. Utilize índices compostos únicos (`@@unique([id, organizationId])`) ou mude para `findFirst({ where: { id, organizationId } })`.
- **`update` / `delete`:** Use `updateMany` ou verifique posse do registro antes de mutações diretas por ID para evitar ataque de enumeração de ID (IDOR).
- **`$queryRaw` / `$executeRaw`:** Sempre inclua o parâmetro `organization_id` sanitizado.

### 3. Bypass de RLS
- O único bypass legítimo aceito ocorre na autenticação inicial (`authenticateToken.ts` / `requestContext.run({ bypassRls: true })`), antes de o tenant do usuário ser identificado.
- Qualquer outro uso de bypass deve ser tratado como falha grave de segurança.

## Checklist de Testes Multi-Tenant
- [ ] Teste unitário/integração simulando Tenant A tentando acessar recurso do Tenant B via ID direto (deve retornar 404 ou 403).
- [ ] Teste de contagem (`count`) não revela total agregado de outros tenants.
- [ ] Seeds de teste possuem pelo menos 2 organizações distintas para validar cruzamento.

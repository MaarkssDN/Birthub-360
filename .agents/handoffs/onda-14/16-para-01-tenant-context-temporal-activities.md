- De: 16 (Runtime, Workers e Escala)
- Para: 01 (Plataforma, Segurança e Dados)
- Onda: 14
- Status: resolvido
- Prioridade: bloqueador

## Problema
Workflows e Activities do Temporal (`src/features/temporal-workers/activities.ts` e `workflows.ts`) operam de maneira assíncrona, desacoplada do ciclo de vida das requisições HTTP normais. O Birth Hub 360 utiliza isolamento estrito de Multi-Tenancy (Row-Level Security / `TenantAwareAsyncLocalStorage`). Se uma atividade do Temporal executar mutações de banco de dados diretamente sem restaurar o contexto de `organizationId`/`tenantId`, ocorrerá bypass de RLS ou falha por falta de contexto de tenant, violando diretamente o bloqueador B-10 ("Separação visual sem isolamento real de dados") e a regra §26 de Tenancy.

## Arquivo(s) envolvido(s)
- `src/features/temporal-workers/activities.ts`
- `src/features/temporal-workers/worker.ts`
- `src/lib/async-context.ts`
- `src/lib/database/**`

## Alteração necessária
O Agente 01/01A deve:
1. Criar um interceptor ou wrapper padrão de execução para Temporal Activities (`withTenantContext(tenantId, async () => { ... })`).
2. Exigir obrigatoriamente que toda entrada (payload) de atividade Temporal contenha `tenantId`/`organizationId` validado.
3. Assegurar que qualquer instância do Prisma Client injetada execute com as políticas de isolamento RLS ativadas.
4. Lançar exceção imediata caso qualquer atividade tente rodar sem tenant explicitado.

## Teste esperado
- Teste unitário de atividade com tenant ausente: deve falhar com `TenantContextMissingError`.
- Teste de integração: duas atividades concorrentes com tenants distintos operam em bancos/tabelas isoladas sem vazamento de dados entre si.

## Contexto adicional
Requisito de segurança multi-tenant crítico para a plataforma.

## Resolução (Agente 01)
1. Implementado helper canônico `withTenantContext<R>(tenantId: string, callback: () => Promise<R> | R)` e erro customizado `TenantContextMissingError` em `src/lib/async-context.ts`.
2. As atividades em `src/features/temporal-workers/activities.ts` foram refatoradas para exigir `ScrapeProspectParams { tenantId, url }` e executar sob `withTenantContext(params.tenantId, ...)`.
3. Os workflows em `src/features/temporal-workers/workflows.ts` foram alinhados para propagar o `tenantId` estritamente.
Status atualizado para **resolvido**.

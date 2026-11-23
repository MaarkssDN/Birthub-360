import { requestContext } from './async-context.js';
import { prisma } from './prisma.js';
import { MODELS_WITH_ORGANIZATION_ID } from './tenant-scoping-registry.js';

export { MODELS_WITH_ORGANIZATION_ID };

/**
 * Retorna uma instância do Prisma Client estendida para garantir o Row-Level Security (RLS)
 * a nível de aplicação e propagar o contexto de tenant para a camada de banco (`SET LOCAL
 * app.current_tenant_id` em `src/lib/prisma.ts`). Todas as operações de leitura e escrita
 * interceptadas por esta extensão injetam e validam o `organizationId` nos modelos que possuem
 * essa coluna e garantem que o `requestContext` ativo reflita o mesmo tenant com `bypassRls: false`.
 *
 * @param organizationId - ID do locatário atual
 */
export function getTenantPrisma(organizationId: string) {
  const normalizedOrgId = typeof organizationId === 'string' ? organizationId.trim() : '';
  if (!normalizedOrgId) {
    throw new Error('Tenant Prisma initialization requires a valid organizationId');
  }

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const runWithTenantContext = () => {
            const currentStore = requestContext.getStore();
            if (currentStore?.tenantId === normalizedOrgId && !currentStore.bypassRls) {
              return query(args);
            }
            return requestContext.run(
              {
                ...(currentStore ?? {}),
                tenantId: normalizedOrgId,
                bypassRls: false,
              },
              () => query(args),
            );
          };

          if (!MODELS_WITH_ORGANIZATION_ID.has(model)) {
            return runWithTenantContext();
          }

          // Se a operação for find/update/delete/aggregate/groupBy, precisamos forçar o organizationId no where
          if (
            operation === 'findUnique' ||
            operation === 'findUniqueOrThrow' ||
            operation === 'findFirst' ||
            operation === 'findFirstOrThrow' ||
            operation === 'findMany' ||
            operation === 'count' ||
            operation === 'aggregate' ||
            operation === 'groupBy' ||
            operation === 'update' ||
            operation === 'updateMany' ||
            operation === 'delete' ||
            operation === 'deleteMany'
          ) {
            args.where = {
              ...(args.where || {}),
              organizationId: normalizedOrgId,
            };
          }

          // Se a operação for de criação (create), precisamos forçar a injeção do organizationId nos dados
          if (operation === 'create') {
            const createData = args.data as Record<string, unknown>;
            args.data = {
              ...createData,
              organizationId: normalizedOrgId,
            } as typeof args.data;
          }

          // Se for createMany/createManyAndReturn, iterar para garantir o organizationId
          if (
            (operation === 'createMany' || operation === 'createManyAndReturn') &&
            Array.isArray(args.data)
          ) {
            const createManyData = args.data as Array<Record<string, unknown>>;
            args.data = createManyData.map((item) => ({
              ...item,
              organizationId: normalizedOrgId,
            })) as typeof args.data;
          }

          // Se for upsert, garantir organizationId no create e no where, e blindar o update
          if (operation === 'upsert') {
            const a = args as Record<string, unknown>;
            if (a.create) {
              a.create = {
                ...(a.create as Record<string, unknown>),
                organizationId: normalizedOrgId,
              };
            }
            if (a.where) {
              a.where = {
                ...(a.where as Record<string, unknown>),
                organizationId: normalizedOrgId,
              };
            }
            if (a.update && typeof a.update === 'object' && 'organizationId' in a.update) {
              // biome-ignore lint/performance/noDelete: remoção obrigatória para segurança multi-tenant
              delete (a.update as Record<string, unknown>).organizationId;
            }
          }

          // Em update e updateMany, garantir que organizationId nunca possa ser alterado no payload
          if (operation === 'update' || operation === 'updateMany') {
            const a = args as Record<string, unknown>;
            if (a.data && typeof a.data === 'object' && 'organizationId' in a.data) {
              // biome-ignore lint/performance/noDelete: remoção obrigatória para segurança multi-tenant
              delete (a.data as Record<string, unknown>).organizationId;
            }
          }

          return runWithTenantContext();
        },
      },
    },
  });
}

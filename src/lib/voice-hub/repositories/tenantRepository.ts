import { prisma } from '@/lib/prisma.js';

// Voice-hub "tenant" == canonical `Organization` (Better Auth identity model — ver decisão de
// estratégia em .agents/handoffs/01-para-12-voicehub-adaptacao-modelos-canonicos.md). Não existe
// `Tenant`/`deletedAt` no schema canônico: `Organization` é a entidade de tenancy e a remoção de
// uma organização é hard delete governado, não soft-delete por flag.
//
// Os nomes de função (`*Tenant*`) foram mantidos para não quebrar os call sites existentes
// (organization.controller, slaScheduler, authService) — semanticamente todos operam sobre
// `prisma.organization`.

export function createTenant(name: string) {
  return prisma.organization.create({ data: { name } });
}

export function findTenantById(id: string) {
  return prisma.organization.findUnique({ where: { id } });
}

// Used by `src/services/slaScheduler.ts` to fan out one `platform_ready_check` Metric row per
// active tenant on every periodic readiness sample — `Metric.organizationId` is a required FK to
// `Organization` (see prisma/schema.prisma), so a platform-wide event with no tenant cannot be
// persisted there directly; this returns only the ids of organizations that still have a real row
// to attach to.
export async function listActiveTenantIds(): Promise<string[]> {
  const organizations = await prisma.organization.findMany({
    select: { id: true },
  });
  return organizations.map((o) => o.id);
}

import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { requestContext } from '../src/lib/async-context.js';

const FORBIDDEN_PRODUCTION_HOST_PATTERNS = [
  /\.rds\.amazonaws\.com$/i,
  /\.supabase\.co$/i,
  /\.pooler\.supabase\.com$/i,
  /\.neon\.tech$/i,
  /\.postgres\.database\.azure\.com$/i,
  /\.gcp\.cloudsql/i,
  /^prod[-.]/i,
  /\.prod\./i,
];

/**
 * Trava obrigatória B-06 (Agente 14 — Bia):
 * Impede que dados sintéticos ([DEMO-SYNTHETIC]) sejam inseridos em ambiente produtivo
 * ou em hosts gerenciados de produção.
 */
export function assertSeedEnvironmentSafe(
  envVars: Record<string, string | undefined> = process.env,
): void {
  const nodeEnv = (envVars.NODE_ENV ?? '').trim().toLowerCase();
  if (nodeEnv === 'production') {
    throw new Error(
      '[SeedSafety/B-06] Execução abortada: prisma/seed.ts não pode ser executado com NODE_ENV=production.',
    );
  }

  for (const key of ['DATABASE_URL', 'DIRECT_URL'] as const) {
    const rawUrl = envVars[key];
    if (!rawUrl) continue;
    let hostname = '';
    try {
      hostname = new URL(rawUrl).hostname.toLowerCase();
    } catch {
      continue;
    }
    if (FORBIDDEN_PRODUCTION_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) {
      throw new Error(
        `[SeedSafety/B-06] Execução abortada: ${key} aponta para host produtivo/gerenciado proibido ("${hostname}").`,
      );
    }
  }
}

/**
 * Seed Canônico de Banco de Dados — Agente 14 (Bia)
 *
 * Princípios de Isolamento e Segurança (B-06):
 * - Bloqueia execução em produção (NODE_ENV=production ou host gerenciado/produtivo).
 * - Usa geradores UUID v4 randômicos para organização e IDs de entidades (zero ID estático que colida em ambientes reais).
 * - Marca claramente dados sintéticos com prefixos rastreáveis ([DEMO-SYNTHETIC]).
 * - Garante isolamento estrito de tenantId e contexto RLS em todas as relações inseridas.
 */
export async function runIsolatedSeed(db: PrismaClient) {
  assertSeedEnvironmentSafe();

  const seedRunId = randomUUID().slice(0, 8);
  const organizationId = randomUUID();
  const orgName = `Demo Organization ${seedRunId}`;

  const org = await requestContext.run({ bypassRls: true }, () =>
    db.organization.create({
      data: {
        id: organizationId,
        name: orgName,
      },
    }),
  );

  return requestContext.run({ tenantId: org.id }, async () => {
    const adminUserId = randomUUID();
    const adminEmail = `admin-${seedRunId}@demo.birthhub360.internal`;

    const adminUser = await db.user.create({
      data: {
        id: adminUserId,
        name: `Admin Demo ${seedRunId}`,
        email: adminEmail,
        role: 'ADMIN',
        organizationId: org.id,
        passwordHash: '$2b$10$wE1.DummyHashForSeedOnlyIsolatedEnvironment0000000',
      },
    });

    const companyId = randomUUID();
    const company = await db.company.create({
      data: {
        id: companyId,
        organizationId: org.id,
        legalName: `[DEMO-SYNTHETIC] Clínica Santa Helena ${seedRunId} Ltda`,
        tradeName: `Clínica Santa Helena ${seedRunId}`,
        status: 'Ativo',
      },
    });

    const contactId = randomUUID();
    const contact = await db.contact.create({
      data: {
        id: contactId,
        organizationId: org.id,
        companyId: company.id,
        name: `Dr. Roberto Demo ${seedRunId}`,
        role: 'Diretor Clínico',
        email: `roberto-${seedRunId}@clinicasantahelena.internal`,
        phone: '+5511999990000',
      },
    });

    const leadId = randomUUID();
    const lead = await db.lead.create({
      data: {
        id: leadId,
        organizationId: org.id,
        companyId: company.id,
        contactId: contact.id,
        title: `[DEMO-SYNTHETIC] Oportunidade Expansão Maternidade ${seedRunId}`,
        status: 'Nova_Oportunidade',
        amount: 45000,
        probability: 60,
      },
    });

    return {
      organization: org,
      adminUser,
      company,
      contact,
      lead,
    };
  });
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  try {
    assertSeedEnvironmentSafe();
  } catch (err) {
    console.error('❌ Erro durante execução do seed:', err);
    process.exit(1);
  }
  import('../src/lib/prisma.js')
    .then(async ({ prisma }) => {
      const res = await runIsolatedSeed(prisma as unknown as PrismaClient);
      console.log(`✅ Seed isolado concluído com sucesso para org: ${res.organization.id}`);
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Erro durante execução do seed:', err);
      process.exit(1);
    });
}

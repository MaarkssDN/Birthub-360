import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';

/**
 * Seed Canônico de Banco de Dados — Agente 14 (Bia)
 *
 * Princípios de Isolamento e Segurança (B-06):
 * - Usa geradores UUID v4 randômicos para organização e IDs de entidades (zero ID estático que colida em ambientes reais).
 * - Marca claramente dados sintéticos com prefixos rastreáveis ([DEMO-SYNTHETIC]).
 * - Garante isolamento estrito de tenantId em todas as relações inseridas.
 */
export async function runIsolatedSeed(db: PrismaClient) {
  const seedRunId = randomUUID().slice(0, 8);
  const organizationId = randomUUID();
  const orgName = `Demo Organization ${seedRunId}`;

  const org = await db.organization.create({
    data: {
      id: organizationId,
      name: orgName,
    },
  });

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
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
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

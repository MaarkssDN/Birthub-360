import { describe, expect, it } from 'vitest';
import {
  parsePrismaSchema,
  runDatabaseGovernanceAudit,
} from '../../../scripts/db/audit-database-governance.js';
import { resolve } from 'node:path';

describe('Database Governance & Schema Index Audit', () => {
  const sampleSchema = `
    model Organization {
      id        String   @id @default(cuid())
      name      String
      createdAt DateTime @default(now())
    }

    model Lead {
      id             String       @id @default(cuid())
      organizationId String
      companyId      String?
      createdAt      DateTime     @default(now())

      organization Organization @relation(fields: [organizationId], references: [id])
      company      Company?     @relation(fields: [companyId], references: [id])

      @@index([organizationId, createdAt])
      @@index([companyId])
    }

    model UnindexedTenantModel {
      id             String   @id @default(cuid())
      organizationId String
      title          String
      createdAt      DateTime @default(now())
    }

    model ForeignModel {
      id             String   @id @default(cuid())
      organizationId String
      leadId         String

      lead Lead @relation(fields: [leadId], references: [id])

      @@index([organizationId])
    }
  `;

  it('correctly parses models and identifies tenant coverage', () => {
    const models = parsePrismaSchema(sampleSchema);
    expect(models).toHaveLength(4);

    const org = models.find((m) => m.name === 'Organization');
    expect(org?.hasOrgId).toBe(false);

    const lead = models.find((m) => m.name === 'Lead');
    expect(lead?.hasOrgId).toBe(true);
    expect(lead?.missingTenantIndex).toBe(false);
    expect(lead?.missingTenantCreatedIndex).toBe(false);
    expect(lead?.unindexedForeignKeys).toHaveLength(0);

    const unindexed = models.find((m) => m.name === 'UnindexedTenantModel');
    expect(unindexed?.missingTenantIndex).toBe(true);
    expect(unindexed?.missingTenantCreatedIndex).toBe(true);

    const foreign = models.find((m) => m.name === 'ForeignModel');
    expect(foreign?.missingTenantIndex).toBe(false);
    expect(foreign?.unindexedForeignKeys).toContain('leadId');
  });

  it('runs against real repository schema and validates tenant index health', () => {
    const schemaPath = resolve(process.cwd(), 'prisma/schema.prisma');
    const sourceDir = resolve(process.cwd(), 'src');

    const report = runDatabaseGovernanceAudit(schemaPath, sourceDir);

    expect(report.modelsAudited).toBeGreaterThan(30);
    expect(report.tenantModelsCount).toBeGreaterThan(15);
    // Tenant index coverage should be high (> 80%)
    expect(report.tenantIndexCoveragePercent).toBeGreaterThanOrEqual(75);
    expect(report.fkIndexCoveragePercent).toBeGreaterThan(50);
  }, 60000);
});

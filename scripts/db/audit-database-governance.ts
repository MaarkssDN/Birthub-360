/**
 * Database Governance & Query Performance Audit Gate — BirthHub 360
 *
 * Implements architectural safeguards for PostgreSQL + Prisma in multi-tenant environments:
 * 1. Multi-Tenant Index Coverage: Models with `organizationId` must have an index with `organizationId`
 *    as a leading column to prevent sequential scans during tenant-scoped filtering.
 * 2. Foreign Key Coverage: Relation scalar fields should be indexed to avoid table-level locks
 *    during DELETE / UPDATE operations on referenced primary tables.
 * 3. Interactive Transaction Safeguards: Scans backend code for `prisma.$transaction(async`
 *    and verifies explicit timeout/maxWait options to prevent connection pool starvation.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

export interface ModelAudit {
  name: string;
  tableName: string;
  hasOrgId: boolean;
  hasCreatedAt: boolean;
  indexes: string[][]; // list of field lists in indexes
  uniques: string[][]; // list of field lists in unique constraints
  foreignKeys: string[]; // scalar fields that act as FKs
  missingTenantIndex: boolean;
  missingTenantCreatedIndex: boolean;
  unindexedForeignKeys: string[];
}

export interface TransactionAuditResult {
  filePath: string;
  line: number;
  snippet: string;
  hasExplicitTimeout: boolean;
}

export interface GovernanceReport {
  modelsAudited: number;
  tenantModelsCount: number;
  tenantModelsIndexedCount: number;
  tenantIndexCoveragePercent: number;
  modelsWithMissingTenantIndex: string[];
  modelsSuggestedTemporalIndex: string[];
  totalForeignKeysCount: number;
  indexedForeignKeysCount: number;
  fkIndexCoveragePercent: number;
  unindexedForeignKeys: { model: string; field: string }[];
  interactiveTransactionsAudited: number;
  transactionsWithExplicitTimeout: number;
  unprotectedTransactions: TransactionAuditResult[];
}

/**
 * Parses a Prisma schema string into structured model metadata.
 */
export function parsePrismaSchema(schemaContent: string): ModelAudit[] {
  const models: ModelAudit[] = [];
  const modelRegex = /model\s+(\w+)\s+{([\s\S]*?)\n\s*}/g;
  let match: RegExpExecArray | null;

  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const modelName = match[1];
    const body = match[2];

    // Extract @@map if present
    const mapMatch = /@@map\("([^"]+)"\)/.exec(body);
    const tableName = mapMatch ? mapMatch[1] : modelName;

    // Check key fields
    const hasOrgId = /^\s*organizationId\s+String/m.test(body);
    const hasCreatedAt = /^\s*createdAt\s+DateTime/m.test(body);

    // Extract @@index
    const indexes: string[][] = [];
    const indexRegex = /@@index\(\[([^\]]+)\]/g;
    let idxMatch: RegExpExecArray | null;
    while ((idxMatch = indexRegex.exec(body)) !== null) {
      const fields = idxMatch[1]
        .split(',')
        .map((f) => f.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
      indexes.push(fields);
    }

    // Extract @@unique and @unique fields
    const uniques: string[][] = [];
    const uniqueRegex = /@@unique\(\[([^\]]+)\]/g;
    let uMatch: RegExpExecArray | null;
    while ((uMatch = uniqueRegex.exec(body)) !== null) {
      const fields = uMatch[1]
        .split(',')
        .map((f) => f.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
      uniques.push(fields);
    }

    // Single-field @unique
    const lines = body.split('\n');
    for (const line of lines) {
      const fieldLine = line.trim();
      if (!fieldLine || fieldLine.startsWith('//') || fieldLine.startsWith('@@')) continue;
      if (/@unique\b/.test(fieldLine)) {
        const fieldName = fieldLine.split(/\s+/)[0];
        if (fieldName) uniques.push([fieldName]);
      }
    }

    // Extract Foreign Keys from @relation(fields: [xxx], ...)
    const foreignKeys: string[] = [];
    const relationRegex = /@relation\([^)]*fields:\s*\[([^\]]+)\]/g;
    let relMatch: RegExpExecArray | null;
    while ((relMatch = relationRegex.exec(body)) !== null) {
      const fields = relMatch[1]
        .split(',')
        .map((f) => f.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
      foreignKeys.push(...fields);
    }

    // Evaluation 1: Multi-tenant index coverage
    // An index covers organizationId if organizationId is the first column in an @@index, @@unique or @unique
    const hasLeadingOrgIndex =
      indexes.some((fields) => fields[0] === 'organizationId') ||
      uniques.some((fields) => fields[0] === 'organizationId');

    const missingTenantIndex = hasOrgId && !hasLeadingOrgIndex;

    // Evaluation 2: Compound [organizationId, createdAt]
    const hasTenantCreatedCompound =
      indexes.some(
        (fields) => fields.includes('organizationId') && fields.includes('createdAt')
      ) ||
      uniques.some(
        (fields) => fields.includes('organizationId') && fields.includes('createdAt')
      );

    const missingTenantCreatedIndex = hasOrgId && hasCreatedAt && !hasTenantCreatedCompound;

    // Evaluation 3: Unindexed foreign keys
    // A foreign key field is covered if it appears as the first field in an index/unique,
    // or as the second field when preceded by organizationId (compound tenant query)
    const unindexedForeignKeys = foreignKeys.filter((fk) => {
      const isFirst =
        indexes.some((fields) => fields[0] === fk) ||
        uniques.some((fields) => fields[0] === fk);
      const isSecondAfterOrg =
        indexes.some((fields) => fields[0] === 'organizationId' && fields[1] === fk) ||
        uniques.some((fields) => fields[0] === 'organizationId' && fields[1] === fk);
      return !isFirst && !isSecondAfterOrg;
    });

    models.push({
      name: modelName,
      tableName,
      hasOrgId,
      hasCreatedAt,
      indexes,
      uniques,
      foreignKeys: Array.from(new Set(foreignKeys)),
      missingTenantIndex,
      missingTenantCreatedIndex,
      unindexedForeignKeys: Array.from(new Set(unindexedForeignKeys)),
    });
  }

  return models;
}

/**
 * Recursively find all typescript/javascript files in a directory.
 */
function walkSourceFiles(dir: string, fileList: string[] = []): string[] {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walkSourceFiles(fullPath, fileList);
      } else if (entry.endsWith('.ts') || entry.endsWith('.js')) {
        fileList.push(fullPath);
      }
    }
  } catch {
    // skip non-existent or inaccessible folders
  }
  return fileList;
}

/**
 * Audits interactive transactions in backend code.
 */
export function auditTransactionsInCode(sourceDir: string): TransactionAuditResult[] {
  const files = walkSourceFiles(sourceDir);
  const results: TransactionAuditResult[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      if (!content.includes('$transaction')) continue;

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match interactive transaction: prisma.$transaction(async (tx) => { ... }
        if (/\$transaction\s*\(\s*async\b/.test(line)) {
          // Look ahead up to 10 lines to check for { timeout, maxWait }
          const window = lines.slice(i, Math.min(lines.length, i + 15)).join('\n');
          const hasTimeout = /\b(timeout|maxWait)\s*:/.test(window);

          results.push({
            filePath: file,
            line: i + 1,
            snippet: line.trim(),
            hasExplicitTimeout: hasTimeout,
          });
        }
      }
    } catch {
      // skip unreadable file
    }
  }

  return results;
}

/**
 * Runs full database governance audit.
 */
export function runDatabaseGovernanceAudit(
  schemaPath: string,
  sourceDir: string
): GovernanceReport {
  const schemaContent = readFileSync(schemaPath, 'utf8');
  const models = parsePrismaSchema(schemaContent);
  const transactionResults = auditTransactionsInCode(sourceDir);

  const tenantModels = models.filter((m) => m.hasOrgId);
  const tenantModelsIndexed = tenantModels.filter((m) => !m.missingTenantIndex);
  const modelsWithMissingTenantIndex = tenantModels
    .filter((m) => m.missingTenantIndex)
    .map((m) => m.name);
  const modelsSuggestedTemporalIndex = tenantModels
    .filter((m) => m.missingTenantCreatedIndex)
    .map((m) => m.name);

  let totalFkCount = 0;
  let indexedFkCount = 0;
  const unindexedFks: { model: string; field: string }[] = [];

  for (const m of models) {
    totalFkCount += m.foreignKeys.length;
    const indexed = m.foreignKeys.length - m.unindexedForeignKeys.length;
    indexedFkCount += indexed;
    for (const fk of m.unindexedForeignKeys) {
      unindexedFks.push({ model: m.name, field: fk });
    }
  }

  const tenantCoverage =
    tenantModels.length > 0
      ? Math.round((tenantModelsIndexed.length / tenantModels.length) * 100)
      : 100;

  const fkCoverage =
    totalFkCount > 0 ? Math.round((indexedFkCount / totalFkCount) * 100) : 100;

  const transactionsWithTimeout = transactionResults.filter((t) => t.hasExplicitTimeout).length;
  const unprotected = transactionResults.filter((t) => !t.hasExplicitTimeout);

  return {
    modelsAudited: models.length,
    tenantModelsCount: tenantModels.length,
    tenantModelsIndexedCount: tenantModelsIndexed.length,
    tenantIndexCoveragePercent: tenantCoverage,
    modelsWithMissingTenantIndex,
    modelsSuggestedTemporalIndex,
    totalForeignKeysCount: totalFkCount,
    indexedForeignKeysCount: indexedFkCount,
    fkIndexCoveragePercent: fkCoverage,
    unindexedForeignKeys: unindexedFks,
    interactiveTransactionsAudited: transactionResults.length,
    transactionsWithExplicitTimeout: transactionsWithTimeout,
    unprotectedTransactions: unprotected,
  };
}

/**
 * CLI Execution Entrypoint
 */
export function main(): void {
  const schemaPath = resolve(process.cwd(), 'prisma/schema.prisma');
  const sourceDir = resolve(process.cwd(), 'src');

  console.log('===============================================================');
  console.log('  🔍 DATABASE GOVERNANCE & PERFORMANCE AUDITOR — BirthHub 360');
  console.log('===============================================================\n');

  const report = runDatabaseGovernanceAudit(schemaPath, sourceDir);

  console.log(`[Schema Models] Total: ${report.modelsAudited}`);
  console.log(
    `[Tenant Isolation] Models with organizationId: ${report.tenantModelsCount}`
  );
  console.log(
    `[Tenant Index Coverage] ${report.tenantModelsIndexedCount}/${report.tenantModelsCount} (${report.tenantIndexCoveragePercent}%)`
  );

  if (report.modelsWithMissingTenantIndex.length > 0) {
    console.warn('\n⚠️  Models missing leading index on organizationId:');
    report.modelsWithMissingTenantIndex.forEach((m) => console.warn(`   - ${m}`));
  } else {
    console.log('✅ 100% of tenant models have leading organizationId index.');
  }

  console.log(
    `\n[Foreign Keys] Total FKs: ${report.totalForeignKeysCount} | Covered: ${report.indexedForeignKeysCount} (${report.fkIndexCoveragePercent}%)`
  );

  if (report.modelsSuggestedTemporalIndex.length > 0) {
    console.log(
      `ℹ️  Suggested [organizationId, createdAt] composite index candidates: ${report.modelsSuggestedTemporalIndex.length} models`
    );
  }

  console.log(
    `\n[Transactions] Interactive transactions checked: ${report.interactiveTransactionsAudited}`
  );
  console.log(
    `[Transaction Safety] Protected with timeout/maxWait: ${report.transactionsWithExplicitTimeout}`
  );

  if (report.unprotectedTransactions.length > 0) {
    console.warn(
      `⚠️  ${report.unprotectedTransactions.length} interactive transaction(s) without explicit timeout guard.`
    );
  }

  console.log('\n===============================================================');
  console.log('  Audit completed successfully. See docs/architecture/DATABASE_GOVERNANCE_GUIDE.md');
  console.log('===============================================================\n');
}

if (process.argv[1]?.endsWith('audit-database-governance.ts') || process.argv[1]?.endsWith('audit-database-governance.js')) {
  main();
}

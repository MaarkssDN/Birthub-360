import fs from 'node:fs';
import path from 'node:path';

/**
 * Script de Governança de Banco de Dados — Agente 10 (Mara)
 *
 * Linter estático que varre o repositório procurando chamadas de SQL cru
 * ($queryRaw, $executeRaw, queryRawUnsafe, executeRawUnsafe) e garante que
 * qualquer consulta sobre tabelas multi-tenant inclua predicados explícitos de tenant
 * (ex: organizationId, tenantId, app.current_tenant_id).
 */

const MULTI_TENANT_TABLES = [
  'Lead',
  'Company',
  'Contact',
  'Activity',
  'TimelineEvent',
  'WhatsAppMessage',
  'EmailMessage',
  'VoiceCallLog',
  'CrmDealItem',
  'CrmCommercialDocument',
  'AuditLog',
];

export interface SqlLintFinding {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

export function lintSqlInFile(filePath: string, content: string): SqlLintFinding[] {
  const findings: SqlLintFinding[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.includes('$queryRaw') ||
      line.includes('$executeRaw') ||
      line.includes('$queryRawUnsafe') ||
      line.includes('$executeRawUnsafe')
    ) {
      // Pega o bloco de 5 linhas ao redor
      const block = lines.slice(i, Math.min(i + 6, lines.length)).join(' ');
      for (const table of MULTI_TENANT_TABLES) {
        const regexTable = new RegExp(`\\b(FROM|JOIN|UPDATE|INTO)\\s+["']?${table}["']?\\b`, 'i');
        if (regexTable.test(block)) {
          const hasTenantPredicate =
            block.includes('organizationId') ||
            block.includes('tenantId') ||
            block.includes('app.current_tenant_id') ||
            block.includes('current_setting');

          if (!hasTenantPredicate) {
            findings.push({
              file: filePath,
              line: i + 1,
              snippet: line.trim(),
              reason: `Consulta SQL cru sobre tabela multi-tenant "${table}" sem predicado explícito de tenantId/organizationId.`,
            });
          }
        }
      }
    }
  }

  return findings;
}

export function runSqlTenantCheck(rootDir = process.cwd()): { success: boolean; findings: SqlLintFinding[] } {
  const srcDir = path.join(rootDir, 'src');
  if (!fs.existsSync(srcDir)) {
    return { success: true, findings: [] };
  }

  const allFindings: SqlLintFinding[] = [];

  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist') {
          scanDir(fullPath);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const fileFindings = lintSqlInFile(path.relative(rootDir, fullPath), content);
        allFindings.push(...fileFindings);
      }
    }
  }

  scanDir(srcDir);
  return {
    success: allFindings.length === 0,
    findings: allFindings,
  };
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('check-sql-tenant-predicates.ts')) {
  const { success, findings } = runSqlTenantCheck();
  if (!success) {
    console.error('❌ Falhas encontradas na validação de predicados tenant em SQL:');
    for (const f of findings) {
      console.error(`- ${f.file}:${f.line} -> ${f.reason} (snippet: ${f.snippet})`);
    }
    process.exit(1);
  } else {
    console.log('✅ Nenhuma violação de predicado tenant em SQL cru foi encontrada.');
  }
}

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Agente 90 (Hélio) & Agente 91 (Terra) - Infra DR Runbook & Terraform State Lock', () => {
  it('backend.tf deve configurar backend S3 com encrypt = true e dynamodb_table para state lock', () => {
    const tfPath = path.resolve(process.cwd(), 'infrastructure/terraform/backend.tf');
    expect(fs.existsSync(tfPath)).toBe(true);
    const content = fs.readFileSync(tfPath, 'utf8');
    expect(content).toContain('backend "s3"');
    expect(content).toContain('encrypt        = true');
    expect(content).toContain('dynamodb_table = "birthhub360-terraform-locks"');
  });

  it('RUNBOOK_RDS_FAILOVER.md deve existir com procedimento de simulação de failover RDS', () => {
    const runbookPath = path.resolve(process.cwd(), 'docs/ops/RUNBOOK_RDS_FAILOVER.md');
    expect(fs.existsSync(runbookPath)).toBe(true);
    const content = fs.readFileSync(runbookPath, 'utf8');
    expect(content).toContain('reboot-db-instance');
    expect(content).toContain('--force-failover');
  });
});

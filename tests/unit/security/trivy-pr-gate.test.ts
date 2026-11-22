import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';

describe('Trivy PR gate policy', () => {
  it('respects HIGH/CRITICAL severities and keeps the ignore list aligned with the waiver docs', () => {
    const workflowText = readFileSync('.github/workflows/security-trivy.yml', 'utf8');
    const workflow = YAML.parse(workflowText) as {
      jobs?: Record<string, { steps?: Array<Record<string, unknown>> }>;
    };

    const job = workflow.jobs?.['trivy-fs-pr-gate'];
    expect(job).toBeDefined();

    const trivyStep = job?.steps?.find((step) => {
      const name = typeof step.name === 'string' ? step.name : '';
      return name.includes('Rodar Trivy');
    });

    expect(trivyStep).toBeDefined();
    expect(trivyStep).toMatchObject({
      with: {
        'scan-type': 'fs',
        'scan-ref': '.',
        severity: 'HIGH,CRITICAL',
        'exit-code': '1',
        format: 'sarif',
        output: 'trivy-fs-results.sarif',
        'trivyignores': '.trivyignore.yaml',
        'limit-severities-for-sarif': true,
      },
    });

    const ignoreText = readFileSync('.trivyignore.yaml', 'utf8');
    const ignoreFile = YAML.parse(ignoreText) as {
      vulnerabilities?: Array<{ id?: string; expired_at?: string }>;
    };

    const ignoreIds = (ignoreFile.vulnerabilities ?? []).map((item) => item.id).filter(Boolean);

    expect(ignoreIds).toEqual(expect.arrayContaining(['GHSA-ggr8-5vv4-36mx', 'CVE-2026-40345']));

    for (const item of ignoreFile.vulnerabilities ?? []) {
      expect(item.expired_at).toBeTruthy();
      expect(typeof item.expired_at).toBe('string');
    }

    const waiverDoc = readFileSync('docs/security/AUDIT_WAIVERS.md', 'utf8');
    expect(waiverDoc).toContain('GHSA-ggr8-5vv4-36mx');
    expect(waiverDoc).toContain('CVE-2026-40345');
  });

  it('keeps the blocking PR gate from silently ignoring findings', () => {
    const workflowText = readFileSync('.github/workflows/security-trivy.yml', 'utf8');
    const workflow = YAML.parse(workflowText) as {
      jobs?: Record<string, { steps?: Array<Record<string, unknown>> }>;
    };

    const trivyStep = workflow.jobs?.['trivy-fs-pr-gate']?.steps?.find((step) => {
      const name = typeof step.name === 'string' ? step.name : '';
      return name.includes('Rodar Trivy');
    });

    expect(trivyStep).toBeDefined();
    expect(trivyStep?.['continue-on-error']).toBeUndefined();

    const withConfig = (trivyStep as { with?: Record<string, unknown> } | undefined)?.with ?? {};
    expect(withConfig['exit-code']).toBe('1');
    expect(withConfig['severity']).toBe('HIGH,CRITICAL');
    expect(withConfig['limit-severities-for-sarif']).toBe(true);
  });
});

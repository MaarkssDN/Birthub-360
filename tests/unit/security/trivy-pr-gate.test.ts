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

    // Estado verificado em 2026-11-24 (triagem POS4 do Agente 99): todos os waivers foram
    // encerrados — cada pacote já resolve em versão corrigida nos lockfiles varridos e o
    // advisory de `picomatch` foi retirado upstream. Zero waivers ativos é o estado
    // ESPERADO; qualquer waiver novo exige registro em docs/security/AUDIT_WAIVERS.md
    // ("## Waivers ativos") e atualização deste teste na mesma alteração.
    expect(ignoreFile.vulnerabilities).toEqual([]);

    // Se um waiver for (re)introduzido, ele precisa manter a disciplina mínima: ID
    // identificável e `expired_at` (fail-closed automático quando a data vencer).
    for (const item of ignoreFile.vulnerabilities ?? []) {
      expect(item.id).toBeTruthy();
      expect(item.expired_at).toBeTruthy();
      expect(typeof item.expired_at).toBe('string');
      expect(Number.isNaN(Date.parse(item.expired_at as string))).toBe(false);
    }

    const waiverDoc = readFileSync('docs/security/AUDIT_WAIVERS.md', 'utf8');
    expect(waiverDoc).toContain('## Waivers ativos');
    expect(waiverDoc).toContain('Nenhum waiver ativo');
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

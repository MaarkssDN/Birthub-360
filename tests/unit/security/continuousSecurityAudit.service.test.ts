import { createHash } from 'node:crypto';
import { describe, expect, it, beforeEach } from 'vitest';
import { ContinuousSecurityAuditService } from '../../../src/lib/security/services/continuousSecurityAudit.service.js';
import type { SecuritySweepScanner } from '../../../src/lib/security/services/securitySweepScanner.js';

// Fixture de PROCESSO (stdout/arquivo), não de relatório: os testes injetam a saída
// que `npm audit --json`, `cyclonedx-npm` e `AUDIT_WAIVERS.md` produziriam de verdade.
const SBOM_FIXTURE_JSON = JSON.stringify({
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  components: [{ name: 'dep-a' }, { name: 'dep-b' }],
});
const SBOM_FIXTURE_HASH = createHash('sha256').update(SBOM_FIXTURE_JSON).digest('hex');

const AUDIT_FIXTURE_JSON = JSON.stringify({
  auditReportVersion: 2,
  vulnerabilities: {
    'left-pad': {
      name: 'left-pad',
      severity: 'high',
      via: [
        {
          source: 123456,
          name: 'left-pad',
          dependency: 'left-pad',
          title: 'Prototype pollution in left-pad',
          url: 'https://github.com/advisories/GHSA-AAAA-BBBB-CCCC',
          severity: 'high',
          range: '<1.3.0',
          fixAvailable: { name: 'left-pad', version: '1.3.0', isSemVerMajor: true },
        },
      ],
      effects: [],
      range: '<1.3.0',
      nodes: ['node_modules/left-pad'],
      fixAvailable: true,
    },
    'old-lib': {
      name: 'old-lib',
      severity: 'moderate',
      via: [
        {
          source: 654321,
          name: 'old-lib',
          dependency: 'old-lib',
          title: 'Memory corruption in old-lib',
          url: 'https://nvd.nist.gov/vuln/detail/CVE-2026-99999',
          severity: 'moderate',
          range: '<2.0.0',
        },
      ],
      effects: [],
      range: '<2.0.0',
      nodes: ['node_modules/old-lib'],
      fixAvailable: false,
    },
    // Entrada de cadeia (via só com string) — não é advisory, não deve virar finding.
    dependent: {
      name: 'dependent',
      severity: 'high',
      via: ['left-pad'],
      effects: [],
      range: '*',
      nodes: ['node_modules/dependent'],
      fixAvailable: false,
    },
  },
  metadata: {
    vulnerabilities: { info: 0, low: 0, moderate: 1, high: 1, critical: 0, total: 2 },
    dependencies: { prod: 1, dev: 1, optional: 0, peer: 0, peerOptional: 0, total: 2 },
  },
});

const WAIVERS_FIXTURE_MD = `# Waivers de dependency audit

## Waivers ativos

### \`GHSA-AAAA-BBBB-CCCC\` — \`left-pad\` (waiver vigente)

- **Advisory:** https://github.com/advisories/GHSA-aaaa-bbbb-cccc
- **Severidade reportada pelo \`npm audit\`:** high
- **Cadeia:** left-pad
- **Motivo:** Aceito temporariamente para teste de fixture.
- **Dono:** Agente 00
- **Data de registro:** 2020-01-01. **Reavaliar em:** 2999-12-31

### \`CVE-2026-99999\` — \`old-lib\` (waiver expirado)

- **Advisory:** https://github.com/advisories/EXAMPLE
- **Motivo:** Waiver vencido — não deve ser aplicado.
- **Dono:** Agente 00
- **Data de registro:** 2020-01-01. **Reavaliar em:** 2000-01-01

## Débito conhecido, fora do escopo deste waiver

### \`GHSA-DDDD-EEEE-FFFF\` — não deve ser lido como waiver ativo

- **Motivo:** Seção fora de "Waivers ativos".
- **Data de registro:** 2020-01-01. **Reavaliar em:** 2999-12-31
`;

function makeScanner(overrides?: Partial<SecuritySweepScanner>): SecuritySweepScanner {
  return {
    runAuditJson: async () => AUDIT_FIXTURE_JSON,
    generateSbom: async () => ({
      sha256Digest: SBOM_FIXTURE_HASH,
      componentCount: 2,
      generatedAt: '2026-11-20T00:00:00.000Z',
    }),
    readWaiversMarkdown: () => WAIVERS_FIXTURE_MD,
    ...overrides,
  };
}

const CLEAN_AUDIT_JSON = JSON.stringify({
  auditReportVersion: 2,
  vulnerabilities: {},
  metadata: {
    vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 },
    dependencies: { prod: 0, dev: 0, optional: 0, peer: 0, peerOptional: 0, total: 0 },
  },
});

describe('ContinuousSecurityAuditService — scanner real (EXP-06)', () => {
  beforeEach(() => {
    // cada teste instancia o serviço com scanner fixture — o singleton exportado
    // usa o backend real (npm audit + cyclonedx-npm) e não roda em unit test.
  });

  it('executa sweep real: parseia npm audit, aplica só waivers vigentes e marca simulated=false', async () => {
    const svc = new ContinuousSecurityAuditService(undefined, makeScanner());
    const report = await svc.runSecuritySweep();

    expect(report.sweepId).toBeDefined();
    expect(report.simulated).toBe(false);
    // 2 findings reais do fixture (a entrada "dependent" é cadeia, ignorada).
    expect(report.vulnerabilitiesFound).toHaveLength(2);

    const waived = report.vulnerabilitiesFound.find((v) => v.packageName === 'left-pad');
    const unwaived = report.vulnerabilitiesFound.find((v) => v.packageName === 'old-lib');
    expect(waived?.waiverReference).toBe('GHSA-AAAA-BBBB-CCCC');
    // Waiver expirado (2000-01-01) NÃO é aplicado.
    expect(unwaived?.waiverReference).toBeUndefined();
    expect(unwaived?.cveId).toBe('CVE-2026-99999');

    expect(report.criticalCount).toBe(0);
    expect(report.highCount).toBe(1);
    expect(report.activeWaiversCount).toBe(1);
    // Sem HIGH/CRITICAL sem waiver → WARN_WAIVED (moderate sem waiver ainda é achado).
    expect(report.complianceRating).toBe('WARN_WAIVED');
  });

  it('SBOM: hash e contagem vêm do artefato real do scanner', async () => {
    const svc = new ContinuousSecurityAuditService(undefined, makeScanner());
    const report = await svc.runSecuritySweep();

    expect(report.sbomSummary.sha256Digest).toBe(SBOM_FIXTURE_HASH);
    expect(report.sbomSummary.totalComponents).toBe(2);
    expect(report.totalDependenciesScanned).toBe(2);
    expect(report.sbomSummary.format).toBe('CycloneDX_JSON');
    expect(report.sbomSummary.isReproducible).toBe(true);

    const validation = await svc.validateSbomIntegrity(SBOM_FIXTURE_HASH);
    expect(validation.valid).toBe(true);
    expect(validation.componentCount).toBe(2);

    const invalid = await svc.validateSbomIntegrity('hash-falso-invalido');
    expect(invalid.valid).toBe(false);
  });

  it('auditoria limpa → complianceRating PASS e zero vulnerabilidades', async () => {
    const svc = new ContinuousSecurityAuditService(
      undefined,
      makeScanner({ runAuditJson: async () => CLEAN_AUDIT_JSON }),
    );
    const report = await svc.runSecuritySweep();
    expect(report.vulnerabilitiesFound).toHaveLength(0);
    expect(report.complianceRating).toBe('PASS');
    expect(report.activeWaiversCount).toBe(0);
  });

  it('CRITICAL sem waiver ativo → FAIL_BLOCKED', async () => {
    const criticalAudit = JSON.stringify({
      auditReportVersion: 2,
      vulnerabilities: {
        'evil-lib': {
          name: 'evil-lib',
          severity: 'critical',
          via: [
            {
              source: 1,
              name: 'evil-lib',
              title: 'RCE in evil-lib',
              url: 'https://github.com/advisories/GHSA-9999-8888-7777',
              severity: 'critical',
              range: '<1.0.0',
            },
          ],
          effects: [],
          range: '<1.0.0',
          nodes: ['node_modules/evil-lib'],
          fixAvailable: false,
        },
      },
      metadata: {
        vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 1, total: 1 },
        dependencies: { prod: 0, dev: 0, optional: 0, peer: 0, peerOptional: 0, total: 0 },
      },
    });
    const svc = new ContinuousSecurityAuditService(
      undefined,
      makeScanner({ runAuditJson: async () => criticalAudit }),
    );
    const report = await svc.runSecuritySweep();
    expect(report.criticalCount).toBe(1);
    expect(report.complianceRating).toBe('FAIL_BLOCKED');
  });

  it('checkWaiverValidity: vigente passa, expirado e desconhecido falham', async () => {
    const svc = new ContinuousSecurityAuditService(undefined, makeScanner());

    const active = await svc.checkWaiverValidity('GHSA-AAAA-BBBB-CCCC');
    expect(active.valid).toBe(true);
    expect(active.expiresAt).toContain('2999-12-31');
    expect(active.reason).toContain('Aceito temporariamente');

    const expired = await svc.checkWaiverValidity('CVE-2026-99999');
    expect(expired.valid).toBe(false);
    expect(expired.reason).toContain('expirado');

    const unknown = await svc.checkWaiverValidity('GHSA-0000-0000-0000');
    expect(unknown.valid).toBe(false);
    expect(unknown.reason).toContain('inexistente');
  });

  it('mantém o último relatório disponível para consulta', async () => {
    const svc = new ContinuousSecurityAuditService(undefined, makeScanner());
    expect(await svc.getLatestReport()).toBeNull();

    await svc.runSecuritySweep();
    const latest = await svc.getLatestReport();
    expect(latest).not.toBeNull();
    expect(latest?.sweepId).toBeDefined();
    expect(latest?.simulated).toBe(false);
  });

  it('propaga falha do scanner (fail-closed: sem relatório fabricado)', async () => {
    const svc = new ContinuousSecurityAuditService(
      undefined,
      makeScanner({
        runAuditJson: async () => {
          throw new Error('npm audit failed');
        },
      }),
    );
    await expect(svc.runSecuritySweep()).rejects.toThrow('npm audit failed');
    expect(await svc.getLatestReport()).toBeNull();
  });

  it('rejeita stdout de npm audit inválido (payload de erro do registry)', async () => {
    const svc = new ContinuousSecurityAuditService(
      undefined,
      makeScanner({ runAuditJson: async () => '{"error":"E403 registry"}' }),
    );
    await expect(svc.runSecuritySweep()).rejects.toThrow('valid audit report');
  });
});

describe('ContinuousSecurityAuditService — canal global de eventos de segurança', () => {
  it('emite SECURITY_AUDIT_SWEEP_COMPLETED pelo canal global, sem organizationId sentinela', async () => {
    const { InMemoryGlobalSecurityEventSink } =
      await import('../../../src/lib/security/events/loggerGlobalSecurityEventSink.js');
    const sink = new InMemoryGlobalSecurityEventSink();
    const svc = new ContinuousSecurityAuditService(sink, makeScanner());
    const report = await svc.runSecuritySweep();

    expect(sink.events).toHaveLength(1);
    const ev = sink.events[0]!;
    expect(ev.eventType).toBe('SECURITY_AUDIT_SWEEP_COMPLETED');
    expect(ev.aggregateId).toBe(report.sweepId);
    expect(ev.payload.sbomHash).toBe(report.sbomSummary.sha256Digest);
    expect(JSON.stringify(ev)).not.toContain('global-security-governance');
    expect(ev).not.toHaveProperty('organizationId');
  });

  it('propaga falha do canal (fail-closed: não reporta varredura sem evento)', async () => {
    const svc = new ContinuousSecurityAuditService(
      {
        emit: async () => {
          throw new Error('sink down');
        },
      },
      makeScanner(),
    );
    await expect(svc.runSecuritySweep()).rejects.toThrow('sink down');
  });
});

import { randomUUID } from 'node:crypto';
import type {
  IContinuousSecurityAuditPort,
  SbomManifestSummary,
  SecuritySweepReport,
  SecurityVulnerability,
} from '../../../shared/contracts/continuousSecurityAudit.contract.js';
import { logger } from '../../logger.js';
import type { IGlobalSecurityEventSink } from '../events/globalSecurityEvent.port.js';
import { LoggerGlobalSecurityEventSink } from '../events/loggerGlobalSecurityEventSink.js';
import {
  type AuditWaiver,
  isAuditWaiverActive,
  NodeSecuritySweepScanner,
  parseAuditReport,
  parseAuditWaivers,
  parseNpmAuditVulnerabilities,
  type SecuritySweepScanner,
} from './securitySweepScanner.js';

/**
 * Governança Contínua de Segurança e SBOM (Eixo 20 / EXP-06).
 *
 * IMPLEMENTAÇÃO REAL (substitui o simulador determinístico de homologação):
 * - vulnerabilidades vêm de `npm audit --json` parseado fail-closed;
 * - SBOM vem de `cyclonedx-npm` (mesma ferramenta de `npm run security:sbom`), com
 *   SHA-256 dos bytes do arquivo gerado e contagem real de componentes;
 * - waivers vêm de `docs/security/AUDIT_WAIVERS.md` (fonte única versionada), com
 *   checagem de expiração — waiver vencido ou sem data parseável NÃO é aplicado;
 * - `complianceRating` é calculado dos achados reais: HIGH/CRITICAL sem waiver ativo
 *   → FAIL_BLOCKED; qualquer achado remanescente → WARN_WAIVED; limpo → PASS.
 *
 * Relatórios reais carregam `simulated: false`. O processo de scan é injetável via
 * `SecuritySweepScanner` para que testes usem fixtures de stdout/arquivo — nunca
 * dados fabricados direto no relatório.
 */
export class ContinuousSecurityAuditService implements IContinuousSecurityAuditPort {
  private latestReport: SecuritySweepReport | null = null;

  constructor(
    private readonly securityEvents: IGlobalSecurityEventSink = new LoggerGlobalSecurityEventSink(),
    private readonly scanner: SecuritySweepScanner = new NodeSecuritySweepScanner(),
  ) {}

  /**
   * Executa a varredura REAL de dependências/vulnerabilidades.
   * Falha de scanner (npm audit inválido, SBOM não gerado, waivers ilegíveis) propaga
   * exceção — nunca emite relatório com dados fabricados.
   */
  async runSecuritySweep(params?: { forceFreshScan?: boolean }): Promise<SecuritySweepReport> {
    void params; // contrato reserva o parâmetro; todo sweep é sempre uma varredura fresca
    const sweepId = `sweep-${randomUUID().substring(0, 8)}`;
    const startTime = Date.now();

    const [auditStdout, sbom, waiversMarkdown] = await Promise.all([
      this.scanner.runAuditJson(),
      this.scanner.generateSbom(),
      Promise.resolve().then(() => this.scanner.readWaiversMarkdown()),
    ]);

    const now = new Date();
    const waivers = parseAuditWaivers(waiversMarkdown);
    const activeWaiversByAdvisory = buildActiveWaiverIndex(waivers, now);

    const auditReport = parseAuditReport(auditStdout);
    const findings = parseNpmAuditVulnerabilities(auditReport);

    const vulnerabilitiesFound: SecurityVulnerability[] = findings.map((finding) => {
      const waiver = activeWaiversByAdvisory.get(finding.cveId);
      return waiver ? { ...finding, waiverReference: waiver.key } : finding;
    });

    const criticalCount = vulnerabilitiesFound.filter((v) => v.severity === 'CRITICAL').length;
    const highCount = vulnerabilitiesFound.filter((v) => v.severity === 'HIGH').length;
    // Waivers efetivamente aplicados (distinct) a achados do sweep.
    const appliedWaiverKeys = new Set(
      vulnerabilitiesFound
        .map((v) => v.waiverReference)
        .filter((ref): ref is string => typeof ref === 'string'),
    );
    const activeWaiversCount = appliedWaiverKeys.size;

    // FAIL_BLOCKED só quando há HIGH/CRITICAL sem waiver ativo — waiver vigente é
    // aceite formal de risco (WARN_WAIVED), não bloqueio.
    const unwaivedHighOrCritical = vulnerabilitiesFound.some(
      (v) => !v.waiverReference && (v.severity === 'CRITICAL' || v.severity === 'HIGH'),
    );
    const complianceRating: SecuritySweepReport['complianceRating'] = unwaivedHighOrCritical
      ? 'FAIL_BLOCKED'
      : vulnerabilitiesFound.length > 0
        ? 'WARN_WAIVED'
        : 'PASS';

    const sbomSummary: SbomManifestSummary = {
      format: 'CycloneDX_JSON',
      specVersion: '1.5',
      totalComponents: sbom.componentCount,
      sha256Digest: sbom.sha256Digest,
      isReproducible: true,
      generatedAt: sbom.generatedAt,
    };

    const report: SecuritySweepReport = {
      sweepId,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      totalDependenciesScanned: sbom.componentCount,
      vulnerabilitiesFound,
      criticalCount,
      highCount,
      activeWaiversCount,
      sbomSummary,
      complianceRating,
      simulated: false,
    };

    this.latestReport = report;

    // Evento de plataforma (sem tenant): vai pelo canal global de segurança, nunca pela
    // outbox por tenant (FK organizationId -> Organization). Ver globalSecurityEvent.port.ts.
    await this.securityEvents.emit({
      eventId: randomUUID(),
      eventType: 'SECURITY_AUDIT_SWEEP_COMPLETED',
      eventVersion: '1.0.0',
      occurredAt: new Date().toISOString(),
      correlationId: `audit-${sweepId}`,
      producer: 'continuous-security-audit-engine',
      aggregateId: sweepId,
      payload: {
        totalDependenciesScanned: sbom.componentCount,
        complianceRating,
        criticalCount,
        activeWaiversCount,
        sbomHash: sbom.sha256Digest,
        simulated: false,
      },
    });

    logger.info(
      `[ContinuousSecurityAudit] Varredura real ${sweepId} concluída. Conformidade: ${complianceRating}. ` +
        `Dependências: ${sbom.componentCount}. Vulnerabilidades: ${vulnerabilitiesFound.length} ` +
        `(critical: ${criticalCount}, high: ${highCount}). Waivers ativos aplicados: ${activeWaiversCount}.`,
    );

    return report;
  }

  async validateSbomIntegrity(
    expectedSha256?: string,
  ): Promise<{ valid: boolean; componentCount: number; hash: string }> {
    if (!this.latestReport) {
      await this.runSecuritySweep();
    }

    const report = this.latestReport!;
    const hash = report.sbomSummary.sha256Digest;
    const valid = !expectedSha256 || expectedSha256 === hash;

    return {
      valid,
      componentCount: report.sbomSummary.totalComponents,
      hash,
    };
  }

  /**
   * Verifica a vigência de um waiver pelo advisory ID (GHSA/CVE) coberto por ele.
   * Lê `docs/security/AUDIT_WAIVERS.md` a cada chamada — waivers são governança viva.
   */
  async checkWaiverValidity(
    waiverId: string,
  ): Promise<{ valid: boolean; expiresAt: string; reason: string }> {
    const waivers = parseAuditWaivers(this.scanner.readWaiversMarkdown());
    const normalized = waiverId.toUpperCase();
    const waiver = waivers.find((w) => w.advisoryIds.includes(normalized));

    if (!waiver) {
      return { valid: false, expiresAt: '', reason: 'Waiver inexistente ou revogado' };
    }

    const active = isAuditWaiverActive(waiver, new Date());
    return {
      valid: active,
      expiresAt: waiver.expiresAt?.toISOString() ?? '',
      reason: active
        ? waiver.reason
        : `${waiver.reason} (waiver expirado ou sem data de reavaliação verificável — não aplicado)`,
    };
  }

  async getLatestReport(): Promise<SecuritySweepReport | null> {
    return this.latestReport;
  }

  clear(): void {
    this.latestReport = null;
  }
}

/**
 * Índice advisoryId → waiver para os waivers ATIVOS (não expirados) do markdown.
 * Um mesmo advisory pode aparecer em mais de um waiver; o primeiro vence.
 */
function buildActiveWaiverIndex(waivers: AuditWaiver[], now: Date): Map<string, AuditWaiver> {
  const index = new Map<string, AuditWaiver>();
  for (const waiver of waivers) {
    if (!isAuditWaiverActive(waiver, now)) continue;
    for (const advisoryId of waiver.advisoryIds) {
      if (!index.has(advisoryId)) index.set(advisoryId, waiver);
    }
  }
  return index;
}

export const continuousSecurityAuditService = new ContinuousSecurityAuditService();

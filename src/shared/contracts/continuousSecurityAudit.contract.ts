/**
 * Contrato Canônico para a Governança Contínua de Segurança e SBOM (Eixo 20)
 * Onda 05 — Evolução 20
 * Responsável: Agente 18 (Contratos) / Agente 15 (Segurança Aplicada)
 *
 * ATENÇÃO (EXP-06, reconciliação 2026-11-14): a implementação atual
 * (`src/lib/security/services/continuousSecurityAudit.service.ts`) é um
 * SIMULADOR DETERMINÍSTICO DE HOMOLOGAÇÃO — não é auditoria real. Não existe
 * scanner de dependências/CVE real integrado. O campo `simulated` marca
 * relatórios gerados por esse simulador; quando `simulated === true`, todos os
 * dados do relatório (contagem de dependências, vulnerabilidades, waivers, SBOM
 * e `complianceRating`) são ilustrativos e NÃO devem ser tratados como
 * evidência de conformidade de segurança. Scanner real pendente (ver handoff
 * `.agents/handoffs/onda-reconciliacao-20261114/00-para-10-scanner-seguranca-real.md`).
 */

export type VulnerabilitySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityVulnerability {
  cveId: string;
  packageName: string;
  affectedVersionRange: string;
  severity: VulnerabilitySeverity;
  fixedInVersion?: string;
  description: string;
  waiverReference?: string;
}

export interface SbomManifestSummary {
  format: 'CycloneDX_JSON' | 'SPDX_JSON';
  specVersion: string;
  totalComponents: number;
  sha256Digest: string;
  isReproducible: boolean;
  generatedAt: string;
}

export interface SecuritySweepReport {
  sweepId: string;
  executedAt: string;
  durationMs: number;
  totalDependenciesScanned: number;
  vulnerabilitiesFound: SecurityVulnerability[];
  criticalCount: number;
  highCount: number;
  activeWaiversCount: number;
  sbomSummary: SbomManifestSummary;
  /**
   * Rating ILLUSTRATIVO emitido pelo simulador de homologação. Não representa
   * resultado de auditoria real enquanto o scanner real não existir — ver
   * nota de cabeçalho do arquivo.
   */
  complianceRating: 'PASS' | 'WARN_WAIVED' | 'FAIL_BLOCKED';
  /**
   * `true` quando o relatório foi produzido por um simulador determinístico
   * (dados fabricados para homologação), não por varredura real de
   * dependências/vulnerabilidades. Consumidores NÃO devem apresentar este
   * relatório como evidência de segurança. Opcional para compatibilidade
   * retroativa: relatórios antigos sem o campo devem ser tratados como
   * potencialmente simulados.
   */
  simulated?: boolean;
}

export interface IContinuousSecurityAuditPort {
  runSecuritySweep(params?: { forceFreshScan?: boolean }): Promise<SecuritySweepReport>;
  validateSbomIntegrity(
    expectedSha256?: string,
  ): Promise<{ valid: boolean; componentCount: number; hash: string }>;
  checkWaiverValidity(
    waiverId: string,
  ): Promise<{ valid: boolean; expiresAt: string; reason: string }>;
  getLatestReport(): Promise<SecuritySweepReport | null>;
}

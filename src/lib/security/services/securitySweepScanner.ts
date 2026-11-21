import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type {
  SecurityVulnerability,
  VulnerabilitySeverity,
} from '../../../shared/contracts/continuousSecurityAudit.contract.js';

/**
 * Scanner REAL de dependências/vulnerabilidades para o ContinuousSecurityAuditService
 * (handoff `.agents/handoffs/onda-reconciliacao-20261114/00-para-10-scanner-seguranca-real.md`).
 *
 * Substitui o simulador determinístico de homologação (EXP-06): os dados agora vêm de
 * `npm audit --json`, de um SBOM CycloneDX gerado por `cyclonedx-npm` (mesma ferramenta do
 * script `security:sbom`) e dos waivers formais de `docs/security/AUDIT_WAIVERS.md`.
 *
 * A interface `SecuritySweepScanner` existe para testes: o processo real é injetável, então os
 * testes alimentam fixtures de stdout/arquivo — nunca dados fabricados direto no relatório.
 */

export interface SbomArtifact {
  /** SHA-256 dos bytes do arquivo SBOM gerado em disco. */
  sha256Digest: string;
  /** Número real de componentes do SBOM CycloneDX (dependências, recursivo). */
  componentCount: number;
  generatedAt: string;
}

export interface SecuritySweepScanner {
  /** Executa `npm audit --json` e retorna o stdout bruto (exit != 0 com achados é normal). */
  runAuditJson(): Promise<string>;
  /** Gera o SBOM CycloneDX real e retorna hash/conteúdo derivado do arquivo. */
  generateSbom(): Promise<SbomArtifact>;
  /** Retorna o conteúdo bruto de `docs/security/AUDIT_WAIVERS.md`. */
  readWaiversMarkdown(): string;
}

// ---------------------------------------------------------------------------
// Backend real (processos locais)
// ---------------------------------------------------------------------------

const AUDIT_COMMAND = 'npm audit --json';
const MAX_BUFFER = 64 * 1024 * 1024;

function cleanAuditEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  // Mesmo cuidado de scripts/security/check-audit-waivers.ts: nunca deixar lifecycle
  // scripts do npm audit alterarem o ambiente do processo hospedeiro.
  delete env.npm_config_allow_scripts;
  delete env.npm_config_allowscripts;
  return env;
}

/**
 * `npm`/`npx`/`cyclonedx-npm` são `.cmd` no Windows — `execFileSync` sem shell falha com
 * ENOENT/EINVAL. `execSync` com string literal roda via shell do SO em qualquer plataforma
 * (mesmo padrão documentado em check-audit-waivers.ts). Não há input externo na linha.
 */
export class NodeSecuritySweepScanner implements SecuritySweepScanner {
  constructor(private readonly cwd: string = process.cwd()) {}

  async runAuditJson(): Promise<string> {
    try {
      return execSync(AUDIT_COMMAND, {
        cwd: this.cwd,
        encoding: 'utf-8',
        env: cleanAuditEnv(),
        maxBuffer: MAX_BUFFER,
      });
    } catch (err) {
      // `npm audit` sai com código != 0 quando encontra vulnerabilidade — o JSON completo
      // continua em err.stdout. Sem stdout válido, propaga o erro (fail-closed).
      const stdout = (err as { stdout?: string }).stdout;
      if (typeof stdout === 'string' && stdout.trim().length > 0) {
        return stdout;
      }
      throw err;
    }
  }

  async generateSbom(): Promise<SbomArtifact> {
    const dir = mkdtempSync(path.join(tmpdir(), 'bh360-sbom-'));
    const sbomPath = path.join(dir, 'sbom.cdx.json');
    try {
      // Mesma ferramenta e flags de `npm run security:sbom` (package.json), mas em arquivo
      // temporário para não sujar o working tree a cada sweep.
      execSync(
        `npx --no-install cyclonedx-npm --ignore-npm-errors --output-reproducible --output-format JSON --output-file "${sbomPath}"`,
        {
          cwd: this.cwd,
          encoding: 'utf-8',
          env: cleanAuditEnv(),
          maxBuffer: MAX_BUFFER,
        },
      );
      const content = readFileSync(sbomPath);
      const bom = JSON.parse(content.toString('utf-8')) as { components?: unknown };
      return {
        sha256Digest: createHash('sha256').update(content).digest('hex'),
        componentCount: countCycloneDxComponents(bom.components),
        generatedAt: new Date().toISOString(),
      };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  readWaiversMarkdown(): string {
    return readFileSync(path.join(this.cwd, 'docs', 'security', 'AUDIT_WAIVERS.md'), 'utf-8');
  }
}

/** Conta componentes CycloneDX recursivamente (components[].components). */
export function countCycloneDxComponents(components: unknown): number {
  if (!Array.isArray(components)) return 0;
  let count = 0;
  for (const component of components) {
    count += 1;
    if (component && typeof component === 'object') {
      count += countCycloneDxComponents((component as { components?: unknown }).components);
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Parser: `npm audit --json` → SecurityVulnerability[]
// ---------------------------------------------------------------------------

type NpmAuditViaAdvisory = {
  source?: number | string;
  name?: string;
  dependency?: string;
  title?: string;
  url?: string;
  severity?: string;
  range?: string;
  fixAvailable?: unknown;
};

type NpmAuditVulnerabilityEntry = {
  name?: string;
  severity?: string;
  via?: Array<string | NpmAuditViaAdvisory>;
};

type NpmAuditReport = {
  auditReportVersion?: number;
  vulnerabilities?: Record<string, NpmAuditVulnerabilityEntry>;
  metadata?: unknown;
  error?: unknown;
};

const SEVERITY_MAP: Record<string, VulnerabilitySeverity> = {
  info: 'LOW',
  low: 'LOW',
  moderate: 'MEDIUM',
  medium: 'MEDIUM',
  high: 'HIGH',
  critical: 'CRITICAL',
};

const GHSA_RE = /GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/i;
const CVE_RE = /CVE-\d{4}-\d{3,7}/i;
const ISO_DATE_RE = /\d{4}-\d{2}-\d{2}/;

function normalizeSeverity(raw: string | undefined): VulnerabilitySeverity {
  const key = (raw ?? '').toLowerCase();
  return SEVERITY_MAP[key] ?? 'MEDIUM';
}

/** Extrai GHSA-.../CVE-... da URL/título do advisory; fallback estável para npm audit. */
export function extractAdvisoryId(...texts: Array<string | undefined>): string {
  for (const text of texts) {
    if (!text) continue;
    const ghsa = text.match(GHSA_RE);
    if (ghsa) return ghsa[0].toUpperCase();
    const cve = text.match(CVE_RE);
    if (cve) return cve[0].toUpperCase();
  }
  return 'UNKNOWN-ADVISORY';
}

/**
 * Faz o parse FAIL-CLOSED do relatório `npm audit --json` (mesma validação de
 * scripts/security/check-audit-waivers.ts: payload de erro do registry não pode ser
 * confundido com "zero vulnerabilidades").
 */
export function parseAuditReport(stdout: string): NpmAuditReport {
  const parsed = JSON.parse(stdout) as NpmAuditReport;
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    parsed.error != null ||
    parsed.auditReportVersion !== 2 ||
    parsed.vulnerabilities == null ||
    typeof parsed.vulnerabilities !== 'object' ||
    parsed.metadata == null ||
    typeof parsed.metadata !== 'object'
  ) {
    throw new Error(
      '`npm audit` did not return a valid audit report; refusing to emit a sweep report.',
    );
  }
  return parsed;
}

/**
 * Converte `vulnerabilities` do npm audit em `SecurityVulnerability[]`.
 *
 * O npm audit representa dependência indireta como cadeia: `via` mistura strings
 * (nome de outro pacote) e objetos (advisory real, sempre na folha). Entradas cujos
 * `via` são só strings são dependentes da cadeia — o advisory real já aparece na
 * entrada-folha, então são ignoradas aqui para não duplicar o mesmo achado.
 */
export function parseNpmAuditVulnerabilities(
  report: NpmAuditReport,
): Array<Omit<SecurityVulnerability, 'waiverReference'>> {
  const findings = new Map<string, Omit<SecurityVulnerability, 'waiverReference'>>();
  const vulnerabilities = report.vulnerabilities ?? {};

  for (const [packageKey, entry] of Object.entries(vulnerabilities)) {
    for (const via of entry.via ?? []) {
      if (typeof via === 'string') continue; // referência de cadeia, não advisory

      const advisoryId = extractAdvisoryId(via.url, via.title);
      const cveId =
        advisoryId !== 'UNKNOWN-ADVISORY'
          ? advisoryId
          : `NPM-AUDIT-${String(via.source ?? packageKey)}`;
      const packageName = via.name ?? entry.name ?? packageKey;
      const dedupeKey = `${packageName}|${cveId}`;
      if (findings.has(dedupeKey)) continue;

      const fixAvailable =
        via.fixAvailable && typeof via.fixAvailable === 'object'
          ? (via.fixAvailable as { version?: string }).version
          : undefined;

      findings.set(dedupeKey, {
        cveId,
        packageName,
        affectedVersionRange: via.range ?? '',
        severity: normalizeSeverity(via.severity ?? entry.severity),
        fixedInVersion: fixAvailable,
        description: via.title ?? `Vulnerabilidade reportada pelo npm audit em ${packageName}`,
      });
    }
  }

  return [...findings.values()];
}

// ---------------------------------------------------------------------------
// Parser: docs/security/AUDIT_WAIVERS.md → waivers com expiração
// ---------------------------------------------------------------------------

export interface AuditWaiver {
  /** ID canônico do waiver = primeiro advisory ID listado na seção. */
  key: string;
  /** Todos os advisory IDs (GHSA/CVE) cobertos pela seção, maiúsculos. */
  advisoryIds: string[];
  /**
   * Data de reavaliação como instante UTC de fim do dia declarado (o waiver vale
   * ATÉ o fim do dia da reavaliação). `null` quando a seção não declara data
   * parseável — waiver sem expiração verificável NÃO é aplicado (fail-closed).
   */
  expiresAt: Date | null;
  reason: string;
}

const ADVISORY_ID_RE = /GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}|CVE-\d{4}-\d{3,7}/gi;
// `expired_at:` é a forma machine-readable usada em `.trivyignore.yaml` e citada nas
// seções de waiver; tem precedência sobre datas em prosa.
const EXPIRED_AT_RE = /expired_at:\s*`?(\d{4}-\d{2}-\d{2})/i;
// "Reavaliar ..." é a instrução futura; "Reavaliado em" é evento passado (histórico)
// e não define expiração — por isso a linha é pulada antes do match.
const REEVALUATE_LINE_RE = /reavaliado/i;
const REEVALUATE_KEYWORD_RE = /reavali/i;

function endOfUtcDay(dateIso: string): Date | null {
  const match = dateIso.match(ISO_DATE_RE);
  if (!match) return null;
  const [year, month, day] = match[0].split('-').map(Number);
  // Fim do dia UTC declarado: o waiver cobre até 23:59:59.999 do dia de reavaliação.
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}

function extractWaiverReason(chunk: string): string {
  // "Motivo" é o campo usual; alguns waivers usam "Por que é aceito temporariamente".
  const motivoMatch = chunk.match(
    /\*\*(?:Motivo|Por que[^:*]*?):\*\*\s*([\s\S]*?)(?=\n-\s+\*\*|\n###|$)/i,
  );
  if (motivoMatch?.[1]) {
    return motivoMatch[1].replace(/\s+/g, ' ').replace(/\*\*/g, '').trim();
  }
  const firstLine = chunk.split('\n').find((l) => l.trim().length > 0) ?? '';
  return firstLine.replace(/[`*#>-]/g, '').trim();
}

function extractWaiverExpiry(chunk: string): Date | null {
  const expiredAt = chunk.match(EXPIRED_AT_RE);
  if (expiredAt?.[1]) {
    const date = endOfUtcDay(expiredAt[1]);
    if (date) return date;
  }

  // Varre linha a linha mantendo o offset real dentro do chunk (evita indexOf()
  // ambíguo quando a mesma linha se repete na seção).
  let offset = 0;
  for (const line of chunk.split('\n')) {
    const lineStart = offset;
    offset += line.length + 1;
    if (REEVALUATE_LINE_RE.test(line)) continue; // "Reavaliado em" = passado
    if (!REEVALUATE_KEYWORD_RE.test(line)) continue;
    // Data DEPOIS da palavra-chave (a mesma linha pode trazer "Data de registro" antes).
    const keywordIdx = line.search(REEVALUATE_KEYWORD_RE);
    const tail = line.slice(keywordIdx);
    const dateMatch = tail.match(ISO_DATE_RE);
    if (dateMatch) {
      const date = endOfUtcDay(dateMatch[0]);
      if (date) return date;
    }
    // Reavaliação em prosa sem data na mesma linha (ex.: "quando o Prisma publicar"):
    // tenta a janela curta seguinte dentro da mesma seção antes de desistir.
    const rest = chunk.slice(lineStart + line.length);
    const windowMatch = rest.slice(0, 300).match(ISO_DATE_RE);
    if (windowMatch) {
      const date = endOfUtcDay(windowMatch[0]);
      if (date) return date;
    }
    return null;
  }
  return null;
}

/**
 * Extrai os waivers da seção `## Waivers ativos` de `docs/security/AUDIT_WAIVERS.md`.
 * Seções `## Débito conhecido` e `## Histórico` NUNCA autorizam waiver (mesma regra
 * de scripts/security/check-audit-waivers.ts). Waiver sem data de reavaliação
 * parseável retorna `expiresAt: null` e é tratado como expirado pelo consumidor.
 */
export function parseAuditWaivers(markdown: string): AuditWaiver[] {
  const activeStart = markdown.search(/^##\s+Waivers ativos\s*$/im);
  if (activeStart === -1) return [];

  const afterStart = markdown.slice(activeStart);
  const nextSection = afterStart.slice(1).search(/^##\s/m);
  const section = nextSection === -1 ? afterStart : afterStart.slice(0, nextSection + 1);

  const chunks = section.split(/^###\s+/m).slice(1);
  const waivers: AuditWaiver[] = [];

  for (const chunk of chunks) {
    const ids = [...new Set((chunk.match(ADVISORY_ID_RE) ?? []).map((id) => id.toUpperCase()))];
    if (ids.length === 0) continue;

    waivers.push({
      key: ids[0],
      advisoryIds: ids,
      expiresAt: extractWaiverExpiry(chunk),
      reason: extractWaiverReason(chunk),
    });
  }

  return waivers;
}

/** `true` quando o waiver tem expiração verificável e ainda não venceu. */
export function isAuditWaiverActive(waiver: AuditWaiver, now: Date): boolean {
  return waiver.expiresAt !== null && waiver.expiresAt.getTime() >= now.getTime();
}

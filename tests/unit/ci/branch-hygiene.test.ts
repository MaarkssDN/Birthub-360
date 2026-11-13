// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
// @ts-expect-error — script Node ESM sem declaração de tipos
import {
  classifyBranches,
  selectBranchesForDeletion,
} from '../../../scripts/git/branch-hygiene.mjs';

const NOW = new Date('2026-11-12T00:00:00Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

const branch = (
  name: string,
  opts: { ageDays?: number; isMerged?: boolean } = {},
) => ({
  name,
  sha: 'a'.repeat(40),
  lastCommitDate: daysAgo(opts.ageDays ?? 10),
  isMerged: opts.isMerged ?? false,
});

describe('classifyBranches — regras de segurança da limpeza (TAREFA-SANEAMENTO-025)', () => {
  it('nunca marca branches protegidas como candidatas', () => {
    const report = classifyBranches({
      branches: [branch('main', { ageDays: 400, isMerged: true }), branch('develop', { ageDays: 400 })],
      openPrHeads: new Set(),
      now: NOW,
    });
    for (const entry of report) {
      expect(entry.decision).toBe('keep');
      expect(entry.autoDeletable).toBe(false);
    }
  });

  it('nunca marca branch com PR aberto como candidata, mesmo mergeada e antiga', () => {
    const report = classifyBranches({
      branches: [branch('feature/x', { ageDays: 200, isMerged: true })],
      openPrHeads: new Set(['feature/x']),
      now: NOW,
    });
    expect(report[0].decision).toBe('keep');
    expect(report[0].reason).toContain('PR aberto');
  });

  it('agente/* recente (<90d) é mantida mesmo mergeada', () => {
    const report = classifyBranches({
      branches: [branch('agente/08A-gitops-saneamento', { ageDays: 30, isMerged: true })],
      openPrHeads: new Set(),
      now: NOW,
    });
    expect(report[0].decision).toBe('keep');
    expect(report[0].reason).toContain('agente/* recente');
  });

  it('agente/* antiga mergeada vira candidata auto-deletável', () => {
    const report = classifyBranches({
      branches: [branch('agente/99-velha', { ageDays: 120, isMerged: true })],
      openPrHeads: new Set(),
      now: NOW,
    });
    expect(report[0].decision).toBe('candidate');
    expect(report[0].autoDeletable).toBe(true);
  });

  it('agente/* antiga NÃO mergeada vai para revisão, nunca auto-delete', () => {
    const report = classifyBranches({
      branches: [branch('agente/99-velha', { ageDays: 120, isMerged: false })],
      openPrHeads: new Set(),
      now: NOW,
    });
    expect(report[0].decision).toBe('review');
    expect(report[0].autoDeletable).toBe(false);
  });

  it('branch comum mergeada e inativa >30d é candidata auto-deletável', () => {
    const report = classifyBranches({
      branches: [branch('fix/velho', { ageDays: 60, isMerged: true })],
      openPrHeads: new Set(),
      now: NOW,
    });
    expect(report[0].decision).toBe('candidate');
    expect(report[0].autoDeletable).toBe(true);
  });

  it('branch comum mergeada recentemente (<30d) é mantida', () => {
    const report = classifyBranches({
      branches: [branch('fix/recente', { ageDays: 5, isMerged: true })],
      openPrHeads: new Set(),
      now: NOW,
    });
    expect(report[0].decision).toBe('keep');
  });

  it('branch NÃO mergeada vai para review mesmo muito antiga', () => {
    const report = classifyBranches({
      branches: [branch('experiment/abandonado', { ageDays: 500, isMerged: false })],
      openPrHeads: new Set(),
      now: NOW,
    });
    expect(report[0].decision).toBe('review');
    expect(report[0].autoDeletable).toBe(false);
    expect(report[0].requiresOptIn).toBe(false);
  });

  it('archive/* >180d exige opt-in explícito (--include-archives)', () => {
    const report = classifyBranches({
      branches: [branch('archive/worktree-agent-abc', { ageDays: 200, isMerged: false })],
      openPrHeads: new Set(),
      now: NOW,
    });
    expect(report[0].decision).toBe('candidate');
    expect(report[0].autoDeletable).toBe(false);
    expect(report[0].requiresOptIn).toBe(true);
  });

  it('archive/* <180d é mantida', () => {
    const report = classifyBranches({
      branches: [branch('archive/recente', { ageDays: 30, isMerged: false })],
      openPrHeads: new Set(),
      now: NOW,
    });
    expect(report[0].decision).toBe('keep');
  });

  it('lança erro em lastCommitDate inválida (sem fallback silencioso)', () => {
    expect(() =>
      classifyBranches({
        branches: [{ name: 'x', lastCommitDate: 'não-é-data', isMerged: false }],
        openPrHeads: new Set(),
        now: NOW,
      }),
    ).toThrow(/lastCommitDate inválida/);
  });
});

describe('selectBranchesForDeletion', () => {
  const report = classifyBranches({
    branches: [
      branch('fix/velha-mergeada', { ageDays: 90, isMerged: true }), // autoDeletable
      branch('archive/antiga', { ageDays: 300, isMerged: false }), // requiresOptIn
      branch('experiment/x', { ageDays: 300, isMerged: false }), // review
      branch('main', { ageDays: 500, isMerged: true }), // keep
    ],
    openPrHeads: new Set(['fix/pr-aberto']),
    now: NOW,
  });

  it('sem includeArchives só deleta autoDeletable', () => {
    expect(selectBranchesForDeletion(report)).toEqual(['fix/velha-mergeada']);
  });

  it('com includeArchives inclui archive/* expiradas', () => {
    expect(selectBranchesForDeletion(report, { includeArchives: true })).toEqual([
      'fix/velha-mergeada',
      'archive/antiga',
    ]);
  });
});

describe('workflows — gates de governança GitOps', () => {
  const hygiene = YAML.parse(readFileSync('.github/workflows/branch-hygiene.yml', 'utf8'));
  const dockerPublish = YAML.parse(readFileSync('.github/workflows/docker-publish.yml', 'utf8'));
  const ci = YAML.parse(readFileSync('.github/workflows/ci.yml', 'utf8'));

  it('branch-hygiene roda audit no schedule e clean só via dispatch com confirmação', () => {
    expect(hygiene.on.schedule).toBeDefined();
    const dispatch = hygiene.on.workflow_dispatch;
    expect(dispatch.inputs.mode.options).toEqual(['audit', 'clean']);
    expect(dispatch.inputs.confirm).toBeDefined();
    const run = hygiene.jobs.hygiene.steps.find((s: { name?: string }) => s.name === 'Rodar branch-hygiene');
    expect(run.env.GH_TOKEN).toContain('secrets.GITHUB_TOKEN');
  });

  it('docker-publish exige SHA + CI verde + integridade de tag e assinatura', () => {
    const steps = dockerPublish.jobs['resolve-sha'].steps;
    const names = steps.map((s: { name?: string }) => s.name);
    expect(names).toContain('Integridade de release — tags anotadas no SHA');
    expect(names).toContain('Integridade de release — assinatura do commit');
    const tagStep = steps.find((s: { name?: string }) => s.name === 'Integridade de release — tags anotadas no SHA');
    expect(tagStep.run).toContain('git cat-file -t');
    expect(tagStep.run).toContain('DEPLOY BLOCKED');
    const sigStep = steps.find((s: { name?: string }) => s.name === 'Integridade de release — assinatura do commit');
    expect(sigStep.with.script).toContain('verification.verified');
    expect(sigStep.with.script).toContain('DEPLOY BLOCKED');
    expect(dockerPublish.on.workflow_dispatch.inputs['allow-unsigned-commit']).toBeDefined();
  });

  it('ci.yml usa cache de node_modules nos dois jobs com npm ci', () => {
    for (const jobName of ['build-and-test', 'visual-baselines']) {
      const steps = ci.jobs[jobName].steps;
      const cacheStep = steps.find((s: { name?: string }) => s.name === 'Cache node_modules (chave exata do lockfile)');
      expect(cacheStep, `cache ausente em ${jobName}`).toBeDefined();
      expect(cacheStep.uses).toContain('actions/cache@');
      const install = steps.find((s: { run?: string }) => s.run === 'npm ci');
      expect(install.if).toContain("cache-hit != 'true'");
      const verify = steps.find((s: { name?: string }) => s.name === 'Verificar node_modules restaurado do cache');
      expect(verify, `verificação de cache ausente em ${jobName}`).toBeDefined();
    }
  });
});

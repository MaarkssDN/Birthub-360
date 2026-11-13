// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';

// TAREFA-SANEAMENTO-025/026/027 (Agente 08A, W5): gates de governança GitOps.
// Estes testes leem os workflows como texto/YAML e asseveram que as proteções
// não sejam removidas silenciosamente por uma edição futura.

const read = (path: string) => readFileSync(path, 'utf8');
const ci = read('.github/workflows/ci.yml');
const publish = read('.github/workflows/docker-publish.yml');
const hygiene = read('.github/workflows/branch-hygiene.yml');

describe('ci.yml — cache de dependências e engines Prisma (BT360-DT-0049)', () => {
  it('setup-node mantém cache npm nos dois jobs', () => {
    expect(ci.match(/cache: 'npm'/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('cache de engines Prisma chaveado pelo lockfile após cada npm ci', () => {
    const cacheBlocks = ci.match(/Cache Prisma engines[\s\S]*?restore-keys:[^\n]*/g) ?? [];
    expect(cacheBlocks.length).toBe(2);
    for (const block of cacheBlocks) {
      expect(block).toContain('node_modules/.prisma');
      expect(block).toContain('hashFiles(\'package-lock.json\')');
    }
    // O cache deve vir DEPOIS do npm ci em cada job (ordem dos steps).
    const installIdx = ci.indexOf('run: npm ci');
    const cacheIdx = ci.indexOf('Cache Prisma engines');
    expect(installIdx).toBeGreaterThan(-1);
    expect(cacheIdx).toBeGreaterThan(installIdx);
  });
});

describe('docker-publish.yml — integridade de release (BT360-DT-0050)', () => {
  it('expõe input opcional de tag de release', () => {
    const doc = YAML.parse(publish) as {
      on: { workflow_dispatch: { inputs: Record<string, { required?: boolean }> } };
    };
    const inputs = doc.on.workflow_dispatch.inputs;
    expect(inputs.sha?.required).toBe(true);
    expect(inputs.tag).toBeDefined();
    expect(inputs.tag.required).toBe(false);
  });

  it('job validate-release exige ancestralidade em origin/main', () => {
    expect(publish).toContain('validate-release:');
    expect(publish).toContain('git merge-base --is-ancestor "$RELEASE_SHA" origin/main');
    expect(publish).toContain('DEPLOY BLOCKED');
  });

  it('tag informada deve ser semver, anotada e apontar para o SHA', () => {
    expect(publish).toContain('v?[0-9]+\\.[0-9]+\\.[0-9]+');
    expect(publish).toContain('git cat-file -t "refs/tags/$RELEASE_TAG"');
    expect(publish).toMatch(/!= "tag"/);
    expect(publish).toContain('git rev-list -n 1 "refs/tags/$RELEASE_TAG"');
  });

  it('publish depende de resolve-sha E validate-release', () => {
    const doc = YAML.parse(publish) as {
      jobs: Record<string, { needs?: string | string[] }>;
    };
    const needs = doc.jobs.publish.needs;
    const list = Array.isArray(needs) ? needs : [needs];
    expect(list).toContain('resolve-sha');
    expect(list).toContain('validate-release');
  });
});

describe('branch-hygiene.yml — expurgo governado de branches (BT360-DT-0048)', () => {
  it('agenda semanal + dispatch manual com dry_run', () => {
    const doc = YAML.parse(hygiene) as {
      on: { schedule?: { cron: string }[]; workflow_dispatch?: unknown };
    };
    expect(doc.on.schedule?.length).toBeGreaterThan(0);
    expect(doc.on.workflow_dispatch).toBeDefined();
    expect(hygiene).toContain('dry_run');
  });

  it('só deleta branch mergeada em main e inativa além do threshold', () => {
    expect(hygiene).toContain('git merge-base --is-ancestor "origin/$branch" origin/main');
    expect(hygiene).toContain('STALE_DAYS');
    expect(hygiene).toContain('git push origin --delete');
  });

  it('protege branches principais e de release/integração', () => {
    expect(hygiene).toContain('integracao');
    expect(hygiene).toContain('release');
    expect(hygiene).toContain('main');
  });

  it('branches não-mergeadas são apenas reportadas, nunca deletadas', () => {
    expect(hygiene).toContain('stale_unmerged');
    // O loop de delete itera apenas sobre to_delete.
    expect(hygiene).toMatch(/for b in "\$\{to_delete\[@\]:-\}"/);
  });
});

// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// BT360-DT-0045 / TAREFA-SANEAMENTO-024: o Dockerfile reinstala a CLI do Prisma
// após `npm prune --omit=dev` (necessária ao `prisma migrate deploy` do CMD e ao
// Job de migração k8s/Helm). A dívida era a reinstalação resolver um range
// semver solto; a correção (commit 508a05271, onda 0) fixa a versão exata
// capturada do node_modules instalado via `npm ci`/lockfile e adiciona um guard
// que derruba o build se CLI/lock/client divergirem. Estes testes transformam
// essa proteção em gate executável — scripts/verify-docker-context.mjs já
// existia mas não era invocado por nenhum script de package.json nem workflow.

const dockerfile = readFileSync('Dockerfile', 'utf8');

describe('Dockerfile — Prisma CLI pinada pelo lockfile (BT360-DT-0045)', () => {
  it('não resolve o range semver de devDependencies.prisma', () => {
    expect(dockerfile).not.toContain('devDependencies.prisma');
  });

  it('captura a versão exata instalada pelo npm ci antes do prune', () => {
    expect(dockerfile).toContain(
      "require('./node_modules/prisma/package.json').version",
    );
    expect(dockerfile).toContain('npm prune --omit=dev');
  });

  it('reinstala a CLI na versão exata capturada, sem tocar no lockfile', () => {
    expect(dockerfile).toContain('npm install --no-save --ignore-scripts "prisma@${prisma_version}"');
  });

  it('falha o build se CLI, lockfile e @prisma/client divergirem', () => {
    expect(dockerfile).toContain("packages['node_modules/prisma'].version");
    expect(dockerfile).toContain('Prisma CLI/client/lock divergentes');
  });

  it('garante o schema-engine após a reinstalação', () => {
    expect(dockerfile).toContain('node node_modules/@prisma/engines/scripts/postinstall.js');
    expect(dockerfile).toContain("name.startsWith('schema-engine-')");
  });

  it('scripts/verify-docker-context.mjs passa de verdade (gate executável)', () => {
    const result = spawnSync('node', ['scripts/verify-docker-context.mjs'], {
      encoding: 'utf8',
    });
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });
});

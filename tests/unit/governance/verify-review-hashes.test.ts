import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  compareHashes,
  computeHashes,
  verifyReviews,
} from '../../../scripts/governance/verify-review-hashes';

describe('verify-review-hashes', () => {
  let dir: string;
  let manifest: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'reviews-'));
    mkdirSync(join(dir, 'onda-2'));
    writeFileSync(join(dir, 'a.md'), 'parecer A\n');
    writeFileSync(join(dir, 'onda-2', 'b.md'), 'parecer B\n');
    manifest = join(tmpdir(), `manifest-${Date.now()}-${Math.random()}.json`);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    rmSync(manifest, { force: true });
  });

  it('calcula SHA-256 com chaves POSIX recursivas', () => {
    const hashes = computeHashes(dir);
    expect(Object.keys(hashes)).toEqual(['a.md', 'onda-2/b.md']);
    expect(hashes['a.md']).toBe(createHash('sha256').update('parecer A\n').digest('hex'));
  });

  it('normaliza CRLF para LF', () => {
    const lf = computeHashes(dir)['a.md'];
    writeFileSync(join(dir, 'a.md'), 'parecer A\r\n');
    expect(computeHashes(dir)['a.md']).toBe(lf);
  });

  it('passa quando o manifesto confere', () => {
    writeFileSync(manifest, JSON.stringify(computeHashes(dir)));
    expect(verifyReviews(dir, manifest).ok).toBe(true);
  });

  it('detecta alterado, removido e não registrado', () => {
    writeFileSync(manifest, JSON.stringify(computeHashes(dir)));
    writeFileSync(join(dir, 'a.md'), 'adulterado\n');
    rmSync(join(dir, 'onda-2', 'b.md'));
    writeFileSync(join(dir, 'c.md'), 'novo\n');
    const result = verifyReviews(dir, manifest);
    expect(result).toEqual({
      ok: false,
      modified: ['a.md'],
      missing: ['onda-2/b.md'],
      unregistered: ['c.md'],
    });
  });

  it('falha se o manifesto não existe', () => {
    expect(() => verifyReviews(dir, manifest)).toThrow(/Manifesto ausente/);
  });

  it('compareHashes é puro', () => {
    expect(compareHashes({ x: '1' }, { x: '1' }).ok).toBe(true);
  });
});

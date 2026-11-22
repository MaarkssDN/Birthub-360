import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const script = resolve(process.cwd(), 'scripts/db/backup-encrypted.sh');
const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'bh360-backup-verify-'));
  tempDirs.push(dir);
  return dir;
}

// Diretório com um `openssl` falso que tem precedência no PATH.
function fakeOpenssl(body: string): string {
  const dir = makeTempDir();
  const bin = join(dir, 'openssl');
  writeFileSync(bin, `#!/usr/bin/env bash\n${body}\n`);
  chmodSync(bin, 0o755);
  return dir;
}

function runVerify(extraPath?: string) {
  const backupDir = makeTempDir();
  const result = spawnSync('bash', [script, '--verify-crypto'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      BACKUP_DIR: backupDir,
      BACKUP_VERIFY_KEY: 'unit-test-only-key',
      PATH: extraPath ? `${extraPath}:${process.env.PATH ?? ''}` : process.env.PATH,
    },
  });
  return { ...result, backupDir };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('scripts/db/backup-encrypted.sh --verify-crypto', () => {
  it('sai com 0 quando o round-trip AES-256 confere e limpa os arquivos temporários', () => {
    const r = runVerify();
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain('validada com sucesso');
    expect(existsSync(join(r.backupDir, 'test_crypto.enc'))).toBe(false);
    expect(existsSync(join(r.backupDir, 'test_crypto.dec'))).toBe(false);
  });

  it('sai com != 0 quando o openssl falha (sem fallback em claro)', () => {
    const r = runVerify(fakeOpenssl('exit 1'));
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('Falha na validação criptográfica');
  });

  it('sai com != 0 quando a decifragem falha', () => {
    const r = runVerify(
      fakeOpenssl(
        'for a in "$@"; do [[ "$a" == "-d" ]] && exit 1; done\nout=""; prev=""\nfor a in "$@"; do [[ "$prev" == "-out" ]] && out="$a"; prev="$a"; done\ncat >/dev/null; printf "CIPHERTEXT" > "$out"',
      ),
    );
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('decifragem com openssl falhou');
  });

  it('sai com != 0 quando o round-trip não confere com o payload original', () => {
    const r = runVerify(
      fakeOpenssl(
        'out=""; prev=""\nfor a in "$@"; do [[ "$prev" == "-out" ]] && out="$a"; prev="$a"; done\ncat >/dev/null 2>&1 || true; printf "OUTRO_CONTEUDO" > "$out"',
      ),
    );
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('round-trip não confere');
  });
});

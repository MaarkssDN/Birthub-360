// scripts/governance/verify-review-hashes.ts
//
// Agente 09 (Silas) — integridade dos pareceres em `.agents/reviews/**`.
// Compara o SHA-256 de cada arquivo com o manifesto `scripts/governance/review-hashes.manifest.json`.
// Falha (exit 1) se um parecer foi alterado, removido ou se há parecer novo fora do manifesto.
// Hash calculado sobre conteúdo normalizado para LF (evita falso positivo por autocrlf).
//
// Uso:  npx tsx scripts/governance/verify-review-hashes.ts            (verifica)
//       npx tsx scripts/governance/verify-review-hashes.ts --update   (regrava o manifesto;
//       só o Agente 09 deve fazê-lo, ao emitir um novo parecer)

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export type HashManifest = Record<string, string>;

export interface VerifyResult {
  ok: boolean;
  modified: string[];
  missing: string[];
  unregistered: string[];
}

export function hashFile(path: string): string {
  const normalized = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

/** Mapa caminho-relativo-POSIX → sha256 de todos os arquivos sob `reviewsDir`. */
export function computeHashes(reviewsDir: string): HashManifest {
  const result: HashManifest = {};
  for (const file of walk(reviewsDir).sort()) {
    result[relative(reviewsDir, file).split(sep).join('/')] = hashFile(file);
  }
  return result;
}

export function compareHashes(expected: HashManifest, actual: HashManifest): VerifyResult {
  const modified = Object.keys(expected).filter((k) => k in actual && actual[k] !== expected[k]);
  const missing = Object.keys(expected).filter((k) => !(k in actual));
  const unregistered = Object.keys(actual).filter((k) => !(k in expected));
  return {
    ok: !modified.length && !missing.length && !unregistered.length,
    modified,
    missing,
    unregistered,
  };
}

export function verifyReviews(reviewsDir: string, manifestPath: string): VerifyResult {
  if (!existsSync(manifestPath)) throw new Error(`Manifesto ausente: ${manifestPath}`);
  const expected = JSON.parse(readFileSync(manifestPath, 'utf8')) as HashManifest;
  return compareHashes(expected, computeHashes(reviewsDir));
}

function main(): void {
  const root = resolve(fileURLToPath(import.meta.url), '..', '..', '..');
  const reviewsDir = join(root, '.agents', 'reviews');
  const manifestPath = join(root, 'scripts', 'governance', 'review-hashes.manifest.json');

  if (process.argv.includes('--update')) {
    const hashes = computeHashes(reviewsDir);
    writeFileSync(manifestPath, `${JSON.stringify(hashes, null, 2)}\n`);
    console.log(`Manifesto atualizado: ${Object.keys(hashes).length} arquivos.`);
    return;
  }

  const result = verifyReviews(reviewsDir, manifestPath);
  if (result.ok) {
    console.log('Pareceres de .agents/reviews/ íntegros.');
    return;
  }
  for (const [label, list] of [
    ['ALTERADO', result.modified],
    ['REMOVIDO', result.missing],
    ['NÃO REGISTRADO', result.unregistered],
  ] as const) {
    for (const f of list) console.error(`${label}: ${f}`);
  }
  process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import * as unzipper from 'unzipper';

// Guard de fixtures (decorrente de TAREFA-SANEAMENTO-049 / BT360-DT-0058, handoff
// .agents/handoffs/onda-saneamento-20261110/11-para-08-guard-de-fixtures-contra-reintroducao-de-marcas-legadas-em-tests-fixtures.md):
// garante que nenhum arquivo novo em tests/fixtures/** reintroduza marcas legadas
// (AtlasGR, Total Trac, prospector-atlas, cor legada #ff5618 etc.) sem ser detectado.
// O caminho de falha é validado contra buffers sintéticos em memória — nenhum
// fixture sujo é commitado.

const ROOT_DIR = process.cwd();
const FIXTURES_DIR = path.join(ROOT_DIR, 'tests', 'fixtures');

const LEGACY_BRAND_PATTERNS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: 'AtlasGR', pattern: /atlasgr/i },
  { name: 'Total Trac', pattern: /total[\s_-]*trac/i },
  { name: 'prospector-atlas', pattern: /prospector-atlas/i },
  { name: 'cor legada #ff5618', pattern: /#ff5618/i },
];

function findLegacyBrands(text: string): string[] {
  return LEGACY_BRAND_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(
    ({ name }) => name,
  );
}

function isZipBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

// Extrai texto pesquisável de um arquivo de fixture:
// - ZIP-based (docx/xlsx/pptx...): concatena o conteúdo das entradas de texto
//   (xml, txt, md, json, html, css) — o conteúdo compactado não aparece em scan cru —
//   mais o buffer inteiro em latin-1, para cobrir metadados e nomes de entrada;
// - demais arquivos: scan latin-1 do buffer inteiro — latin-1 preserva todos os
//   bytes como code points, então qualquer token ASCII aparece mesmo dentro de
//   estruturas binárias (content streams PDF não comprimidos, metadados etc.).
async function extractSearchableText(filePath: string, buffer: Buffer): Promise<string> {
  if (!isZipBuffer(buffer)) {
    return buffer.toString('latin1');
  }
  const chunks: string[] = [];
  try {
    const directory = await unzipper.Open.buffer(buffer);
    for (const entry of directory.files) {
      if (entry.type !== 'File') continue;
      if (!/\.(xml|txt|md|json|html?|css)$/i.test(entry.path)) continue;
      const content = await entry.buffer();
      chunks.push(content.toString('utf8'));
    }
  } catch {
    // Buffer com magic PK que não é um ZIP legível: cai no scan cru abaixo.
  }
  chunks.push(buffer.toString('latin1'));
  void filePath;
  return chunks.join('\n');
}

function listFixtureFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFixtureFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Fixtures Brand Hygiene (tests/fixtures/**)', () => {
  it('scanner detecta marcas legadas em buffers sintéticos (caminho de falha)', async () => {
    const dirty = Buffer.from(
      'Documento de teste AtlasGR e link https://x.test/prospector-atlas',
      'utf8',
    );
    const text = await extractSearchableText('synthetic.txt', dirty);
    expect(findLegacyBrands(text)).toEqual(
      expect.arrayContaining(['AtlasGR', 'prospector-atlas']),
    );

    const dirtyColor = Buffer.from('cor de marca #FF5618', 'utf8');
    expect(
      findLegacyBrands(await extractSearchableText('synthetic.css', dirtyColor)),
    ).toContain('cor legada #ff5618');

    const clean = Buffer.from(
      'Fixture de teste - Base de Conhecimento Birth Hub 360',
      'utf8',
    );
    expect(findLegacyBrands(await extractSearchableText('clean.txt', clean))).toEqual([]);
  });

  it('nenhum fixture commitado contém marcas legadas', async () => {
    expect(fs.existsSync(FIXTURES_DIR)).toBe(true);
    const files = listFixtureFiles(FIXTURES_DIR);
    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];
    for (const file of files) {
      const buffer = fs.readFileSync(file);
      const text = await extractSearchableText(file, buffer);
      const hits = findLegacyBrands(text);
      if (hits.length > 0) {
        violations.push(`${path.relative(ROOT_DIR, file)} -> ${hits.join(', ')}`);
      }
    }
    expect(violations).toEqual([]);
  });
});

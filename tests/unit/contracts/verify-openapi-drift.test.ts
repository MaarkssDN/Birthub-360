// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';
import {
  collectCompositionRootSource,
} from '../../../src/shared/contracts/openapiRouteInventory.js';
import { computeSubRouteDrift } from '../../../scripts/verify-openapi-drift.js';

// TAREFA-SANEAMENTO-037 (BT360-DT-0083): o Passe 2 do verify-openapi-drift precisa
// de fato alcançar os routers do Hub de Inteligência/Timeline (incluindo sub-routers
// aninhados via router.use) — antes da correção recursiva esses endpoints ficavam
// invisíveis ao gate. Estes testes exercitam computeSubRouteDrift direto: caminho
// feliz (sem deriva no repo real) e caminho de falha (documento vazio → findings).

const repoRoot = process.cwd();
const bootstrapDir = path.join(repoRoot, 'src', 'bootstrap');

function loadOpenApiPaths(): Record<string, unknown> {
  const doc = parseYaml(readFileSync(path.join(repoRoot, 'docs', 'openapi.yaml'), 'utf8'));
  return (doc.paths ?? {}) as Record<string, unknown>;
}

describe('verify-openapi-drift — Passe 2 recursivo (BT360-DT-0083)', () => {
  it('resolve os routers de feature sem deriva — inclui Inteligência/Timeline', () => {
    const compositionRootSource = collectCompositionRootSource(repoRoot);
    const { findings, resolvedFileCount } = computeSubRouteDrift(
      repoRoot,
      compositionRootSource,
      bootstrapDir,
      loadOpenApiPaths(),
    );

    // Não-vacuidade: o passe precisa ter resolvido uma quantidade real de routers.
    expect(resolvedFileCount).toBeGreaterThan(50);
    expect(findings).toEqual([]);
  });

  it('detecta deriva quando o endpoint não está documentado (caminho de falha)', () => {
    const compositionRootSource = collectCompositionRootSource(repoRoot);
    const { findings } = computeSubRouteDrift(repoRoot, compositionRootSource, bootstrapDir, {});

    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((f) => f.kind === 'undocumented-path')).toBe(true);
  });

  it('documenta os endpoints de inteligência resolvidos pelo passe', () => {
    const compositionRootSource = collectCompositionRootSource(repoRoot);
    const { findings } = computeSubRouteDrift(
      repoRoot,
      compositionRootSource,
      bootstrapDir,
      loadOpenApiPaths(),
    );
    // Se algum endpoint de /intelligence ou /market-intelligence vazar sem doc,
    // o finding aparece aqui — regressão direta da dívida original.
    const intelligenceLeaks = findings.filter(
      (f) => f.docStylePath.startsWith('/intelligence') || f.docStylePath.startsWith('/market-intelligence'),
    );
    expect(intelligenceLeaks).toEqual([]);
  });
});
